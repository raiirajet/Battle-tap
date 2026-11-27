package ch.homecraft.planner;
import android.os.Bundle;
import android.os.Build;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
  void enterImmersiveMode() {
    Window window = getWindow();
    WindowCompat.setDecorFitsSystemWindows(window, false);
    if (Build.VERSION.SDK_INT >= 28) {
      WindowManager.LayoutParams p = window.getAttributes();
      p.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= 30
        ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
        : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
      window.setAttributes(p);
    }
    if (Build.VERSION.SDK_INT >= 29) {
      window.setNavigationBarContrastEnforced(false);
      window.setStatusBarContrastEnforced(false);
    }
    WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
    controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    controller.hide(WindowInsetsCompat.Type.systemBars());
  }
  @Override public void onCreate(Bundle savedInstanceState) {
    registerPlugin(BiometricVaultPlugin.class);
    registerPlugin(GameDisplayPlugin.class);
    super.onCreate(savedInstanceState);
    enterImmersiveMode();
  }
  @Override public void onResume() {super.onResume();enterImmersiveMode();}
  @Override public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) enterImmersiveMode();
  }
}
