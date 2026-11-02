package com.proof.watch.hands

import kotlin.math.abs
import kotlin.math.sqrt

/**
 * Counts a face touch when the forearm is raised from hanging at the side up to face height.
 *
 * On a watch, the strap runs along Y. Hanging down puts gravity on Y. At the face the forearm is
 * roughly level, so Y drops and gravity sits across the watch (X) or out of the glass (Z).
 * One raise counts once. The arm has to drop again before the next raise counts.
 * Sample counts, not the clock, so a recorded gesture replays the same way.
 *
 * The classifier arguments stay so older call sites compile. This rule does not use them:
 * calibration was missing real raises.
 */
class TouchDetector(
    @Suppress("UNUSED_PARAMETER") classifier: HandsClassifier,
    @Suppress("UNUSED_PARAMETER") savedPoses: List<FloatArray>,
) {
    private var gx = 0f
    private var gy = 0f
    private var gz = 0f
    private var filtered = false
    private var sinceDown = LARGE
    private var hold = 0
    private var locked = false

    /** Movement features of the window that started the last counted touch (for logging). */
    var lastFeatures: FloatArray? = null
        private set

    fun addGyro(sample: FloatArray) {
        // Orientation comes from the accelerometer. Gyro is accepted so callers can keep feeding it.
        if (sample.size < 3) return
    }

    /** Feed one accelerometer sample. Returns true when the hand has been raised to the face. */
    fun addAccel(sample: FloatArray): Boolean {
        val alpha = 0.28f
        if (!filtered) {
            gx = sample[0]
            gy = sample[1]
            gz = sample[2]
            filtered = true
        } else {
            gx += alpha * (sample[0] - gx)
            gy += alpha * (sample[1] - gy)
            gz += alpha * (sample[2] - gz)
        }

        val hanging = abs(gy) > HANGING_Y && gz < HANGING_Z_MAX
        val atFace = abs(gy) < RAISED_Y && (gz > RAISED_Z || abs(gx) > RAISED_X)

        if (hanging) {
            sinceDown = 0
            hold = 0
            if (locked) locked = false
            return false
        }
        if (sinceDown < LARGE) sinceDown++
        if (locked || !atFace) {
            hold = 0
            return false
        }
        // The lift has to start from a hanging arm. A hand that is already up does not keep counting.
        if (sinceDown > RAISE_WINDOW) {
            hold = 0
            return false
        }
        hold++
        if (hold < HOLD) return false

        locked = true
        hold = 0
        lastFeatures = floatArrayOf(gx, abs(gy), gz, 0f, 0f, 0f, gx, gy, gz)
        return true
    }

    fun reset() {
        sinceDown = LARGE
        hold = 0
        locked = false
    }

    companion object {
        private const val SHORT = 16
        private const val STILL_SPREAD = 0.35f
        /** |accel Y| while the arm is hanging. Gravity on a watch sits along the strap. */
        private const val HANGING_Y = 6.0f
        /** Watch glass is not already pointed up while the arm is hanging. */
        private const val HANGING_Z_MAX = 5.0f
        /** |accel Y| once the forearm has come up. */
        private const val RAISED_Y = 5.0f
        /** Glass tilted up toward the face, or gravity across the watch if the face stays vertical. */
        private const val RAISED_Z = 1.0f
        private const val RAISED_X = 4.0f
        /** About 0.2 s at face height, at the game sensor rate. */
        private const val HOLD = 8
        /** The raise has to finish within about 2.5 s of the arm leaving the side. */
        private const val RAISE_WINDOW = 120
        private const val LARGE = 10_000

        fun norm(v: FloatArray) = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])

        fun unit(v: FloatArray): FloatArray {
            val n = norm(v).coerceAtLeast(1e-3f)
            return floatArrayOf(v[0] / n, v[1] / n, v[2] / n)
        }

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
