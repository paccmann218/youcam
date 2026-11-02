package com.proof.watch.hands

import java.util.ArrayDeque
import kotlin.math.sqrt

/**
 * Turns a stream of sensor samples into counted face touches. Used by Hands Off and by the accuracy test,
 * so the test measures exactly the rule that counts.
 *
 * A touch counts only when, in order:
 *  1. a real hand movement matches your calibrated touches for a short stretch (about 0.15 s), then
 *  2. the hand stops (about 0.3 s of stillness) within about 1.8 s, and
 *  3. it stops at your face pose: the watch is angled the way it was while you held your face in calibration.
 * A wave, a sip, or a wrist flick moves through without settling at that angle, so it is not counted.
 * After a count, the hand has to settle for about a second before the next touch can count.
 *
 * Time is measured in accelerometer samples (about 50 a second), so a recording can be replayed exactly.
 */
class TouchDetector(private val classifier: HandsClassifier, savedPoses: List<FloatArray>) {
    private val accel = ArrayDeque<FloatArray>()
    private val gyro = ArrayDeque<FloatArray>()
    private var tick = 0
    private var streak = 0
    private var armed = true
    private var quiet = 0
    private var candidateAt = -1
    private var dwell = 0

    /** Face poses (unit gravity vectors) to compare against, and how close the angle must be. */
    private val poses: List<FloatArray>
    private val poseCos: Float

    /** Movement features of the window that started the last counted touch (for logging). */
    var lastFeatures: FloatArray? = null
        private set

    init {
        if (savedPoses.isNotEmpty()) {
            poses = savedPoses
            poseCos = 0.85f // within about 32°
        } else {
            // Older calibration without held poses: approximate with the average orientation of the touch windows.
            val touches = classifier.snapshot().positive
            poses = if (touches.isEmpty()) {
                emptyList()
            } else {
                val v = FloatArray(3) { i -> touches.map { it[6 + i] }.average().toFloat() }
                listOf(unit(v))
            }
            poseCos = 0.7f // looser, because this is only an approximation
        }
    }

    fun addGyro(sample: FloatArray) {
        gyro.addLast(sample)
        while (gyro.size > WINDOW) gyro.removeFirst()
    }

    /** Feed one accelerometer sample. Returns true when a face touch is recognised. */
    fun addAccel(sample: FloatArray): Boolean {
        tick++
        accel.addLast(sample)
        while (accel.size > WINDOW) accel.removeFirst()
        if (accel.size < 40 || !classifier.ready) return false
        if (candidateAt >= 0) return dwellStep()

        val features = HandsClassifier.features(accel.toList(), gyro.toList()) ?: return false
        if (!classifier.isMoving(features)) {
            streak = 0
            if (++quiet >= QUIET_TO_REARM) armed = true
            return false
        }
        quiet = 0
        if (!armed) return false

        streak = if (classifier.classify(features) == "face") streak + 1 else 0
        if (streak < STREAK) return false

        // The movement looked like a touch. Now it has to stop at the face.
        streak = 0
        armed = false
        candidateAt = tick
        dwell = 0
        lastFeatures = features
        return false
    }

    private fun dwellStep(): Boolean {
        if (tick - candidateAt > DWELL_WINDOW) {
            candidateAt = -1 // moved past the face without stopping: not a touch
            dwell = 0
            return false
        }
        val recent = accel.toList().takeLast(SHORT)
        val mags = recent.map { norm(it) }
        val meanMag = mags.average().toFloat()
        val spread = sqrt(mags.map { (it - meanMag) * (it - meanMag) }.average()).toFloat()
        val turning = gyro.toList().takeLast(SHORT).map { norm(it) }.average().takeIf { !it.isNaN() }?.toFloat() ?: 0f
        val still = spread < STILL_SPREAD && turning < STILL_TURN
        val direction = unit(FloatArray(3) { i -> recent.map { it[i] }.average().toFloat() })
        val atFace = poses.isEmpty() || poses.any { dot(it, direction) >= poseCos }

        dwell = if (still && atFace) dwell + 1 else 0
        if (dwell < DWELL) return false
        candidateAt = -1
        dwell = 0
        return true
    }

    fun reset() {
        streak = 0
        armed = true
        quiet = 0
        candidateAt = -1
        dwell = 0
    }

    companion object {
        private const val WINDOW = 50
        private const val SHORT = 16
        /** About 0.15 s of consecutive "face" windows. */
        private const val STREAK = 8
        /** About 0.3 s of stillness at the face. */
        private const val DWELL = 15
        /** The stop has to happen within about 1.8 s of the movement. */
        private const val DWELL_WINDOW = 90
        /** About 1 s of a settled hand before another touch can count. */
        private const val QUIET_TO_REARM = 50
        private const val STILL_SPREAD = 0.35f
        private const val STILL_TURN = 0.7f

        fun norm(v: FloatArray) = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])

        fun unit(v: FloatArray): FloatArray {
            val n = norm(v).coerceAtLeast(1e-3f)
            return floatArrayOf(v[0] / n, v[1] / n, v[2] / n)
        }

        private fun dot(a: FloatArray, b: FloatArray) = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

        /**
         * The face pose from a calibration recording: the first still moment after the hand starts moving,
         * which is the hand held at the face (the user is asked to hold for a second). Null if never still.
         */
        fun facePose(accel: List<FloatArray>): FloatArray? {
            if (accel.size < 30) return null
            val mags = accel.map { norm(it) }
            val start = mags.indexOfFirst { kotlin.math.abs(it - 9.81f) > 1.5f }
            if (start < 0) return null
            var i = start + 1
            while (i + SHORT <= accel.size) {
                val segment = mags.subList(i, i + SHORT)
                val m = segment.average().toFloat()
                val spread = sqrt(segment.map { (it - m) * (it - m) }.average()).toFloat()
                if (spread < STILL_SPREAD) {
                    return unit(FloatArray(3) { axis -> accel.subList(i, i + SHORT).map { it[axis] }.average().toFloat() })
                }
                i += 3
            }
            return null
        }
    }
}
