/**
 * Android WebAPK & Bubblewrap Trusted Web Activity (TWA) Bundle Utility
 * for "Market places" (com.marketplaces.shop).
 *
 * Instead of generating a broken fake `.apk` binary, this utility provides:
 * 1) Play-Store-ready Bubblewrap TWA Manifest + assetlinks.json + AndroidManifest.xml
 *    so developers/owners can compile a real signed `.apk` / `.aab` in 1 command (`npx @bubblewrap/cli build`).
 * 2) Browser-native Android WebAPK installation info for customers (signed automatically by Chrome/Play Services).
 */

export interface ApkPackageInfo {
  packageName: string;
  versionName: string;
  versionCode: number;
  appName: string;
  developer: string;
  targetUrl: string;
  category: string;
  features: string[];
}

export const APK_INFO: ApkPackageInfo = {
  packageName: 'com.marketplaces.shop',
  versionName: '2.5.0',
  versionCode: 250,
  appName: 'Market places',
  developer: 'Market places Official',
  targetUrl:
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-kzmx5l3uac4a3lv7cxr3sf-870223207021.europe-west2.run.app',
  category: 'Shopping / E-Commerce',
  features: [
    'Instant Zero-Lag Order Sync via Server SSE',
    'Verified Account Sign-Up (Gmail & Mobile OTP)',
    'Google Play WebAPK 1-Tap Native Installation',
    'Direct Cash on Delivery & Live GPS Location Pin',
    '100+ World Languages with Full RTL Support',
    'Light & Dark Adaptive Theme'
  ]
};

/**
 * Generates an honest, Google-Play-compliant Bubblewrap TWA build bundle (.json)
 * containing twa-manifest.json, Digital Asset Links (assetlinks.json), and AndroidManifest.xml.
 */
export function downloadAndroidTwaConfig(customUrl?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const appOrigin =
      customUrl ||
      (typeof window !== 'undefined' ? window.location.origin : APK_INFO.targetUrl);
    let host = 'ais-pre-kzmx5l3uac4a3lv7cxr3sf-870223207021.europe-west2.run.app';
    try {
      host = new URL(appOrigin).host;
    } catch {
      // keep fallback host
    }

    const twaManifest = {
      packageId: APK_INFO.packageName,
      host,
      name: APK_INFO.appName,
      launcherName: APK_INFO.appName,
      display: 'standalone',
      themeColor: '#FB7701',
      navigationColor: '#0F172A',
      backgroundColor: '#FFFFFF',
      enableNotifications: true,
      startUrl: '/',
      iconUrl: `${appOrigin}/logo.png`,
      maskableIconUrl: `${appOrigin}/logo.png`,
      splashScreenFadeOutDuration: 300,
      signingKey: {
        path: './android.keystore',
        alias: 'marketplaces'
      },
      appVersionName: APK_INFO.versionName,
      appVersionCode: APK_INFO.versionCode,
      shortcuts: [
        {
          name: 'Quick Orders',
          shortName: 'Orders',
          url: '/?tab=orders',
          chosenIconUrl: `${appOrigin}/logo.png`
        }
      ],
      generatorApp: 'bubblewrap-cli'
    };

    const assetLinksJson = [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: APK_INFO.packageName,
          sha256_cert_fingerprints: ['REPLACE_WITH_YOUR_RELEASE_KEYSTORE_SHA256']
        }
      }
    ];

    const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${APK_INFO.packageName}"
    android:versionCode="${APK_INFO.versionCode}"
    android:versionName="${APK_INFO.versionName}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${APK_INFO.appName}"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Translucent.NoTitleBar">

        <meta-data
            android:name="asset_statements"
            android:value="[{ 'relation': ['delegate_permission/common.handle_all_urls'], 'target': { 'namespace': 'web', 'site': '${appOrigin}' } }]" />

        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:exported="true"
            android:label="${APK_INFO.appName}">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:name="android.intent.action.VIEW" android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${host}" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

    const bundle = JSON.stringify(
      {
        ...APK_INFO,
        targetUrl: appOrigin,
        exportedAt: new Date().toISOString(),
        buildCommand: 'npx @bubblewrap/cli init --manifest=' + `${appOrigin}/manifest.webmanifest && npx @bubblewrap/cli build`,
        twaManifest,
        assetLinksJson,
        androidManifestXml
      },
      null,
      2
    );

    const blob = new Blob([bundle], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'marketplaces-android-twa-config.json';
    document.body.appendChild(link);
    try {
      link.click();
    } catch {
      window.location.href = blobUrl;
    }
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      resolve(true);
    }, 1000);
  });
}
