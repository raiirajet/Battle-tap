package ch.crownfall.game;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebChromeClient;
import androidx.webkit.WebViewAssetLoader;
public class MainActivity extends Activity {
 private WebView web;
 @Override public void onCreate(Bundle state){
 super.onCreate(state);
 web=new WebView(this);
 web.getSettings().setJavaScriptEnabled(true);
 web.getSettings().setDomStorageEnabled(true);
 web.getSettings().setAllowFileAccess(false);
 web.getSettings().setAllowContentAccess(false);
 web.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW);
 WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
 web.setWebChromeClient(new WebChromeClient());
 web.setWebViewClient(new WebViewClient(){
 @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){
 if(!"appassets.androidplatform.net".equals(r.getUrl().getHost()))return new WebResourceResponse("text/plain","UTF-8",new java.io.ByteArrayInputStream(new byte[0]));
 WebResourceResponse response=loader.shouldInterceptRequest(r.getUrl());
 if(response!=null&&r.getUrl().getPath()!=null&&r.getUrl().getPath().endsWith(".mjs"))response.setMimeType("text/javascript");
 return response;
 }
 @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return !"appassets.androidplatform.net".equals(r.getUrl().getHost());}
 });
 setContentView(web);
 web.loadUrl("https://appassets.androidplatform.net/assets/index.html");
 }
 @Override public void onBackPressed(){web.evaluateJavascript("document.getElementById('found').open ? document.getElementById('found').close() : document.getElementById('pause').click()",null);}
 @Override protected void onPause(){super.onPause();web.evaluateJavascript("document.getElementById('save').click()",null);web.onPause();}
 @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
 @Override protected void onDestroy(){if(web!=null){web.destroy();web=null;}super.onDestroy();}
}
