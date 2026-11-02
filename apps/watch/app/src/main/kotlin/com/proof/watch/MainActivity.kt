package com.proof.watch

import android.content.SharedPreferences
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import androidx.wear.compose.material.TimeText
import androidx.wear.tiles.TileService
import com.proof.watch.hands.ClassifierStore
import com.proof.watch.hands.HandsClassifier
import com.proof.watch.hands.HandsService
import com.proof.watch.hands.TouchDetector
import com.proof.watch.net.ProofApi
import com.proof.watch.tile.TrialTileService
import com.proof.watch.ui.Brutal
import com.proof.watch.ui.BrutalButton
import com.proof.watch.ui.Chip
import com.proof.watch.ui.Label
import com.proof.watch.ui.PageDots
import com.proof.watch.ui.Sticker
import com.proof.watch.ui.brutal
import java.time.LocalDate

class MainActivity : ComponentActivity(), SensorEventListener {
    // Guided recording: raw samples for the capture on screen only.
    private val recordedAccel = ArrayList<FloatArray>()
    private val recordedGyro = ArrayList<FloatArray>()
    private var recording = false
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var sensors: SensorManager
    private lateinit var prefs: SharedPreferences

    // UI state, read by the pages below.
    private var status by mutableStateOf("Watch4 · no skin-temperature sensor on this model.")
    private var calTouches by mutableStateOf(0)
    /** The guided recording on screen, or null. */
    private var capturing by mutableStateOf<Capture?>(null)
    /** false = "get ready", true = recording now. */
    private var captureLive by mutableStateOf(false)
    private var captureProgress by mutableStateOf(0f)
    private var otherWindows by mutableStateOf(0)
    private var calibrated by mutableStateOf(false)
    private var touchesToday by mutableStateOf(0)
    private var listening by mutableStateOf(false)
    private var verdictKind by mutableStateOf("")
    private var verdictLine by mutableStateOf("")
    private var trialDay by mutableStateOf("—")
    private var morningDone by mutableStateOf(false)
    private var eveningDone by mutableStateOf(false)
    private var pulling by mutableStateOf(false)
    /** null = checking, true = the laptop answered, false = it did not. */
    private var connected by mutableStateOf<Boolean?>(null)

    private val prefsListener = SharedPreferences.OnSharedPreferenceChangeListener { p, key ->
        when (key) {
            "touches", "touchDay" -> touchesToday = todayCount(p)
            "handsOn" -> listening = p.getBoolean("handsOn", false)
            "handsError" -> p.getString("handsError", null)?.let { status = "Hands off couldn't start: $it" }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        sensors = getSystemService(SensorManager::class.java)
        prefs = getSharedPreferences("proof", MODE_PRIVATE)
        val saved = HandsClassifier().also { it.restore(ClassifierStore.load(prefs)) }.snapshot()
        calibrated = saved.ready
        calTouches = saved.positive.size
        otherWindows = saved.negative.size
        touchesToday = todayCount(prefs)
        listening = prefs.getBoolean("handsOn", false)
        trialDay = prefs.getString("trialDay", "—") ?: "—"
        verdictKind = prefs.getString("verdict", "") ?: ""
        verdictLine = prefs.getString("verdictLine", "") ?: ""
        morningDone = prefs.getString("morningDay", "") == today()
        eveningDone = prefs.getString("eveningDay", "") == today()
        prefs.registerOnSharedPreferenceChangeListener(prefsListener)
        // Keep the screen awake while WorthIt is open, so the counter stays visible during a demo.
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        // Older builds needed a separate FINISH tap; finish now if the examples are already there.
        if (!calibrated) autoCalibrate(HandsClassifier().also { it.restore(ClassifierStore.load(prefs)) })

        setContent { WorthItWatch() }
    }

    /* ------------------------------------------------------------------ app */

    @Composable
    private fun WorthItWatch() {
        val pager = rememberPagerState(pageCount = { 4 })
        // No pairing: sync with the laptop as soon as the app opens.
        LaunchedEffect(Unit) { pullVerdict() }
        BackHandler(enabled = capturing != null) { cancelCapture() }
        MaterialTheme {
            Box(Modifier.fillMaxSize().background(Brutal.Ink)) {
                HorizontalPager(state = pager, modifier = Modifier.fillMaxSize(), userScrollEnabled = capturing == null) { page ->
                    when (page) {
                        0 -> HandsPage()
                        1 -> RoutinePage()
                        2 -> VerdictPage()
                        else -> SetupPage()
                    }
                }
                TimeText(timeTextStyle = TextStyle(color = Brutal.Ink, fontSize = 12.sp, fontWeight = FontWeight.Black))
                PageDots(count = 4, current = pager.currentPage, modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 7.dp))
                capturing?.let { CaptureOverlay(it) }
            }
        }
    }

    /** A full-screen coloured page whose content is centred, and scrolls if it is taller than the screen. */
    @Composable
    private fun Page(color: Color, content: @Composable ColumnScope.() -> Unit) {
        BoxWithConstraints(Modifier.fillMaxSize().background(color)) {
            val viewport = maxHeight
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
                Column(
                    modifier = Modifier.fillMaxWidth().heightIn(min = viewport).padding(horizontal = 22.dp, vertical = 26.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(7.dp, Alignment.CenterVertically),
                    content = content,
                )
            }
        }
    }

    /* ------------------------------------------------------------------ page 1: hands off */

    @Composable
    private fun HandsPage() = Page(Brutal.Yellow) {
        Sticker("HANDS OFF", textColor = Brutal.Yellow)
        Text(
            touchesToday.toString(),
            color = Brutal.Ink,
            fontSize = 50.sp,
            fontWeight = FontWeight.Black,
            fontFamily = FontFamily.Monospace,
        )
        Text("face touches today", color = Brutal.Ink, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        Chip(if (listening) "● LISTENING" else "PAUSED", if (listening) Brutal.Mint else Brutal.White)
        BrutalButton(
            text = if (listening) "STOP" else "START",
            color = if (listening) Brutal.Pink else Brutal.Mint,
            emoji = if (listening) "✋" else "👀",
        ) {
            if (listening) {
                HandsService.stop(this@MainActivity)
                status = "Hands off stopped."
            } else {
                HandsService.start(this@MainActivity)
                status = "Listening. Raise your hand to your face and hold it there."
            }
        }
        Text("Raise your hand from your side up to your face.", color = Brutal.Ink, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    }

    /* ------------------------------------------------------------------ page 2: routine */

    @Composable
    private fun RoutinePage() = Page(Brutal.Mint) {
        Sticker("TODAY", textColor = Brutal.Mint, tilt = 3f)
        Text("Log your routine", color = Brutal.Ink, fontSize = 15.sp, fontWeight = FontWeight.Black)
        BrutalButton(
            text = if (morningDone) "✓ MORNING SCAN" else "MORNING SCAN",
            color = if (morningDone) Brutal.White else Brutal.Yellow,
            emoji = if (morningDone) null else "☀️",
            modifier = Modifier.fillMaxWidth(),
        ) { checkoff("morning") }
        BrutalButton(
            text = if (eveningDone) "✓ USED PRODUCT" else "USED PRODUCT",
            color = if (eveningDone) Brutal.White else Brutal.Pink,
            emoji = if (eveningDone) null else "🧴",
            modifier = Modifier.fillMaxWidth(),
        ) { checkoff("evening") }
        Text("Shows up on your laptop instantly", color = Brutal.Ink, fontSize = 10.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
    }

    /* ------------------------------------------------------------------ page 3: verdict */

    @Composable
    private fun VerdictPage() = Page(Brutal.Lilac) {
        val (label, fill) = verdictStyle(verdictKind)
        Sticker("YOUR PRODUCT", textColor = Brutal.Lilac)
        Text("DAY $trialDay", color = Brutal.Ink, fontSize = 24.sp, fontWeight = FontWeight.Black)
        Box(Modifier.padding(end = Brutal.Shadow, bottom = Brutal.Shadow).brutal(fill, RoundedCornerShape(14.dp)).padding(horizontal = 14.dp, vertical = 8.dp)) {
            Text(label, color = Brutal.Ink, fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 0.6.sp, textAlign = TextAlign.Center)
        }
        if (verdictLine.isNotBlank()) {
            Text(
                verdictLine,
                color = Brutal.Ink,
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
            )
        }
        BrutalButton(text = if (pulling) "LOADING…" else "REFRESH", color = Brutal.Sky, emoji = "🔄", small = true, enabled = !pulling) { pullVerdict() }
    }

    /* ------------------------------------------------------------------ page 4: setup */

    @Composable
    private fun SetupPage() = Page(Brutal.Pink) {
        Sticker("SETUP", textColor = Brutal.Pink, tilt = 3f)
        Text(status, color = Brutal.Ink, fontSize = 10.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, maxLines = 3)

        Spacer(Modifier.height(2.dp))
        Label("LAPTOP")
        Chip(
            text = when (connected) {
                true -> "🔗 CONNECTED"
                false -> "NOT REACHABLE"
                null -> "CHECKING…"
            },
            fill = when (connected) {
                true -> Brutal.Mint
                false -> Brutal.White
                null -> Brutal.Yellow
            },
        )
        Text(ProofApi.server.removePrefix("http://").removePrefix("https://"), color = Brutal.Ink, fontSize = 9.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
        if (connected == false) {
            Text("Same Wi-Fi as the laptop, and the web app open?", color = Brutal.Ink, fontSize = 9.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center)
        }
        BrutalButton(if (pulling) "CHECKING…" else "CHECK AGAIN", Brutal.Yellow, emoji = "🔄", small = true, enabled = !pulling) { pullVerdict() }

        Spacer(Modifier.height(4.dp))
        Label("TEACH IT YOUR TOUCH")
        Chip(if (calibrated) "CALIBRATED ✓" else "NOT CALIBRATED", if (calibrated) Brutal.Mint else Brutal.White)
        Text("1 · touch face 5×   2 · move 10 s · done automatically", color = Brutal.Ink, fontSize = 9.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
        BrutalButton(
            text = "TOUCH FACE  ${calTouches.coerceAtMost(5)}/5",
            color = if (calTouches >= 5) Brutal.Mint else Brutal.White,
            emoji = "✋",
            small = true,
            modifier = Modifier.fillMaxWidth(),
        ) { startCapture(Capture.TOUCH) }
        BrutalButton(
            text = if (otherWindows > 0) "OTHER MOVES ✓" else "OTHER MOVES · 10s",
            color = if (otherWindows > 0) Brutal.Mint else Brutal.White,
            emoji = "🤸",
            small = true,
            modifier = Modifier.fillMaxWidth(),
        ) { startCapture(Capture.OTHER) }
        if (calTouches > 0 || otherWindows > 0) {
            BrutalButton("START OVER", Brutal.White, small = true) { resetCalibration() }
        }

        Spacer(Modifier.height(4.dp))
        Label("MORNING BUZZ")
        BrutalButton("ARM WAKE BUZZ", Brutal.Sky, emoji = "⏰", small = true, modifier = Modifier.fillMaxWidth()) {
            com.proof.watch.wake.WakeListener.arm(this@MainActivity)
            com.proof.watch.wake.WakeAlarm.schedule(this@MainActivity, 7, 30)
            status = "Wake armed. Alarm at 07:30 if sleep detection misses."
        }

        Spacer(Modifier.height(4.dp))
        Label("ACCURACY TEST")
        Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            BrutalButton("FACE", Brutal.White, small = true, enabled = calibrated) { startCapture(Capture.TEST_FACE) }
            BrutalButton("OTHER", Brutal.White, small = true, enabled = calibrated) { startCapture(Capture.TEST_OTHER) }
        }
        Spacer(Modifier.height(10.dp))
    }

    /* ------------------------------------------------------------------ guided recording overlay */

    @Composable
    private fun CaptureOverlay(kind: Capture) {
        val fill = when (kind) {
            Capture.TOUCH -> Brutal.Yellow
            Capture.OTHER -> Brutal.Sky
            else -> Brutal.Lilac
        }
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(fill)
                // Swallow taps so nothing on the page underneath can be pressed.
                .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null) {},
            contentAlignment = Alignment.Center,
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 26.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Sticker(if (captureLive) "● RECORDING" else "GET READY", textColor = fill)
                Text(kind.emoji, fontSize = 30.sp)
                Text(kind.title, color = Brutal.Ink, fontSize = 15.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center)
                Text(
                    if (captureLive) kind.liveText else kind.readyText,
                    color = Brutal.Ink,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                )
                Box(Modifier.fillMaxWidth().height(12.dp).brutal(Brutal.White, Brutal.Pill, shadow = 0.dp)) {
                    Box(
                        Modifier
                            .fillMaxWidth(if (captureLive) captureProgress else 0f)
                            .fillMaxHeight()
                            .background(Brutal.Ink, Brutal.Pill),
                    )
                }
                BrutalButton("CANCEL", Brutal.White, small = true) { cancelCapture() }
            }
        }
    }

    /* ------------------------------------------------------------------ actions */

    /**
     * Guided, time-boxed recording. 1.5 s "get ready", a buzz, then [Capture.seconds] of raw sensor data,
     * then a double buzz. The old version fired on any accelerometer reading above 2.5 m/s², which gravity
     * (about 9.8) always exceeds, so it recorded the button tap instead of the face touch.
     */
    private fun startCapture(kind: Capture) {
        if (capturing != null) return
        recordedAccel.clear()
        recordedGyro.clear()
        captureProgress = 0f
        captureLive = false
        capturing = kind
        HandsService.paused = true // calibration motions must not be counted as face touches
        listen() // warm the sensors up during "get ready"
        handler.postDelayed({
            if (capturing != kind) return@postDelayed
            recordedAccel.clear()
            recordedGyro.clear()
            recording = true
            captureLive = true
            vibrate(longArrayOf(0, 90))
            val started = SystemClock.uptimeMillis()
            val total = kind.seconds * 1000L
            handler.post(object : Runnable {
                override fun run() {
                    if (capturing != kind) return
                    val elapsed = SystemClock.uptimeMillis() - started
                    captureProgress = (elapsed.toFloat() / total).coerceIn(0f, 1f)
                    if (elapsed >= total) finishCapture(kind) else handler.postDelayed(this, 80)
                }
            })
        }, 1500)
    }

    private fun cancelCapture() {
        HandsService.paused = false
        handler.removeCallbacksAndMessages(null)
        recording = false
        sensors.unregisterListener(this)
        capturing = null
        captureLive = false
        status = "Cancelled."
    }

    private fun finishCapture(kind: Capture) {
        HandsService.paused = false
        recording = false
        sensors.unregisterListener(this)
        vibrate(longArrayOf(0, 60, 80, 60))
        val windows = windowFeatures(recordedAccel.toList(), recordedGyro.toList())
        val classifier = HandsClassifier().also { it.restore(ClassifierStore.load(prefs)) }
        when (kind) {
            Capture.TOUCH -> {
                // The one-second window with the most jerk is the hand travelling to the face.
                val best = windows.maxByOrNull { it[3] }
                if (best == null || best[1] < 0.2f) {
                    status = "Didn't feel a touch. Try a clear hand-to-face move."
                } else {
                    classifier.addTouch(best)
                    ClassifierStore.save(prefs, classifier)
                    // The angle the watch held while your hand rested on your face: the "stop at the face" check.
                    TouchDetector.facePose(recordedAccel.toList())?.let { ClassifierStore.addPose(prefs, it) }
                    calTouches = classifier.snapshot().positive.size
                    val ready = autoCalibrate(classifier)
                    status = when {
                        ready -> "Touch $calTouches saved ✓ Calibrated. Hands off is ready."
                        calTouches >= 3 -> "Touch $calTouches saved ✓ Now record other moves."
                        else -> "Touch $calTouches of 5 saved ✓"
                    }
                }
            }
            Capture.OTHER -> {
                // Keep every window, still ones included, so "other" also covers a resting wrist.
                val moving = windows
                moving.forEach { classifier.addOther(it) }
                ClassifierStore.save(prefs, classifier)
                otherWindows = classifier.snapshot().negative.size
                val ready = autoCalibrate(classifier)
                status = when {
                    moving.isEmpty() -> "Nothing recorded. Try again."
                    ready -> "Saved ${moving.size} moves ✓ Calibrated. Hands off is ready."
                    else -> "Saved ${moving.size} moves ✓ Now touch your face a few times."
                }
            }
            Capture.TEST_FACE, Capture.TEST_OTHER -> {
                val label = if (kind == Capture.TEST_FACE) "face" else "other"
                // Replay the recording through the same detector Hands Off runs, so Lab measures the real rule.
                val detector = TouchDetector(classifier, ClassifierStore.loadPoses(prefs))
                val accelSamples = recordedAccel.toList()
                val gyroSamples = recordedGyro.toList()
                var gyroIndex = 0
                var detected = false
                accelSamples.forEachIndexed { index, sample ->
                    val gyroUntil = if (accelSamples.isEmpty()) 0 else ((index + 1).toLong() * gyroSamples.size / accelSamples.size).toInt()
                    while (gyroIndex < gyroUntil) detector.addGyro(gyroSamples[gyroIndex++])
                    if (detector.addAccel(sample)) detected = true
                }
                val predicted = if (detected) "face" else "other"
                Thread { ProofApi.postEvent("gesture_test", mapOf("label" to label, "predicted" to predicted)) }.start()
                status = if (predicted == label) "Test ✓ It heard $predicted. Logged in Lab." else "Test ✗ You did $label, it heard $predicted. Logged in Lab."
            }
        }
        capturing = null
        captureLive = false
    }

    /** One-second windows (about 50 accelerometer samples), stepping half a second, same size Hands Off uses. */
    private fun windowFeatures(accel: List<FloatArray>, gyro: List<FloatArray>): List<FloatArray> {
        val size = 50
        if (accel.size < 16) return emptyList()
        if (accel.size <= size) return listOfNotNull(HandsClassifier.features(accel, gyro))
        val out = mutableListOf<FloatArray>()
        var start = 0
        while (start + size <= accel.size) {
            val window = accel.subList(start, start + size)
            val gyroWindow = if (gyro.isEmpty()) {
                emptyList()
            } else {
                val from = (start.toLong() * gyro.size / accel.size).toInt().coerceIn(0, gyro.size)
                val to = ((start + size).toLong() * gyro.size / accel.size).toInt().coerceIn(from, gyro.size)
                gyro.subList(from, to)
            }
            HandsClassifier.features(window, gyroWindow)?.let { out += it }
            start += size / 2
        }
        return out
    }

    /**
     * Calibration finishes itself once there are at least 3 face touches and some normal moves.
     * (A separate FINISH tap was easy to miss, which left Hands off unable to recognise anything.)
     */
    private fun autoCalibrate(classifier: HandsClassifier): Boolean {
        val snapshot = classifier.snapshot()
        if (snapshot.positive.size < 3 || snapshot.negative.isEmpty()) return false
        classifier.finishCalibration()
        ClassifierStore.save(prefs, classifier)
        calibrated = classifier.ready
        // A running service reloads the calibration when it is started again.
        if (classifier.ready && HandsService.running) HandsService.start(this)
        return classifier.ready
    }

    private fun resetCalibration() {
        ClassifierStore.clear(prefs)
        calTouches = 0
        otherWindows = 0
        calibrated = false
        status = "Calibration cleared. Start with 5 face touches."
    }

    private fun vibrate(pattern: LongArray) {
        getSystemService(Vibrator::class.java)?.vibrate(VibrationEffect.createWaveform(pattern, -1))
    }

    private fun pullVerdict() {
        pulling = true
        Thread {
            val summary = ProofApi.summary()
            val kind = summary?.optString("kind") ?: ""
            val line = summary?.optString("line") ?: "Could not reach the laptop. Same Wi-Fi, and the web app running?"
            val day = summary?.opt("trialDay")?.takeIf { it != org.json.JSONObject.NULL }?.toString() ?: "—"
            val serverTouches = summary?.optInt("faceTouches", -1) ?: -1
            val checkoffs = summary?.optJSONObject("checkoffs")
            if (summary != null) prefs.edit().apply {
                putString("trialDay", day)
                putString("verdict", kind)
                putString("verdictLine", line)
                if (serverTouches > todayCount(prefs)) putString("touchDay", today()).putInt("touches", serverTouches)
                if (checkoffs?.optBoolean("morning") == true) putString("morningDay", today())
                if (checkoffs?.optBoolean("evening") == true) putString("eveningDay", today())
            }.apply()
            runOnUiThread {
                connected = summary != null
                if (summary == null) {
                    pulling = false
                    status = "Laptop not reachable at ${ProofApi.server}."
                    return@runOnUiThread
                }
                verdictKind = kind
                verdictLine = line
                trialDay = day
                if (checkoffs?.optBoolean("morning") == true) morningDone = true
                if (checkoffs?.optBoolean("evening") == true) eveningDone = true
                pulling = false
            }
            refreshTile()
        }.start()
    }

    private fun listen() {
        sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)?.also {
            sensors.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
        }
        sensors.getDefaultSensor(Sensor.TYPE_GYROSCOPE)?.also {
            sensors.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
        }
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (!recording) return
        val sample = floatArrayOf(event.values[0], event.values[1], event.values[2])
        if (event.sensor.type == Sensor.TYPE_GYROSCOPE) recordedGyro += sample else recordedAccel += sample
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

    private fun checkoff(slot: String) {
        Thread { ProofApi.postEvent("checkoff", mapOf("slot" to slot)) }.start()
        getSystemService(Vibrator::class.java)?.vibrate(VibrationEffect.createOneShot(40, 80))
        prefs.edit().putString(if (slot == "morning") "morningDay" else "eveningDay", today()).apply()
        if (slot == "morning") morningDone = true else eveningDone = true
    }

    private fun refreshTile() {
        try {
            TileService.getUpdater(this).requestUpdate(TrialTileService::class.java)
        } catch (_: Exception) {
            /* tile not added yet */
        }
    }

    override fun onResume() {
        super.onResume()
        if (prefs.getBoolean("handsOn", false) && !HandsService.running) {
            // It was on, but the process restarted (reinstall, reboot, or the system stopped it). Start it again.
            HandsService.start(this)
        }
        listening = prefs.getBoolean("handsOn", false)
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        prefs.unregisterOnSharedPreferenceChangeListener(prefsListener)
        sensors.unregisterListener(this)
        super.onDestroy()
    }

    companion object {
        fun today(): String = LocalDate.now().toString()

        fun todayCount(p: SharedPreferences): Int = if (p.getString("touchDay", "") == today()) p.getInt("touches", 0) else 0

        /** Matches the web app's verdict labels. */
        fun verdictStyle(kind: String): Pair<String, Color> = when (kind) {
            "working" -> "WORTH IT ✓" to Brutal.Mint
            "no_effect" -> "NOT WORTH IT" to Brutal.White
            "wrong_way" -> "MAKING IT WORSE" to Brutal.Pink
            "too_early" -> "TOO EARLY" to Brutal.Yellow
            "unidentified" -> "FINISH SETUP" to Brutal.White
            else -> "TAP REFRESH" to Brutal.White
        }
    }
}

/** The guided recordings: how long they run and what the screen says. */
private enum class Capture(
    val seconds: Int,
    val emoji: String,
    val title: String,
    val readyText: String,
    val liveText: String,
) {
    TOUCH(4, "✋", "TOUCH YOUR FACE", "When it buzzes, touch your cheek or chin and hold it there for a second.", "Now! Touch your face and hold for a second."),
    OTHER(10, "🤸", "MOVE NORMALLY", "When it buzzes: type, drink, wave, scratch your head.", "Keep moving normally. No face touches."),
    TEST_FACE(4, "🎯", "TEST: TOUCH FACE", "When it buzzes, touch your face once, like you normally would.", "Touch your face now."),
    TEST_OTHER(4, "🎯", "TEST: SOMETHING ELSE", "When it buzzes: wave, sip a drink, or flick your wrist.", "Any move that isn't a face touch."),
}
