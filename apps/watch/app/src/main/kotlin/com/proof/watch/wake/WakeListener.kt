package com.proof.watch.wake

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.health.services.client.HealthServices
import androidx.health.services.client.PassiveListenerService
import androidx.health.services.client.data.PassiveListenerConfig
import androidx.health.services.client.data.UserActivityInfo
import androidx.health.services.client.data.UserActivityState
import com.proof.watch.net.ProofApi
import java.util.Calendar

class WakeListener : PassiveListenerService() {
    private var asleep = false

    override fun onUserActivityInfoReceived(info: UserActivityInfo) {
        val state = info.userActivityState
        if (state == UserActivityState.USER_ACTIVITY_ASLEEP) asleep = true
        if (asleep && state != UserActivityState.USER_ACTIVITY_ASLEEP && state != UserActivityState.USER_ACTIVITY_UNKNOWN) {
            asleep = false
            WakeAlarm.buzz(this, "health-services")
        }
    }

    companion object {
        fun arm(context: Context) {
            try {
                val client = HealthServices.getClient(context)
                val config = PassiveListenerConfig.builder()
                    .setShouldUserActivityInfoBeRequested(true)
                    .build()
                client.passiveMonitoringClient.setPassiveListenerServiceAsync(WakeListener::class.java, config)
            } catch (_: Exception) {
                /* Health Services is not available on every image. The alarm remains. */
            }
        }
    }
}

class WakeAlarm : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        buzz(context, "alarm")
    }

    companion object {
        fun buzz(context: Context, source: String) {
            val vibrator = context.getSystemService(Vibrator::class.java)
            vibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 80, 60, 80), -1))
            Thread { ProofApi.postEvent("wake", mapOf("trigger" to source, "phrase" to "Same light. Same time.")) }.start()
        }

        fun schedule(context: Context, hour: Int, minute: Int) {
            val alarm = context.getSystemService(AlarmManager::class.java)
            val intent = Intent(context, WakeAlarm::class.java)
            val pending = PendingIntent.getBroadcast(context, 3, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            val whenMs = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                if (timeInMillis < System.currentTimeMillis()) add(Calendar.DATE, 1)
            }.timeInMillis
            alarm.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, whenMs, pending)
        }
    }
}
