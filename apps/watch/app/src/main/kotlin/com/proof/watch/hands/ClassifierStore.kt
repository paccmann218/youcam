package com.proof.watch.hands

import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

object ClassifierStore {
    fun save(prefs: SharedPreferences, classifier: HandsClassifier) {
        val snap = classifier.snapshot()
        val json = JSONObject()
            .put("ready", snap.ready)
            .put("positive", encode(snap.positive))
            .put("negative", encode(snap.negative))
            .put("mean", JSONArray(snap.mean.toList()))
            .put("scale", JSONArray(snap.scale.toList()))
        prefs.edit().putString("classifier", json.toString()).apply()
    }

    fun load(prefs: SharedPreferences): HandsClassifier.Snapshot {
        val raw = prefs.getString("classifier", null) ?: return empty()
        return try {
            val json = JSONObject(raw)
            HandsClassifier.Snapshot(
                positive = decode(json.getJSONArray("positive")),
                negative = decode(json.getJSONArray("negative")),
                mean = floats(json.getJSONArray("mean")),
                scale = floats(json.getJSONArray("scale")),
                ready = json.optBoolean("ready"),
            )
        } catch (_: Exception) {
            empty()
        }
    }

    private fun empty() = HandsClassifier.Snapshot(
        emptyList(),
        emptyList(),
        FloatArray(HandsClassifier.FEATURES),
        FloatArray(HandsClassifier.FEATURES) { 1f },
        false,
    )

    fun clear(prefs: SharedPreferences) {
        prefs.edit().remove("classifier").remove("facePoses").apply()
    }

    /** Face poses (unit gravity vectors) recorded while the hand was held at the face during calibration. */
    fun loadPoses(prefs: SharedPreferences): List<FloatArray> {
        val raw = prefs.getString("facePoses", null) ?: return emptyList()
        return try {
            decode(JSONArray(raw)).filter { it.size == 3 }
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun addPose(prefs: SharedPreferences, pose: FloatArray) {
        val poses = loadPoses(prefs) + pose
        prefs.edit().putString("facePoses", encode(poses.takeLast(12)).toString()).apply()
    }

    private fun encode(rows: List<FloatArray>): JSONArray {
        val array = JSONArray()
        rows.forEach { row -> array.put(JSONArray(row.toList())) }
        return array
    }

    private fun decode(array: JSONArray): List<FloatArray> {
        return List(array.length()) { index -> floats(array.getJSONArray(index)) }
    }

    private fun floats(array: JSONArray) = FloatArray(array.length()) { array.getDouble(it).toFloat() }
}
