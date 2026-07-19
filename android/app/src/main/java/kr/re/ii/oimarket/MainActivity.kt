package kr.re.ii.oimarket

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.webkit.ServiceWorkerClientCompat
import androidx.webkit.ServiceWorkerControllerCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewFeature

/**
 * 오이마켓 Android 앱 — 프로토타입(PWA)을 앱에 내장한 WebView 컨테이너.
 *
 * 내장 자산(app/src/main/assets/www)을 https 로 매핑(WebViewAssetLoader)해
 * localStorage·서비스워커·상대경로가 정상 동작하도록 한다. 인터넷 권한 없이 완전 오프라인.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var fileCallback: ValueCallback<Array<Uri>>? = null

    // 글쓰기 사진 첨부(<input type="file" accept="image/*">) 처리
    private val fileChooser =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val cb = fileCallback ?: return@registerForActivityResult
            cb.onReceiveValue(
                WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            )
            fileCallback = null
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        // 서비스워커 요청도 내장 자산에서 서빙(오프라인 캐시)
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE)) {
            ServiceWorkerControllerCompat.getInstance().setServiceWorkerClient(
                object : ServiceWorkerClientCompat() {
                    override fun shouldInterceptRequest(request: WebResourceRequest): WebResourceResponse? =
                        assetLoader.shouldInterceptRequest(request.url)
                }
            )
        }

        webView = WebView(this).apply {
            with(settings) {
                javaScriptEnabled = true
                domStorageEnabled = true          // localStorage(앱 데이터 계층) 필수
                mediaPlaybackRequiresUserGesture = false
                setSupportZoom(false)
                builtInZoomControls = false
                textZoom = 100
                cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
            }

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

                override fun shouldOverrideUrlLoading(
                    view: WebView,
                    request: WebResourceRequest
                ): Boolean {
                    val url = request.url
                    // 내장 자산은 WebView 내부에서 처리, 그 외 외부 링크는 시스템에 위임
                    if (url.host == "appassets.androidplatform.net") return false
                    return try {
                        startActivity(Intent(Intent.ACTION_VIEW, url)); true
                    } catch (e: Exception) {
                        true
                    }
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    webView: WebView?,
                    callback: ValueCallback<Array<Uri>>,
                    params: FileChooserParams
                ): Boolean {
                    fileCallback?.onReceiveValue(null)
                    fileCallback = callback
                    return try {
                        fileChooser.launch(params.createIntent()); true
                    } catch (e: Exception) {
                        fileCallback = null; false
                    }
                }
            }
        }

        setContentView(webView)

        // 하드웨어 뒤로가기: WebView 히스토리 우선
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        if (savedInstanceState == null) {
            webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }
}
