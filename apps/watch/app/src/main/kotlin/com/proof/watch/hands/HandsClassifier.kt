package com.proof.watch.hands

import kotlin.math.sqrt

/**
 * Windowed accel/gyro features and a two-class nearest-centroid classifier.
 * Features: movement (mean, spread, peak, jerk of |accel|, mean and peak |gyro|) plus wrist orientation
 * (the average gravity direction), because a hand at the face points the watch a distinctive way.
 */
class HandsClassifier {
    private val positive = mutableListOf<FloatArray>()
    private val negative = mutableListOf<FloatArray>()
    private var mean = FloatArray(FEATURES)
    private var scale = FloatArray(FEATURES) { 1f }
    var ready: Boolean = false
        private set

    /** Minimum spread of |accel| (m/s²) and peak wrist rotation (rad/s) a window needs before it can be a touch. */
    var minMotion = 0.6f
        private set
    var minTurn = 0.8f
        private set

    fun addTouch(features: FloatArray) {
        positive += features.copyOf()
    }

    fun addOther(features: FloatArray) {
        negative += features.copyOf()
    }

    fun finishCalibration() {
        val all = positive + negative
        if (positive.isEmpty() || negative.isEmpty() || all.isEmpty()) {
            ready = false
            return
        }
        mean = FloatArray(FEATURES) { index -> all.map { it[index] }.average().toFloat() }
        scale = FloatArray(FEATURES) { index ->
            val variance = all.map { val d = it[index] - mean[index]; d * d }.average()
            // Floors so a feature that barely varied during calibration cannot dominate the distance.
            // Orientation (indices 6-8, unit vector) gets a higher floor so wrist angle alone never decides.
            sqrt(variance).toFloat().coerceAtLeast(if (index >= 6) 0.25f else 0.1f)
        }
        computeGates()
        ready = true
    }

    /**
     * Movement gates learned from your own touches: half of the lower-quartile spread and wrist rotation
     * of the recorded face touches, with sane floors so a still wrist can never pass.
     */
    private fun computeGates() {
        if (positive.isEmpty()) return
        val spreads = positive.map { it[1] }.sorted()
        val turns = positive.map { it[5] }.sorted()
        minMotion = (spreads[spreads.size / 4] * 0.5f).coerceIn(0.45f, 3f)
        minTurn = (turns[turns.size / 4] * 0.5f).coerceIn(0.6f, 6f)
    }

    /** True when a window shows a real hand movement, not a resting wrist or sensor noise. */
    fun isMoving(features: FloatArray): Boolean {
        if (features.size != FEATURES) return false
        val hasGyro = features[4] > 0f || features[5] > 0f
        return features[1] >= minMotion && (!hasGyro || features[5] >= minTurn)
    }

    fun classify(features: FloatArray): String? {
        if (!ready || features.size != FEATURES) return null
        val z = FloatArray(FEATURES) { (features[it] - mean[it]) / scale[it] }
        val pos = centroid(positive, mean, scale)
        val neg = centroid(negative, mean, scale)
        val dp = distance(z, pos)
        val dn = distance(z, neg)
        if (!isMoving(features)) return "other"
        // Clearly closer to your touches than to everything else, not just marginally.
        return if (dp < dn * 0.75f) "face" else "other"
    }

    fun snapshot(): Snapshot = Snapshot(positive.toList(), negative.toList(), mean, scale, ready)

    fun restore(snapshot: Snapshot) {
        val valid = snapshot.mean.size == FEATURES && snapshot.scale.size == FEATURES &&
            (snapshot.positive + snapshot.negative).all { it.size == FEATURES }
        if (!valid) {
            // Saved by an older version with a different feature set: start calibration fresh.
            positive.clear(); negative.clear()
            mean = FloatArray(FEATURES); scale = FloatArray(FEATURES) { 1f }; ready = false
            return
        }
        positive.clear(); positive += snapshot.positive
        negative.clear(); negative += snapshot.negative
        mean = snapshot.mean
        scale = snapshot.scale
        ready = snapshot.ready
        computeGates()
    }

    data class Snapshot(
        val positive: List<FloatArray>,
        val negative: List<FloatArray>,
        val mean: FloatArray,
        val scale: FloatArray,
        val ready: Boolean,
    )

    companion object {
        const val FEATURES = 9

        fun features(accel: List<FloatArray>, gyro: List<FloatArray>): FloatArray? {
            if (accel.size < 8) return null
            val mag = accel.map { norm(it) }
            val gmag = if (gyro.isEmpty()) List(mag.size) { 0f } else gyro.map { norm(it) }
            val meanA = mag.average().toFloat()
            val stdA = std(mag, meanA)
            val maxA = mag.maxOrNull() ?: 0f
            var jerk = 0f
            for (i in 1 until mag.size) jerk += kotlin.math.abs(mag[i] - mag[i - 1])
            jerk /= (mag.size - 1)
            // Average gravity direction over the window, as a unit vector: which way the watch faces.
            val gx = accel.map { it[0] }.average().toFloat()
            val gy = accel.map { it[1] }.average().toFloat()
            val gz = accel.map { it[2] }.average().toFloat()
            val g = sqrt(gx * gx + gy * gy + gz * gz).coerceAtLeast(1e-3f)
            return floatArrayOf(meanA, stdA, maxA, jerk, gmag.average().toFloat(), gmag.maxOrNull() ?: 0f, gx / g, gy / g, gz / g)
        }

        private fun norm(v: FloatArray) = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])

        private fun std(values: List<Float>, mean: Float): Float {
            if (values.size < 2) return 0f
            val v = values.sumOf { val d = (it - mean).toDouble(); d * d } / (values.size - 1)
            return sqrt(v).toFloat()
        }

        private fun centroid(rows: List<FloatArray>, mean: FloatArray, scale: FloatArray): FloatArray {
            val z = rows.map { row -> FloatArray(FEATURES) { (row[it] - mean[it]) / scale[it] } }
            return FloatArray(FEATURES) { index -> z.map { it[index] }.average().toFloat() }
        }

        private fun distance(a: FloatArray, b: FloatArray): Float {
            var s = 0f
            for (i in a.indices) {
                val d = a[i] - b[i]
                s += d * d
            }
            return sqrt(s)
        }
    }
}
