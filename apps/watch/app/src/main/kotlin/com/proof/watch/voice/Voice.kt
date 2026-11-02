package com.proof.watch.voice

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaPlayer
import android.media.MediaRecorder
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.max
import kotlin.math.sqrt

/** Records one spoken answer as a 16 kHz mono WAV, the format Sarvam speech-to-text takes. */
class VoiceRecorder {
    @Volatile private var stopRequested = false

    /** Ends the recording now (the DONE button). */
    fun stop() {
        stopRequested = true
    }

    /**
     * Blocks until the person stops talking (about 1.2 s of quiet after speech), [stop] is called,
     * or the time limit passes. Returns null when the microphone cannot be opened.
     */
    @SuppressLint("MissingPermission")
    fun record(onLevel: (Float) -> Unit): ByteArray? {
        val minBuffer = AudioRecord.getMinBufferSize(RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
        if (minBuffer <= 0) return null
        val recorder = try {
            AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION, RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, max(minBuffer, RATE))
        } catch (_: Exception) {
            return null
        }
        if (recorder.state != AudioRecord.STATE_INITIALIZED) {
            recorder.release()
            return null
        }
        val pcm = ByteArrayOutputStream()
        val frame = ShortArray(RATE / 10)
        val bytes = ByteArray(frame.size * 2)
        var floor = Double.MAX_VALUE
        var elapsedMs = 0
        var loudMs = 0
        var quietMs = 0
        var spoke = false
        var firstLoud = -1
        var lastLoudEnd = 0
        try {
            recorder.startRecording()
            while (!stopRequested) {
                val n = recorder.read(frame, 0, frame.size)
                if (n <= 0) break
                var sum = 0.0
                for (i in 0 until n) {
                    val s = frame[i].toInt()
                    sum += (s * s).toDouble()
                    bytes[2 * i] = (s and 0xff).toByte()
                    bytes[2 * i + 1] = ((s shr 8) and 0xff).toByte()
                }
                val frameStart = pcm.size()
                pcm.write(bytes, 0, n * 2)
                val rms = sqrt(sum / n)
                onLevel((rms / 3000.0).coerceIn(0.0, 1.0).toFloat())
                val ms = n * 1000 / RATE
                elapsedMs += ms
                floor = minOf(floor, rms)
                val loud = rms > max(floor * 3.0, 350.0)
                if (loud) {
                    loudMs += ms
                    quietMs = 0
                    if (loudMs >= 200) spoke = true
                    if (firstLoud < 0) firstLoud = frameStart
                    lastLoudEnd = pcm.size()
                } else {
                    quietMs += ms
                }
                if (spoke && quietMs >= 1000) break
                if (!spoke && elapsedMs >= 6000) break
                if (elapsedMs >= 10000) break
            }
        } catch (_: Exception) {
            /* send what was recorded */
        } finally {
            try {
                recorder.stop()
            } catch (_: Exception) {
            }
            recorder.release()
        }
        val all = pcm.toByteArray()
        if (!spoke || firstLoud < 0) return wav(all)
        // Only the speech, with a little lead-in and tail, so the upload stays small.
        val from = (firstLoud - RATE * 2 * 4 / 10).coerceAtLeast(0) and 1.inv()
        val to = (lastLoudEnd + RATE * 2 / 2).coerceAtMost(all.size) and 1.inv()
        return wav(all.copyOfRange(from, to))
    }

    companion object {
        const val RATE = 16000

        fun wav(pcm: ByteArray): ByteArray {
            val header = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN).apply {
                put("RIFF".toByteArray()); putInt(36 + pcm.size); put("WAVE".toByteArray())
                put("fmt ".toByteArray()); putInt(16); putShort(1); putShort(1); putInt(RATE); putInt(RATE * 2); putShort(2); putShort(16)
                put("data".toByteArray()); putInt(pcm.size)
            }
            return header.array() + pcm
        }
    }
}

/** Plays the laptop's spoken reply through the watch speaker. */
object VoicePlayer {
    private var player: MediaPlayer? = null
    private var onDone: (() -> Unit)? = null

    fun play(context: Context, wav: ByteArray, done: () -> Unit) {
        stop()
        onDone = done
        try {
            loudEnough(context)
            val file = File(context.cacheDir, "voice-reply").apply { writeBytes(wav) }
            player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build(),
                )
                setDataSource(file.absolutePath)
                setOnCompletionListener { finish() }
                setOnErrorListener { _, _, _ -> finish(); true }
                prepare()
                start()
            }
        } catch (_: Exception) {
            finish()
        }
    }

    /** Stops playback and moves straight on, as if it had finished (the SKIP button). */
    fun finish() {
        val done = onDone
        onDone = null
        release()
        done?.invoke()
    }

    /** Stops playback without moving on (closing the voice log). */
    fun stop() {
        onDone = null
        release()
    }

    private fun release() {
        player?.let {
            try {
                it.stop()
            } catch (_: Exception) {
            }
            it.release()
        }
        player = null
    }

    /** A muted or near-silent media volume would make the prompt inaudible during the demo. */
    private fun loudEnough(context: Context) {
        val audio = context.getSystemService(AudioManager::class.java) ?: return
        val maxVolume = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        val target = (maxVolume * 0.7).toInt()
        if (audio.getStreamVolume(AudioManager.STREAM_MUSIC) < target) {
            try {
                audio.setStreamVolume(AudioManager.STREAM_MUSIC, target, 0)
            } catch (_: Exception) {
            }
        }
    }
}
