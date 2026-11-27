package ch.homecraft.planner;
import android.content.pm.ActivityInfo;
import android.view.View;
import android.view.ViewTreeObserver;
import android.view.WindowManager;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
@CapacitorPlugin(name="GameDisplay")
public class GameDisplayPlugin extends Plugin {
  private View decor;
  private ViewTreeObserver.OnGlobalLayoutListener listener;
  private String previous = "";
  private JSObject read() {
    WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(getActivity().getWindow().getDecorView());
    Insets safe = insets == null ? Insets.NONE : Insets.max(
      insets.getInsetsIgnoringVisibility(WindowInsetsCompat.Type.displayCutout()),
      insets.getInsets(WindowInsetsCompat.Type.captionBar() | WindowInsetsCompat.Type.mandatorySystemGestures()));
    float d = getContext().getResources().getDisplayMetrics().density;
    JSObject r = new JSObject();
    r.put("top", Math.ceil(safe.top / d)); r.put("right", Math.ceil(safe.right / d));
    r.put("bottom", Math.ceil(safe.bottom / d)); r.put("left", Math.ceil(safe.left / d));
    return r;
  }
  @Override public void load() {
    getActivity().runOnUiThread(() -> {
      decor = getActivity().getWindow().getDecorView();
      listener = () -> {
        JSObject r = read(); String key = r.toString();
        if (!key.equals(previous)) { previous = key; notifyListeners("insetsChanged", r); }
      };
      decor.getViewTreeObserver().addOnGlobalLayoutListener(listener);
    });
  }
  @PluginMethod public void insets(PluginCall call) {
    getActivity().runOnUiThread(() -> call.resolve(read()));
  }
  @PluginMethod public void setGameMode(PluginCall call) {
    boolean active = Boolean.TRUE.equals(call.getBoolean("active", false));
    boolean landscape = Boolean.TRUE.equals(call.getBoolean("landscape", true));
    getActivity().runOnUiThread(() -> {
      MainActivity activity = (MainActivity)getActivity();
      if (active) activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
      else activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
      int orientation = active && landscape ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
      if (activity.getRequestedOrientation() != orientation) activity.setRequestedOrientation(orientation);
      activity.enterImmersiveMode();
      call.resolve(read());
    });
  }
  @Override protected void handleOnDestroy() {
    if (decor != null && listener != null && decor.getViewTreeObserver().isAlive())
      decor.getViewTreeObserver().removeOnGlobalLayoutListener(listener);
    super.handleOnDestroy();
  }
}
