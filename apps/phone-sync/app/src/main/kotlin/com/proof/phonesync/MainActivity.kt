package com.proof.phonesync

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.MenstruationPeriodRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

class MainActivity : ComponentActivity() {
    private val permissions = setOf(
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(MenstruationPeriodRecord::class),
    )

    private val permissionLauncher = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract(),
    ) { granted ->
        if (granted.containsAll(permissions)) sync()
    }

    private lateinit var client: HealthConnectClient
    private var baseUrl = ""
    private var pairCode = ""
    private var onStatus: (String) -> Unit = {}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val prefs = getSharedPreferences("proof", MODE_PRIVATE)
        val availability = HealthConnectClient.getSdkStatus(this)
        if (availability == HealthConnectClient.SDK_AVAILABLE) {
            client = HealthConnectClient.getOrCreate(this)
        }
        setContent {
            var base by remember { mutableStateOf(prefs.getString("base", "http://10.168.189.167:3000") ?: "") }
            var pair by remember { mutableStateOf(prefs.getString("pair", "") ?: "") }
            var status by remember { mutableStateOf(if (::client.isInitialized) "Health Connect is on this phone." else "Health Connect is not available.") }
            onStatus = { status = it }
            MaterialTheme {
                Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("WorthIt sync", style = MaterialTheme.typography.headlineMedium)
                    Text("Sleep comes from the Galaxy Watch through Samsung Health into Health Connect. Skin temperature is not read: the Watch4 does not have that sensor.")
                    TextField(value = base, onValueChange = { base = it }, label = { Text("Server") })
                    TextField(value = pair, onValueChange = { pair = it }, label = { Text("Pair code") })
                    Button(onClick = {
                        baseUrl = base.trim()
                        pairCode = pair.trim()
                        prefs.edit().putString("base", baseUrl).putString("pair", pairCode).apply()
                        if (!::client.isInitialized) {
                            status = "Install Health Connect, then connect Samsung Health."
                            return@Button
                        }
                        CoroutineScope(Dispatchers.Main).launch {
                            val granted = client.permissionController.getGrantedPermissions()
                            if (granted.containsAll(permissions)) sync() else permissionLauncher.launch(permissions)
                        }
                    }) { Text("Sync last night") }
                    Text(status)
                }
            }
        }
    }

    private fun sync() {
        baseUrl = getSharedPreferences("proof", MODE_PRIVATE).getString("base", baseUrl) ?: baseUrl
        pairCode = getSharedPreferences("proof", MODE_PRIVATE).getString("pair", pairCode) ?: pairCode
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val end = Instant.now()
                val start = end.minus(Duration.ofDays(2))
                val sleep = client.readRecords(
                    ReadRecordsRequest(SleepSessionRecord::class, timeRangeFilter = TimeRangeFilter.between(start, end)),
                )
                val latest = sleep.records.maxByOrNull { it.endTime }
                val hours = latest?.let { Duration.between(it.startTime, it.endTime).toMinutes() / 60.0 }
                val periods = client.readRecords(
                    ReadRecordsRequest(MenstruationPeriodRecord::class, timeRangeFilter = TimeRangeFilter.between(end.minus(Duration.ofDays(40)), end)),
                )
                val today = LocalDate.now()
                val onPeriod = periods.records.any { record ->
                    val from = record.startTime.atZone(ZoneId.systemDefault()).toLocalDate()
                    val to = record.endTime.atZone(ZoneId.systemDefault()).toLocalDate()
                    !today.isBefore(from) && !today.isAfter(to)
                }
                val body = JSONObject()
                    .put("day", today.toString())
                    .put("sleepHours", hours ?: JSONObject.NULL)
                if (onPeriod) body.put("cyclePhase", "menstrual")
                val url = URL("${baseUrl.trimEnd('/')}/api/ingest?pair=$pairCode")
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("X-Proof-Pair", pairCode)
                    doOutput = true
                }
                conn.outputStream.use { it.write(body.toString().toByteArray()) }
                val code = conn.responseCode
                runOnUiThread {
                    onStatus(if (code in 200..299) "Synced ${hours ?: "no"} h of sleep." else "Server answered $code.")
                }
            } catch (error: Exception) {
                runOnUiThread { onStatus(error.message ?: "Sync failed.") }
            }
        }
    }
}
