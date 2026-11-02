package com.proof.watch.hands

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import com.proof.watch.net.ProofApi

class HandsService : Service(), SensorEventListener {
    private var lastBuzz = 0L
    /** The shared rule (movement, then a stop at the face pose); see TouchDetector. */
    private var detector: TouchDetector? = null
    private var sensorManager: SensorManager? = null
    private val classifier = HandsClassifier()
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val prefs = getSharedPreferences("proof", MODE_PRIVATE)
        try {
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(7, notification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH)
            } else {
                startForeground(7, notification())
            }
        } catch (error: Exception) {
            // Never take the app down: report it on the watch screen and stop quietly.
            prefs.edit()
                .putBoolean("handsOn", false)
                .putString("handsError", error.message?.take(160) ?: error.javaClass.simpleName)
                .apply()
            stopSelf()
            return START_NOT_STICKY
        }
        prefs.edit().remove("handsError").putBoolean("handsOn", true).apply()
        running = true
        // Touching your face turns the screen off; without this the CPU sleeps and the sensors stop, so nothing is counted.
        if (wakeLock == null) {
            wakeLock = getSystemService(PowerManager::class.java)
                ?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "WorthIt:handsOff")
                ?.apply {
                    setReferenceCounted(false)
                    acquire(3 * 60 * 60 * 1000L)
                }
        }
        classifier.restore(ClassifierStore.load(prefs))
        val poses = ClassifierStore.loadPoses(prefs)
        detector = TouchDetector(classifier, poses)
        android.util.Log.i(
            "WorthIt",
            "Hands off started: ready=${classifier.ready} minMotion=${classifier.minMotion} minTurn=${classifier.minTurn} facePoses=${poses.size}",
        )
        sensorManager = getSystemService(SensorManager::class.java)
        sensorManager?.unregisterListener(this) // a second start must not double-register
        sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)?.also {
            sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
        }
        sensorManager?.getDefaultSensor(Sensor.TYPE_GYROSCOPE)?.also {
            sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
        }
        // Not sticky: Android 14 forbids restarting a foreground service from the background, which crashed the app.
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        running = false
        try {
            wakeLock?.takeIf { it.isHeld }?.release()
        } catch (_: Exception) {
            /* already released */
        }
        wakeLock = null
        sensorManager?.unregisterListener(this)
        getSharedPreferences("proof", MODE_PRIVATE).edit().putBoolean("handsOn", false).apply()
        super.onDestroy()
    }

    override fun onSensorChanged(event: SensorEvent) {
        val sample = floatArrayOf(event.values[0], event.values[1], event.values[2])
        val current = detector ?: return
        if (event.sensor.type == Sensor.TYPE_GYROSCOPE) {
            current.addGyro(sample)
            return
        }
        if (paused) {
            current.reset() // never count calibration motions
            return
        }
        if (!current.addAccel(sample)) return
        val now = System.currentTimeMillis()
        if (now - lastBuzz < COOLDOWN_MS) return
        lastBuzz = now
        val features = current.lastFeatures ?: FloatArray(HandsClassifier.FEATURES)
        buzz()
        countToday()
        android.util.Log.i("WorthIt", "Face touch counted: spread=${features[1]} turn=${features[5]}")
        Thread { ProofApi.postEvent("face_touch", mapOf("model" to "watch4")) }.start()
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

    /** Keeps today's count on the watch so the Hands Off page and the tile can show it without the network. */
    private fun countToday() {
        val prefs = getSharedPreferences("proof", MODE_PRIVATE)
        val today = java.time.LocalDate.now().toString()
        val count = if (prefs.getString("touchDay", "") == today) prefs.getInt("touches", 0) else 0
        prefs.edit().putString("touchDay", today).putInt("touches", count + 1).apply()
        try {
            androidx.wear.tiles.TileService.getUpdater(this).requestUpdate(com.proof.watch.tile.TrialTileService::class.java)
        } catch (_: Exception) {
            /* tile not added */
        }
    }

    private fun buzz() {
        val vibrator = getSystemService(Vibrator::class.java) ?: return
        vibrator.vibrate(VibrationEffect.createOneShot(80, VibrationEffect.DEFAULT_AMPLITUDE))
    }

    private fun notification(): Notification {
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) {
            manager.createNotificationChannel(NotificationChannel("proof", "WorthIt", NotificationManager.IMPORTANCE_LOW))
        }
        return Notification.Builder(this, "proof")
            .setContentTitle("WorthIt is counting face touches")
            .setSmallIcon(com.proof.watch.R.drawable.ic_stat_worthit)
            .build()
    }

    companion object {
        private const val COOLDOWN_MS = 4000L

        /** Set by the app while it records calibration, so those motions are not counted as touches. */
        @Volatile
        var paused = false

        /** True only while the service is really running in this process (false after a reinstall or a kill). */
        @Volatile
        var running = false
            private set

        fun start(context: Context) {
            val intent = Intent(context, HandsService::class.java)
            context.startForegroundService(intent)
            context.getSharedPreferences("proof", Context.MODE_PRIVATE).edit().putBoolean("handsOn", true).apply()
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, HandsService::class.java))
            context.getSharedPreferences("proof", Context.MODE_PRIVATE).edit().putBoolean("handsOn", false).apply()
        }
    }
}
