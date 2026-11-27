from pathlib import Path
import shutil
java=Path('android/app/src/main/java/ch/homecraft/planner')
java.mkdir(parents=True,exist_ok=True)
shutil.copy('native/BiometricVaultPlugin.java',java/'BiometricVaultPlugin.java')
shutil.copy('native/MainActivity.java',java/'MainActivity.java')
shutil.copy('native/GameDisplayPlugin.java',java/'GameDisplayPlugin.java')
manifest=Path('android/app/src/main/AndroidManifest.xml')
s=manifest.read_text()
if 'android.permission.USE_BIOMETRIC' not in s:
    s=s.replace('</manifest>','    <uses-permission android:name="android.permission.USE_BIOMETRIC" />\n</manifest>')
# prevent OS cloud backups from containing application storage or cached exports
if 'android:allowBackup="true"' in s: s=s.replace('android:allowBackup="true"','android:allowBackup="false"')
# Game classification, rotation without recreating the WebView, keyboard resize.
import xml.etree.ElementTree as ET
ns='http://schemas.android.com/apk/res/android'
ET.register_namespace('android',ns)
tree=ET.fromstring(s)
app=tree.find('application')
app.set('{'+ns+'}appCategory','game')
app.set('{'+ns+'}hardwareAccelerated','true')
for act in app.findall('activity'):
    if act.get('{'+ns+'}name','').endswith('MainActivity'):
        act.set('{'+ns+'}windowSoftInputMode','adjustResize')
        changes=set(act.get('{'+ns+'}configChanges','').split('|'))
        changes.update(['orientation','screenSize','screenLayout','smallestScreenSize','keyboardHidden','uiMode','density'])
        act.set('{'+ns+'}configChanges','|'.join(sorted(changes-{''})))
        act.attrib.pop('{'+ns+'}screenOrientation',None)
manifest.write_text(ET.tostring(tree,encoding='unicode',xml_declaration=True))

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

# Android 16 / API 36: supported AGP and Gradle pairing.
variables=Path('android/variables.gradle')
v=variables.read_text()
for key in ['compileSdkVersion','targetSdkVersion']:
    v,n=re.subn(r'(?m)(\b'+key+r'\s*=\s*)\d+',r'\g<1>36',v)
    if n!=1: raise RuntimeError(key+' not found')
variables.write_text(v)
root=Path('android/build.gradle')
g=root.read_text()
g,n=re.subn(r'com.android.tools.build:gradle:[\d.]+','com.android.tools.build:gradle:8.9.1',g)
if n!=1: raise RuntimeError('AGP dependency not found')
root.write_text(g)
wrapper=Path('android/gradle/wrapper/gradle-wrapper.properties')
g=wrapper.read_text()
g,n=re.subn(r'gradle-[\d.]+-(?:bin|all)\.zip','gradle-8.11.1-bin.zip',g)
if n!=1: raise RuntimeError('Gradle wrapper URL not found')
g=re.sub(r'(?m)^distributionSha256Sum=.*\n?','',g)
wrapper.write_text(g)
