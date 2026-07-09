package com.example.nuz

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.nuz.ui.main.MainScreen
import com.example.nuz.ui.splash.SplashScreen

@Composable
fun MainNavigation() {
  val backStack = rememberNavBackStack(Splash)

  NavDisplay(
    backStack = backStack,
    onBack = { backStack.removeLastOrNull() },
    entryProvider =
      entryProvider {
        entry<Splash> {
          SplashScreen(onSplashComplete = {
            backStack.removeLastOrNull()
            backStack.add(Main)
          })
        }
        entry<Main> {
          MainScreen(onItemClick = { navKey -> backStack.add(navKey) }, modifier = Modifier.fillMaxSize())
        }
      },
  )
}
