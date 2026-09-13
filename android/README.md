# AaharWalk for Android

A thin native wrapper around the same web app, so it installs as a normal Android
app — and, more usefully, so it can read the phone's **hardware step counter**.

## Why an APK is better than the installed PWA

| | PWA | APK |
| --- | --- | --- |
| Works offline | yes | yes |
| Counts a walk while open | yes | yes |
| **Counts steps all day, screen off, app closed** | **no** | **yes** |
| Step Set Go can share into it | yes | yes |
| Needs hosting on HTTPS | yes | no |
| Internet permission | n/a | **none requested** |

Android's `TYPE_STEP_COUNTER` is maintained by the hardware, so it keeps counting
with the screen off. `StepBridge.java` exposes it to the web app as
`window.AndroidSteps`; the app then treats the phone as the source of truth for
today's total, and Walk mode stops adding its own count so nothing is counted twice.

## Getting the APK without installing anything

1. Go to the repository's **Actions** tab → **Build Android APK** → **Run workflow**.
2. When it finishes, download the **AaharWalk-apk** artifact and unzip it.
3. Copy the `.apk` to your phone, open it, and allow installing from this source.

Pushing a `v*` tag builds it and attaches the APK to a GitHub release instead.

Play Protect may warn the first time you install it. That is expected for a
sideloaded build that is not from the Play Store.

### About the signing key

`app/sideload.keystore` is checked into the repository and every build is signed
with it. That is deliberate: Android refuses to install an update signed with a
different key than the installed app, and Gradle's default debug keystore is
generated fresh on each CI machine — so each new APK failed with **"App not
installed"** until the old one was uninstalled first. With a fixed key, updates
install straight over the top and your data is kept.

This key is a throwaway. It is public, it protects nothing, and it must be
replaced with your own before distributing the app anywhere real. To do that,
create your own keystore and point `signingConfigs.sideload` at it.

### Backup and restore inside the app

A WebView ignores an `<a download>` link and gives no error, so the web build's
backup button would silently do nothing in the APK. `FileBridge.java` writes the
file to the phone's Downloads folder instead, and `onShowFileChooser` in
`MainActivity` is what makes "Restore a backup" able to open a file picker.

## Building it locally

Needs the Android SDK (via Android Studio, or `sdkmanager`) and JDK 17.

```
cd android
gradle assembleDebug          # or ./gradlew assembleDebug once a wrapper exists
```

The APK lands in `app/build/outputs/apk/debug/`. Opening the `android/` folder in
Android Studio also works — it will offer to add the Gradle wrapper.

## How it is put together

```
app/src/main/
  java/com/aaharwalk/app/
    MainActivity.java   WebView host, asset loader, share intents, file picker
    StepBridge.java     hardware step counter → window.AndroidSteps
    FileBridge.java     writing a backup to Downloads → window.AndroidFiles
  AndroidManifest.xml   no INTERNET permission; ACTIVITY_RECOGNITION for steps
  res/                  launcher icons, light and dark themes
```

The web app is **not** copied into this folder. `copyWebApp` in `app/build.gradle`
pulls it from the repository root at build time, so there is one copy of the code.

### Why the WebView loads an https:// URL

The bundled files are served through `WebViewAssetLoader` on
`https://appassets.androidplatform.net/` rather than `file://`, because motion
sensors, the screen wake lock and service workers all require a secure context.
Everything still runs from inside the APK with no network.

### Handling a share from Step Set Go

The activity accepts `ACTION_SEND` text and passes it to the web app as
`?share_text=…` — the same parameters the PWA share target uses, so one code path
in `src/engine/steps-import.js` reads the step count either way.

### Step counting and privacy

The manifest requests **no INTERNET permission at all**, so the app cannot send
anything anywhere even in principle. `ACTIVITY_RECOGNITION` is asked for only when
you choose the phone's own counter as your step source, and steps stay on the device
like everything else.
