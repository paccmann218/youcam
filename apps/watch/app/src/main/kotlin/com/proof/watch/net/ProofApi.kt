package com.proof.watch.net

import com.proof.watch.BuildConfig
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/** Talks straight to the WorthIt server set at build time. There is no pairing step. */
object ProofApi {
    val server: String get() = BuildConfig.SERVER_URL.trimEnd('/')

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

    private fun request(method: String, path: String, body: String?): String? {
        return try {
            val conn = (URL("$server$path").openConnection() as HttpURLConnection).apply {
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
