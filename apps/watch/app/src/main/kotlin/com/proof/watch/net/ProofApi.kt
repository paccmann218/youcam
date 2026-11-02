package com.proof.watch.net

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import com.proof.watch.BuildConfig
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/** Talks straight to the WorthIt server set at build time. There is no pairing step. */
object ProofApi {
    val server: String get() = BuildConfig.SERVER_URL.trimEnd('/')

    /**
     * Wear OS routes traffic over the phone's Bluetooth link when it can, which is far too slow for audio.
     * When Wi-Fi is up, requests go straight over it. Set by [useWifi].
     */
    @Volatile var wifi: Network? = null

    fun useWifi(context: Context) {
        val manager = context.getSystemService(ConnectivityManager::class.java) ?: return
        val request = NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        try {
            manager.requestNetwork(request, object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    wifi = network
                }

                override fun onLost(network: Network) {
                    if (wifi == network) wifi = null
                }
            })
        } catch (_: Exception) {
            /* stay on the default route */
        }
    }

    private fun open(path: String): HttpURLConnection {
        val url = URL("$server$path")
        return ((wifi?.openConnection(url)) ?: url.openConnection()) as HttpURLConnection
    }

    fun postEvent(type: String, payload: Map<String, Any?>) {
        val body = JSONObject().put("type", type).put("payload", JSONObject(payload + ("source" to "watch")))
        request("POST", "/api/events", body.toString())
    }

    /** The verdict summary, or null if the server could not be reached. */
    fun summary(): JSONObject? {
        val text = request("GET", "/api/trial", null) ?: return null
        val json = JSONObject(text)
        return if (json.has("kind")) json else null
    }

    fun ingest(body: JSONObject) {
        request("POST", "/api/ingest", body.toString())
    }

    /**
     * One turn of the spoken product log. Sends the step, what is known so far and the recorded answer;
     * the laptop transcribes it with Sarvam and replies with words plus base64 WAV speech.
     */
    fun voice(step: String, product: String, ingredient: String, clip: ByteArray?): JSONObject? {
        return try {
            val boundary = "worthit${System.nanoTime()}"
            val conn = open("/api/voice").apply {
                requestMethod = "POST"
                doOutput = true
                setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
                connectTimeout = 8000
                readTimeout = 60000
            }
            conn.outputStream.use { out ->
                fun field(name: String, value: String) =
                    out.write("--$boundary\r\nContent-Disposition: form-data; name=\"$name\"\r\n\r\n$value\r\n".toByteArray())
                field("step", step)
                field("product", product)
                field("ingredient", ingredient)
                if (clip != null) {
                    out.write("--$boundary\r\nContent-Disposition: form-data; name=\"audio\"; filename=\"answer.wav\"\r\nContent-Type: audio/wav\r\n\r\n".toByteArray())
                    out.write(clip)
                    out.write("\r\n".toByteArray())
                }
                out.write("--$boundary--\r\n".toByteArray())
            }
            val stream = if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream
            stream?.bufferedReader()?.use { JSONObject(it.readText()) }
        } catch (_: Exception) {
            null
        }
    }

    private fun request(method: String, path: String, body: String?): String? {
        return try {
            val conn = open(path).apply {
                requestMethod = method
                setRequestProperty("Content-Type", "application/json")
                connectTimeout = 8000
                readTimeout = 8000
                if (body != null) {
                    doOutput = true
                    outputStream.use { it.write(body.toByteArray()) }
                }
            }
            val stream = if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream
            stream?.bufferedReader()?.use { it.readText() }
        } catch (_: Exception) {
            null
        }
    }
}
