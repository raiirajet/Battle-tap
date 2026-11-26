package ch.homecraft.planner;

import android.os.Build;
import android.hardware.biometrics.BiometricManager;
import android.hardware.biometrics.BiometricPrompt;
import android.os.CancellationSignal;
import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name="BiometricVault")
public class BiometricVaultPlugin extends Plugin {
    private static final String ALIAS="homecraft-biometric-vault-v1";
    private SharedPreferences prefs(){return getContext().getSharedPreferences("homecraft_vault",Context.MODE_PRIVATE);}
    private KeyStore keys() throws Exception {KeyStore s=KeyStore.getInstance("AndroidKeyStore");s.load(null);return s;}
    private boolean available(){return Build.VERSION.SDK_INT>=30 && getContext().getSystemService(BiometricManager.class).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)==BiometricManager.BIOMETRIC_SUCCESS;}
    @PluginMethod public void status(PluginCall call){JSObject r=new JSObject();r.put("available",available());r.put("enabled",prefs().contains("cipher")&&prefs().contains("iv"));call.resolve(r);}
    @PluginMethod public void clear(PluginCall call){try{prefs().edit().clear().commit();keys().deleteEntry(ALIAS);call.resolve();}catch(Exception e){call.reject("Biometrischer Schlüssel konnte nicht gelöscht werden");}}
    @PluginMethod public void enable(PluginCall call){
        String password=call.getString("password");
        if(!available()||password==null||password.length()<10||password.length()>1024){call.reject("Starke Biometrie oder Passphrase nicht verfügbar");return;}
        getActivity().runOnUiThread(()->{try{
            prefs().edit().clear().commit();keys().deleteEntry(ALIAS);
            KeyGenerator gen=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
            gen.init(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setKeySize(256).setUserAuthenticationRequired(true).setUserAuthenticationParameters(0,KeyProperties.AUTH_BIOMETRIC_STRONG).setInvalidatedByBiometricEnrollment(true).build());
            Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,gen.generateKey());
            authenticate(call,cipher,password,true);
        }catch(Exception e){call.reject("Biometrische Einrichtung fehlgeschlagen");}});
    }
    @PluginMethod public void unlock(PluginCall call){
        if(!available()||!prefs().contains("cipher")||!prefs().contains("iv")){call.reject("Biometrie nicht eingerichtet");return;}
        getActivity().runOnUiThread(()->{try{
            SecretKey key=(SecretKey)keys().getKey(ALIAS,null);
            Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,key,new GCMParameterSpec(128,Base64.decode(prefs().getString("iv",""),Base64.NO_WRAP)));
            authenticate(call,cipher,null,false);
        }catch(Exception e){call.reject("Biometrischer Schlüssel nicht verfügbar. Passphrase verwenden.");}});
    }
    private void authenticate(PluginCall call,Cipher cipher,String password,boolean enable){
        BiometricPrompt prompt=new BiometricPrompt.Builder(getActivity()).setTitle("HomeCraft 3D").setSubtitle(enable?"Biometrie für Projektspeicher aktivieren":"Projekte entsperren").setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG).setNegativeButton("Abbrechen",getActivity().getMainExecutor(),(d,w)->{}).build();
        prompt.authenticate(new BiometricPrompt.CryptoObject(cipher),new CancellationSignal(),getActivity().getMainExecutor(),new BiometricPrompt.AuthenticationCallback(){
            @Override public void onAuthenticationError(int code,CharSequence message){call.reject("Biometrie abgebrochen oder nicht verfügbar");}
            @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result){try{
                Cipher c=result.getCryptoObject().getCipher();
                if(enable){byte[] data=c.doFinal(password.getBytes(StandardCharsets.UTF_8));boolean ok=prefs().edit().putString("cipher",Base64.encodeToString(data,Base64.NO_WRAP)).putString("iv",Base64.encodeToString(c.getIV(),Base64.NO_WRAP)).commit();if(!ok)throw new Exception("write failed");call.resolve();}
                else{byte[] data=c.doFinal(Base64.decode(prefs().getString("cipher",""),Base64.NO_WRAP));JSObject r=new JSObject();r.put("password",new String(data,StandardCharsets.UTF_8));call.resolve(r);}
            }catch(Exception e){call.reject("Biometrische Entsperrung fehlgeschlagen. Passphrase verwenden.");}}
        });
    }
}
