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

# Keep package identity and an increasing version code for Android updates.
import json,re
version=json.loads(Path('package.json').read_text())['version']
gradle=Path('android/app/build.gradle')
g=gradle.read_text()
g,n=re.subn(r'versionCode\s+\d+', 'versionCode 10001',g,count=1)
if n!=1: raise RuntimeError('Android versionCode not found')
g,n=re.subn(r'versionName\s+["\'][^"\']*["\']','versionName "'+version+'"',g,count=1)
if n!=1: raise RuntimeError('Android versionName not found')
gradle.write_text(g)
