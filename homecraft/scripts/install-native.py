from pathlib import Path
import shutil
java=Path('android/app/src/main/java/ch/homecraft/planner')
java.mkdir(parents=True,exist_ok=True)
shutil.copy('native/BiometricVaultPlugin.java',java/'BiometricVaultPlugin.java')
activity=java/'MainActivity.java'
activity.write_text('''package ch.homecraft.planner;
import android.os.Bundle;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
  private void enterImmersiveMode() {
    Window window = getWindow();
    WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
    controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    controller.hide(WindowInsetsCompat.Type.systemBars());
  }

  @Override public void onCreate(Bundle savedInstanceState) {
    registerPlugin(BiometricVaultPlugin.class);
    super.onCreate(savedInstanceState);
    enterImmersiveMode();
  }

  @Override public void onResume() {
    super.onResume();
    enterImmersiveMode();
  }

  @Override public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) enterImmersiveMode();
  }
}
''')
manifest=Path('android/app/src/main/AndroidManifest.xml')
s=manifest.read_text()
if 'android.permission.USE_BIOMETRIC' not in s:
    s=s.replace('</manifest>','    <uses-permission android:name="android.permission.USE_BIOMETRIC" />\n</manifest>')
# prevent OS cloud backups from containing application storage or cached exports
if 'android:allowBackup="true"' in s: s=s.replace('android:allowBackup="true"','android:allowBackup="false"')
manifest.write_text(s)

# Keep package identity and an increasing version code for Android updates.
import json,re
version=json.loads(Path('package.json').read_text())['version']
gradle=Path('android/app/build.gradle')
g=gradle.read_text()
parts=[int(x) for x in version.split('-')[0].split('.')]
code=parts[0]*1000000+parts[1]*1000+parts[2]+(int(version.split('-rc.')[1]) if '-rc.' in version else 999)
g,n=re.subn(r'versionCode\s+\d+', f'versionCode {code}',g,count=1)
if n!=1: raise RuntimeError('Android versionCode not found')
g,n=re.subn(r'versionName\s+["\'][^"\']*["\']','versionName "'+version+'"',g,count=1)
if n!=1: raise RuntimeError('Android versionName not found')
gradle.write_text(g)
