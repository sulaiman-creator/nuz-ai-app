package com.example.nuz.ui.main

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView

import android.webkit.WebSettings
import android.webkit.WebChromeClient
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.snapshotFlow
import com.example.nuz.MainActivity
import kotlinx.coroutines.flow.collectLatest

import android.webkit.JavascriptInterface

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun MainScreen(
  onItemClick: (androidx.navigation3.runtime.NavKey) -> Unit,
  modifier: Modifier = Modifier,
) {
  var isPageFinished by remember { mutableStateOf(false) }
  var webView: WebView? by remember { mutableStateOf(null) }

  // Handle deep links from MainActivity
  LaunchedEffect(Unit) {
    snapshotFlow { MainActivity.deepLinkUrl.value }.collectLatest { url ->
      url?.let {
        android.util.Log.d("NuzAuth", "Received Deep Link: $it")
        val finalUrl = if (it.startsWith("nuz-ai://")) {
          val baseUrlWithSlash = if (com.example.nuz.BuildConfig.BASE_URL.endsWith("/")) {
            com.example.nuz.BuildConfig.BASE_URL
          } else {
            "${com.example.nuz.BuildConfig.BASE_URL}/"
          }
          val timestamp = System.currentTimeMillis()
          it.replace("nuz-ai://oauth-callback", "${baseUrlWithSlash}?t=$timestamp")
            .replace("state=android-login", "state=login")
        } else {
          it
        }
        android.util.Log.d("NuzAuth", "Loading converted Deep Link in WebView: $finalUrl")
        webView?.loadUrl(finalUrl)
        MainActivity.deepLinkUrl.value = null // Clear after use
      }
    }
  }

  BackHandler(enabled = webView?.canGoBack() == true) {
    webView?.goBack()
  }

  Box(modifier = modifier.fillMaxSize().safeDrawingPadding()) {
    AndroidView(
      factory = { context ->
        fun handleUrl(url: String?, context: android.content.Context, view: WebView?): Boolean {
          if (url == null) return false
          val lowerUrl = url.lowercase()
          android.util.Log.d("NuzAuth", "Checking URL: $url")
          
          // Never intercept our own app domain, even if it contains "accounts.google.com" in query params (e.g. OIDC iss)
          val baseUrlLower = com.example.nuz.BuildConfig.BASE_URL.lowercase()
          if (lowerUrl.contains(baseUrlLower)) {
            android.util.Log.d("NuzAuth", "Allowing native loading for base app URL: $url")
            return false
          }
          
          // Intercept ANY Google auth related URLs
          if (lowerUrl.contains("accounts.google.com") || 
              lowerUrl.contains("google.com/accounts") ||
              lowerUrl.contains("oauth2") ||
              lowerUrl.contains("disallowed_useragent")) {
            android.util.Log.d("NuzAuth", "Intercepting Google Auth URL via Custom Tabs: $url")
            val customTabsIntent = CustomTabsIntent.Builder()
              .setShowTitle(true)
              .setShareState(CustomTabsIntent.SHARE_STATE_OFF)
              .build()
            try {
              // Explicitly force Google Chrome for secure, certified Google Sign-In
              customTabsIntent.intent.setPackage("com.android.chrome")
              customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY)
              customTabsIntent.launchUrl(context, Uri.parse(url))
              return true
            } catch (e: Exception) {
              android.util.Log.e("NuzAuth", "Failed to launch Chrome Custom Tabs, falling back", e)
              customTabsIntent.intent.setPackage(null)
              customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY)
              try {
                customTabsIntent.launchUrl(context, Uri.parse(url))
                return true
              } catch (e2: Exception) {
                android.util.Log.e("NuzAuth", "Failed to launch Custom Tabs, falling back to browser", e2)
                try {
                  val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                  intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                  context.startActivity(intent)
                  return true
                } catch (e3: Exception) {
                  android.util.Log.e("NuzAuth", "Failed to launch external browser", e3)
                }
              }
            }
          }
          return false
        }

        WebView(context).apply {
          layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
          )
          
          addJavascriptInterface(object {
            @JavascriptInterface
            fun launchAuth(url: String) {
              android.util.Log.d("NuzAuth", "JS Bridge called with URL: $url")
              // Force launch on main thread for UI interaction
              (context as? android.app.Activity)?.runOnUiThread {
                val customTabsIntent = CustomTabsIntent.Builder()
                  .setShowTitle(true)
                  .build()
                try {
                  customTabsIntent.intent.setPackage("com.android.chrome")
                  customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY)
                  customTabsIntent.launchUrl(context, Uri.parse(url))
                } catch (e: Exception) {
                  android.util.Log.e("NuzAuth", "Failed to launch Chrome Custom Tabs, falling back", e)
                  customTabsIntent.intent.setPackage(null)
                  customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY)
                  try {
                    customTabsIntent.launchUrl(context, Uri.parse(url))
                  } catch (e2: Exception) {
                    try {
                      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                      context.startActivity(intent)
                    } catch (e3: Exception) {
                      android.util.Log.e("NuzAuth", "Failed to launch browser", e3)
                    }
                  }
                }
              } ?: run {
                // Fallback if context is not an Activity
                val customTabsIntent = CustomTabsIntent.Builder().build()
                 try {
                  customTabsIntent.intent.setPackage("com.android.chrome")
                  customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY)
                  customTabsIntent.launchUrl(context, Uri.parse(url))
                } catch (e: Exception) {
                  customTabsIntent.intent.setPackage(null)
                  customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY)
                  try {
                    customTabsIntent.launchUrl(context, Uri.parse(url))
                  } catch (e2: Exception) {
                    try {
                      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                      context.startActivity(intent)
                    } catch (e3: Exception) {
                      android.util.Log.e("NuzAuth", "Failed to launch browser", e3)
                    }
                  }
                }
              }
            }
          }, "AndroidInterface")

          webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
              return handleUrl(request?.url?.toString(), context, view)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
              return handleUrl(url, context, view)
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
              android.util.Log.d("NuzAuth", "onPageStarted: $url")
              if (handleUrl(url, context, view)) {
                view?.stopLoading()
              }
              super.onPageStarted(view, url, favicon)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
              super.onPageFinished(view, url)
              isPageFinished = true
            }
          }
          
          settings.javaScriptEnabled = true
          settings.domStorageEnabled = true
          settings.databaseEnabled = true
          settings.useWideViewPort = true
          settings.loadWithOverviewMode = true
          settings.allowFileAccess = true
          settings.allowContentAccess = true
          settings.setSupportZoom(true)
          settings.builtInZoomControls = true
          settings.displayZoomControls = false
          settings.javaScriptCanOpenWindowsAutomatically = true
          
          // Disable multiple windows to force all navigations through the same WebView/interceptor
          settings.setSupportMultipleWindows(false)
          
          webChromeClient = object : WebChromeClient() {
            override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: android.os.Message?): Boolean {
              // This should rarely be called now that setSupportMultipleWindows is false,
              // but we handle it just in case.
              val transport = resultMsg?.obj as? WebView.WebViewTransport
              if (transport != null) {
                val tempWebView = WebView(context)
                tempWebView.webViewClient = object : WebViewClient() {
                  override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                    if (handleUrl(url, context, view)) {
                      view?.stopLoading()
                    }
                    super.onPageStarted(view, url, favicon)
                  }
                  override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    return handleUrl(request?.url?.toString(), context, view)
                  }
                }
                transport.webView = tempWebView
                resultMsg.sendToTarget()
                return true
              }
              return super.onCreateWindow(view, isDialog, isUserGesture, resultMsg)
            }
          }
          
          // Use a better approach for User Agent:
          // Remove "Version/X.X" and "wv" from the default UA to avoid Google's WebView detection
          // Append " NuzAndroid" for robust client-side environment detection in the React frontend
          val defaultUA = settings.userAgentString
          val customUA = defaultUA.replace(Regex("Version/\\d+\\.\\d+\\s+"), "")
                                 .replace("; wv", "") + " NuzAndroid"
          settings.userAgentString = customUA
          
          // Use the dynamic URL from BuildConfig
          loadUrl(com.example.nuz.BuildConfig.BASE_URL)
          webView = this
        }
      },
      update = {
        webView = it
      },
      modifier = Modifier.fillMaxSize()
    )

    // Ultra-premium native fade-out splash loading overlay
    AnimatedVisibility(
      visible = !isPageFinished,
      exit = fadeOut(animationSpec = androidx.compose.animation.core.tween(durationMillis = 800))
    ) {
      Box(
        modifier = Modifier
          .fillMaxSize()
          .background(Color(7, 10, 19)),
        contentAlignment = Alignment.Center
      ) {
        Column(
          horizontalAlignment = Alignment.CenterHorizontally,
          modifier = Modifier.fillMaxWidth()
        ) {
          CircularProgressIndicator(
            color = Color(139, 92, 246),
            strokeWidth = 3.dp,
            modifier = Modifier.size(48.dp)
          )
          Spacer(modifier = Modifier.height(24.dp))
          Text(
            text = "NUZ AI",
            color = Color.White,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = androidx.compose.ui.text.font.FontFamily.SansSerif
          )
          Spacer(modifier = Modifier.height(8.dp))
          Text(
            text = "SECURE AI COGNITIVE WORKSPACE",
            color = Color(156, 163, 175),
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.5.sp
          )
          Spacer(modifier = Modifier.height(6.dp))
          Text(
            text = "Cloud Partners",
            color = Color(156, 163, 175).copy(alpha = 0.5f),
            fontSize = 10.sp,
            fontWeight = FontWeight.Normal
          )
        }
      }
    }
  }
}
