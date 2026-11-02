package com.proof.phonesync

import android.Manifest
import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.MenstruationPeriodRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

private val Paper = Color(0xFFF7F2EA)
private val CardColor = Color(0xFFFFFCF7)
private val Ink = Color(0xFF1C1814)
private val Quiet = Color(0xFF6B6259)
private val Line = Color(0xFFE5DCCE)
private val Clay = Color(0xFFB25030)

/** Port 3000 on the phone is the laptop when `adb reverse tcp:3000 tcp:3000` is set over USB. */
private const val USB_DESK = "http://127.0.0.1:3000"
private const val DESK_PORT = 3000

class MainActivity : ComponentActivity() {
    private sealed interface Stage {
        data object Connecting : Stage
        data object Ready : Stage
        data class Offline(val reason: String) : Stage
    }

    private val sleepPermission = HealthPermission.getReadPermission(SleepSessionRecord::class)
    private val periodPermission = HealthPermission.getReadPermission(MenstruationPeriodRecord::class)
    private val healthPermissions = setOf(sleepPermission, periodPermission)

    private lateinit var prefs: SharedPreferences
    private lateinit var desk: WebView
    private var health: HealthConnectClient? = null
    private var proxy: LocalProxy? = null
    private var origin: String? = null
    private var connecting: Job? = null

    private var stage by mutableStateOf<Stage>(Stage.Connecting)
    private var pageProgress by mutableIntStateOf(0)
    private var server by mutableStateOf("")

    private var webPermission: PermissionRequest? = null
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var pendingPhoto: Uri? = null

    private val runtimePermissions = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { granted ->
        val request = webPermission
        webPermission = null
        if (request == null) return@registerForActivityResult
        if (granted.values.all { it }) request.grant(request.resources) else request.deny()
    }

    private val cameraPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        if (granted) launchCamera() else finishFile(null)
    }

    private val takePicture = registerForActivityResult(FrontCameraPicture()) { saved ->
        finishFile(if (saved) pendingPhoto?.let { arrayOf(it) } else null)
        pendingPhoto = null
    }

    private val pickImage = registerForActivityResult(
        ActivityResultContracts.PickVisualMedia(),
    ) { uri ->
        finishFile(uri?.let { arrayOf(it) })
    }

    private val filePicker = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { result ->
        finishFile(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data))
    }

    private val healthPermissionLauncher = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract(),
    ) { granted ->
        val client = health
        if (client != null && sleepPermission in granted) {
            lifecycleScope.launch { emitSleep(readNight(client, granted)) }
        } else {
            emitSleep(failure("Allow WorthIt to read sleep in Health Connect, then try again."))
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.light(Paper.toArgb(), Ink.toArgb()),
            navigationBarStyle = SystemBarStyle.light(Paper.toArgb(), Ink.toArgb()),
        )
        prefs = getSharedPreferences("worthit", Context.MODE_PRIVATE)
        server = prefs.getString("server", null) ?: BuildConfig.SERVER_URL
        if (HealthConnectClient.getSdkStatus(this) == HealthConnectClient.SDK_AVAILABLE) {
            health = HealthConnectClient.getOrCreate(this)
        }
        desk = createDesk()
        setContent { WorthItApp() }
        connect()
    }

    override fun onResume() {
        super.onResume()
        if (stage is Stage.Offline) connect()
    }

    override fun onDestroy() {
        connecting?.cancel()
        proxy?.stop()
        proxy = null
        desk.destroy()
        super.onDestroy()
    }

    private fun connect() {
        connecting?.cancel()
        stage = Stage.Connecting
        val target = server
        connecting = lifecycleScope.launch {
            val found = withContext(Dispatchers.IO) { findDesk(target) }
            if (found == null) {
                stage = Stage.Offline(
                    "WorthIt couldn't find the laptop at ${target.removePrefix("http://")} or over USB. " +
                        "Check the laptop is running WorthIt and this phone is on the same Wi-Fi.",
                )
                return@launch
            }
            val sameDesk = origin == found && desk.url?.startsWith(found) == true
            origin = found
            if (sameDesk) desk.reload() else desk.loadUrl("$found/today")
        }
    }

    /** Returns a localhost origin for the laptop: straight over USB, or through [LocalProxy] over Wi-Fi. */
    private fun findDesk(target: String): String? {
        proxy?.stop()
        proxy = null
        if (reachable(USB_DESK)) return "http://localhost:$DESK_PORT"
        val url = runCatching { URL(target) }.getOrNull() ?: return null
        val port = if (url.port > 0) url.port else url.defaultPort
        if (!reachable("${url.protocol}://${url.host}:$port")) return null
        if (url.host == "localhost" || url.host == "127.0.0.1") return "http://localhost:$port"
        val forward = LocalProxy(url.host, port)
        val local = runCatching { forward.start(DESK_PORT) }.getOrNull() ?: return null
        proxy = forward
        return "http://localhost:$local"
    }

    private fun reachable(base: String): Boolean = try {
        val conn = (URL("$base/api/state").openConnection() as HttpURLConnection).apply {
            connectTimeout = 2500
            readTimeout = 20000
            instanceFollowRedirects = false
        }
        val code = conn.responseCode
        conn.disconnect()
        code in 200..499
    } catch (_: Exception) {
        false
    }

    private fun retry(address: String) {
        val cleaned = normalize(address) ?: return
        server = cleaned
        prefs.edit().putString("server", cleaned).apply()
        connect()
    }

    private fun normalize(address: String): String? {
        var text = address.trim().trimEnd('/')
        if (text.isEmpty()) return null
        if (!text.contains("://")) text = "http://$text"
        val url = runCatching { URL(text) }.getOrNull() ?: return null
        val port = if (url.port > 0) url.port else DESK_PORT
        return "${url.protocol}://${url.host}:$port"
    }

    private fun isDesk(uri: Uri): Boolean = uri.host == "localhost" || uri.host == "127.0.0.1"

    /** Drops the connecting screen as soon as the desk paints, without waiting for every script to finish. */
    private fun reveal(url: String) {
        val current = origin ?: return
        if (stage == Stage.Connecting && url.startsWith(current)) stage = Stage.Ready
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun createDesk(): WebView {
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        return WebView(this).apply {
            setBackgroundColor(Paper.toArgb())
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.allowContentAccess = true
            settings.allowFileAccess = false
            settings.setSupportMultipleWindows(false)
            settings.builtInZoomControls = false
            settings.userAgentString = "${settings.userAgentString} WorthItAndroid/${BuildConfig.VERSION_NAME}"
            CookieManager.getInstance().setAcceptCookie(true)
            addJavascriptInterface(Bridge(), "WorthItApp")
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    val uri = request.url
                    if (isDesk(uri) || uri.scheme in setOf("about", "blob", "data", "javascript")) return false
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, uri))
                    } catch (_: ActivityNotFoundException) {
                    }
                    return true
                }

                override fun onPageCommitVisible(view: WebView, url: String) = reveal(url)

                override fun onPageFinished(view: WebView, url: String) = reveal(url)

                override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                    if (!request.isForMainFrame || !isDesk(request.url)) return
                    stage = Stage.Offline("The laptop stopped answering (${error.description}). Check it is still running WorthIt.")
                }

                override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                    recreate()
                    return true
                }
            }
            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView, newProgress: Int) {
                    pageProgress = newProgress
                }

                override fun onPermissionRequest(request: PermissionRequest) {
                    runOnUiThread {
                        if (isDesk(request.origin)) grantWebPermission(request) else request.deny()
                    }
                }

                override fun onShowFileChooser(
                    webView: WebView,
                    callback: ValueCallback<Array<Uri>>,
                    params: FileChooserParams,
                ): Boolean {
                    fileCallback?.onReceiveValue(null)
                    fileCallback = callback
                    val accepts = params.acceptTypes.filter { it.isNotBlank() }
                    val imagesOnly = accepts.isNotEmpty() && accepts.all { it.startsWith("image/") }
                    when {
                        params.isCaptureEnabled -> takeFacePhoto()
                        imagesOnly -> pickImage.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                        else -> try {
                            filePicker.launch(params.createIntent())
                        } catch (_: ActivityNotFoundException) {
                            finishFile(null)
                        }
                    }
                    return true
                }
            }
        }
    }

    private fun grantWebPermission(request: PermissionRequest) {
        val needed = mutableListOf<String>()
        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE in request.resources && !has(Manifest.permission.CAMERA)) {
            needed += Manifest.permission.CAMERA
        }
        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE in request.resources && !has(Manifest.permission.RECORD_AUDIO)) {
            needed += Manifest.permission.RECORD_AUDIO
        }
        if (needed.isEmpty()) {
            request.grant(request.resources)
        } else {
            webPermission = request
            runtimePermissions.launch(needed.toTypedArray())
        }
    }

    private fun has(permission: String) =
        ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED

    private fun takeFacePhoto() {
        if (has(Manifest.permission.CAMERA)) launchCamera() else cameraPermission.launch(Manifest.permission.CAMERA)
    }

    private fun launchCamera() {
        val folder = File(cacheDir, "photos").apply { mkdirs() }
        folder.listFiles()?.forEach { it.delete() }
        val photo = File(folder, "face-${System.currentTimeMillis()}.jpg")
        val uri = FileProvider.getUriForFile(this, "$packageName.files", photo)
        pendingPhoto = uri
        try {
            takePicture.launch(uri)
        } catch (_: ActivityNotFoundException) {
            pendingPhoto = null
            pickImage.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
        }
    }

    private fun finishFile(uris: Array<Uri>?) {
        fileCallback?.onReceiveValue(uris)
        fileCallback = null
    }

    /** Called by the web app (window.WorthItApp) to read last night's sleep from Health Connect. */
    private inner class Bridge {
        @JavascriptInterface
        fun readSleep(ask: Boolean) {
            runOnUiThread { requestSleep(ask) }
        }
    }

    private fun requestSleep(ask: Boolean) {
        val client = health
        if (client == null) {
            val status = HealthConnectClient.getSdkStatus(this)
            emitSleep(
                failure(
                    if (status == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
                        "Update Health Connect from the Play Store, then try again."
                    } else {
                        "Health Connect isn't available on this phone."
                    },
                ),
            )
            return
        }
        lifecycleScope.launch {
            val granted = runCatching { client.permissionController.getGrantedPermissions() }.getOrDefault(emptySet())
            when {
                sleepPermission in granted -> emitSleep(readNight(client, granted))
                ask -> healthPermissionLauncher.launch(healthPermissions)
                else -> emitSleep(JSONObject().put("ok", false).put("needsPermission", true))
            }
        }
    }

    private suspend fun readNight(client: HealthConnectClient, granted: Set<String>): JSONObject = withContext(Dispatchers.IO) {
        try {
            val zone = ZoneId.systemDefault()
            val end = Instant.now()
            val sleep = client.readRecords(
                ReadRecordsRequest(SleepSessionRecord::class, timeRangeFilter = TimeRangeFilter.between(end.minus(Duration.ofHours(36)), end)),
            )
            val latest = sleep.records.maxByOrNull { it.endTime }
            val hours = latest?.let { Math.round(Duration.between(it.startTime, it.endTime).toMinutes() / 60.0 * 100) / 100.0 }
            val day = latest?.endTime?.atZone(zone)?.toLocalDate() ?: LocalDate.now(zone)
            var onPeriod = false
            if (periodPermission in granted) {
                val periods = client.readRecords(
                    ReadRecordsRequest(MenstruationPeriodRecord::class, timeRangeFilter = TimeRangeFilter.between(end.minus(Duration.ofDays(40)), end)),
                )
                onPeriod = periods.records.any { record ->
                    val from = record.startTime.atZone(zone).toLocalDate()
                    val to = record.endTime.atZone(zone).toLocalDate()
                    !day.isBefore(from) && !day.isAfter(to)
                }
            }
            JSONObject()
                .put("ok", true)
                .put("day", day.toString())
                .put("sleepHours", hours ?: JSONObject.NULL)
                .put("cyclePhase", if (onPeriod) "menstrual" else JSONObject.NULL)
        } catch (error: Exception) {
            failure(error.message ?: "Couldn't read Health Connect.")
        }
    }

    private fun failure(message: String): JSONObject = JSONObject().put("ok", false).put("error", message)

    private fun emitSleep(result: JSONObject) {
        desk.evaluateJavascript("window.dispatchEvent(new CustomEvent('worthit:sleep',{detail:$result}));", null)
    }

    @Composable
    private fun WorthItApp() {
        MaterialTheme(
            colorScheme = lightColorScheme(
                primary = Clay,
                onPrimary = Color.White,
                background = Paper,
                onBackground = Ink,
                surface = CardColor,
                onSurface = Ink,
                outline = Line,
            ),
        ) {
            Box(
                Modifier
                    .fillMaxSize()
                    .background(Paper)
                    .windowInsetsPadding(WindowInsets.safeDrawing),
            ) {
                AndroidView(factory = { desk }, modifier = Modifier.fillMaxSize())
                if (stage == Stage.Ready && pageProgress in 1..99) {
                    LinearProgressIndicator(
                        progress = { pageProgress / 100f },
                        modifier = Modifier.fillMaxWidth().height(2.dp).align(Alignment.TopCenter),
                        color = Clay,
                        trackColor = Color.Transparent,
                    )
                }
                when (val current = stage) {
                    Stage.Connecting -> ConnectingScreen()
                    is Stage.Offline -> OfflineScreen(current.reason)
                    Stage.Ready -> Unit
                }
            }
        }
        BackHandler {
            if (stage == Stage.Ready && desk.canGoBack()) desk.goBack() else finish()
        }
    }

    @Composable
    private fun ConnectingScreen() {
        Column(
            Modifier.fillMaxSize().background(Paper).padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Logo(76.dp)
            Spacer(Modifier.height(22.dp))
            Wordmark(36.sp)
            Spacer(Modifier.height(8.dp))
            Text(
                "Is your skincare actually worth it?",
                color = Quiet,
                fontSize = 15.sp,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(48.dp))
            CircularProgressIndicator(color = Clay, strokeWidth = 2.5.dp, modifier = Modifier.size(26.dp))
            Spacer(Modifier.height(14.dp))
            Text("Connecting to your laptop…", color = Quiet, fontSize = 13.sp)
        }
    }

    @Composable
    private fun OfflineScreen(reason: String) {
        var address by remember { mutableStateOf(server.removePrefix("http://")) }
        Column(
            Modifier
                .fillMaxSize()
                .background(Paper)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 28.dp, vertical = 36.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Logo(34.dp)
                Spacer(Modifier.width(12.dp))
                Wordmark(24.sp)
            }
            Spacer(Modifier.height(40.dp))
            Text(
                "Can't reach your laptop",
                color = Ink,
                fontFamily = FontFamily.Serif,
                fontWeight = FontWeight.Medium,
                fontSize = 30.sp,
                lineHeight = 36.sp,
            )
            Spacer(Modifier.height(10.dp))
            Text(reason, color = Quiet, fontSize = 15.sp, lineHeight = 22.sp)
            Spacer(Modifier.height(24.dp))
            Column(
                Modifier
                    .fillMaxWidth()
                    .background(CardColor, RoundedCornerShape(20.dp))
                    .border(1.dp, Line, RoundedCornerShape(20.dp))
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Step(1, "Put this phone on the same Wi-Fi as the laptop.")
                Step(2, "On the laptop, start WorthIt from apps/web with: npm run dev -- -H 0.0.0.0 -p 3000")
                Step(3, "Or plug in a USB cable and run: adb reverse tcp:3000 tcp:3000")
            }
            Spacer(Modifier.height(24.dp))
            OutlinedTextField(
                value = address,
                onValueChange = { address = it },
                label = { Text("Laptop address") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri, imeAction = ImeAction.Go),
                keyboardActions = KeyboardActions(onGo = { retry(address) }),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Clay,
                    unfocusedBorderColor = Line,
                    focusedLabelColor = Clay,
                    cursorColor = Clay,
                    focusedContainerColor = CardColor,
                    unfocusedContainerColor = CardColor,
                ),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = { retry(address) },
                shape = RoundedCornerShape(26.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Ink, contentColor = Paper),
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) {
                Text("Try again", fontSize = 16.sp, fontWeight = FontWeight.Medium)
            }
        }
    }

    @Composable
    private fun Step(number: Int, text: String) {
        Row(verticalAlignment = Alignment.Top) {
            Box(
                Modifier.size(24.dp).background(Ink, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text("$number", color = Paper, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            }
            Spacer(Modifier.width(12.dp))
            Text(text, color = Ink, fontSize = 14.sp, lineHeight = 20.sp, modifier = Modifier.padding(top = 2.dp))
        }
    }
}

/** The WorthIt W mark, drawn on the same 48-unit grid as LogoMark in apps/web/components/brand.tsx. */
@Composable
private fun Logo(size: Dp) {
    Canvas(Modifier.size(size)) {
        val u = this.size.minDimension / 48f
        fun at(x: Float, y: Float) = Offset(x * u, y * u)
        drawRoundRect(Ink, cornerRadius = CornerRadius(12f * u))
        val dashes = PathEffect.dashPathEffect(floatArrayOf(2f * u, 2.2f * u))
        for (y in floatArrayOf(21f, 32.5f)) {
            drawLine(Paper.copy(alpha = 0.38f), at(6f, y), at(42f, y), strokeWidth = 1.1f * u, pathEffect = dashes)
        }
        val wobble = Path().apply {
            at(10f, 18f).let { moveTo(it.x, it.y) }
            at(16.6f, 35.5f).let { lineTo(it.x, it.y) }
            at(24f, 25f).let { lineTo(it.x, it.y) }
            at(31.4f, 35.5f).let { lineTo(it.x, it.y) }
        }
        drawPath(wobble, Paper, style = Stroke(width = 3.6f * u, cap = StrokeCap.Round, join = StrokeJoin.Miter, miter = 10f))
        drawLine(Clay, at(31.4f, 35.5f), at(38f, 13.5f), strokeWidth = 3.6f * u, cap = StrokeCap.Round)
        drawCircle(Clay, radius = 3.4f * u, center = at(38f, 13.5f))
    }
}

@Composable
private fun Wordmark(size: TextUnit) {
    Text(
        buildAnnotatedString {
            withStyle(SpanStyle(color = Ink)) { append("Worth") }
            withStyle(SpanStyle(color = Clay, fontStyle = FontStyle.Italic)) { append("It") }
        },
        fontFamily = FontFamily.Serif,
        fontWeight = FontWeight.Medium,
        fontSize = size,
    )
}

/** Asks the camera app to open on the front lens, since the photo is of the user's face. */
private class FrontCameraPicture : ActivityResultContracts.TakePicture() {
    override fun createIntent(context: Context, input: Uri): Intent =
        super.createIntent(context, input).apply {
            putExtra("android.intent.extras.CAMERA_FACING", 1)
            putExtra("android.intent.extras.LENS_FACING_FRONT", 1)
            putExtra("android.intent.extra.USE_FRONT_CAMERA", true)
            addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
            putExtra(MediaStore.EXTRA_OUTPUT, input)
        }
}
