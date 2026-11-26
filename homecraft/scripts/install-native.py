from pathlib import Path
import shutil
java=Path('android/app/src/main/java/ch/homecraft/planner')
java.mkdir(parents=True,exist_ok=True)
shutil.copy('native/BiometricVaultPlugin.java',java/'BiometricVaultPlugin.java')
activity=java/'MainActivity.java'
activity.write_text('''package ch.homecraft.planner;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle savedInstanceState) {
    registerPlugin(BiometricVaultPlugin.class);
    super.onCreate(savedInstanceState);
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
