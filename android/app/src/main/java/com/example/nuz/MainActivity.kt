package com.example.nuz

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.SystemBarStyle
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import com.example.nuz.theme.NuzTheme

class MainActivity : ComponentActivity() {
  companion object {
    val deepLinkUrl = mutableStateOf<String?>(null)
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    handleIntent(intent)

    // Blend system status bar and bottom navigation bar seamlessly with deep cosmic #070A13
    enableEdgeToEdge(
      statusBarStyle = SystemBarStyle.dark(
        android.graphics.Color.parseColor("#070A13")
      ),
      navigationBarStyle = SystemBarStyle.dark(
        android.graphics.Color.parseColor("#070A13")
      )
    )

    setContent {
      NuzTheme { Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) { MainNavigation() } }
    }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleIntent(intent)
  }

  private fun handleIntent(intent: Intent?) {
    val data: Uri? = intent?.data
    if (data != null) {
      deepLinkUrl.value = data.toString()
    }
  }
}
