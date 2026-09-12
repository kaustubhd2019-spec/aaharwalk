# Install AaharWalk on your phone

AaharWalk is a Progressive Web App. Once it is hosted over HTTPS it installs with its own
home-screen icon, opens without a browser address bar, and works offline.

## 1. Host the folder

Upload the contents of this folder to any static HTTPS host — Netlify, GitHub Pages, Vercel,
Firebase Hosting, Cloudflare Pages, or your own website. There is no build step: upload the
files as they are.

Then open the hosted link on your phone.

## 2. Install

**Android (Chrome)**
1. Open the hosted link in Chrome.
2. Tap **Install** if the prompt appears, or use **⋮ → Install app / Add to Home screen**.

**iPhone (Safari)**
1. Open the hosted link in Safari.
2. Tap **Share → Add to Home Screen → Add**.

## 3. Connect your step counter

Installing to the home screen is what enables the Android share sheet integration:

- **Step Set Go** — open it, tap Share on today's steps, choose **AaharWalk**. The step count
  is read from the shared text and pre-filled.
- **Google Fit / Samsung Health / your phone's health app** — share or copy today's step
  count and paste it into the steps sheet.

Set your source once in **Activity → Log steps** and the right instructions stay put.

(A web app cannot read another app's data directly — none of these offer a browser API — so
sharing or pasting the number is the honest way to do this without an account or a server.)

## Notifications

To get water reminders as phone notifications rather than only in-app, allow notifications
from **Profile → Reminders**.

## Your data

Steps, meals, workouts and history live on the phone and browser where you use the app.
Use **Profile → Your data → Export a backup** before switching phones or clearing browser data,
and **Restore a backup** on the new one.

## Testing on a computer first

ES modules are blocked on `file://` pages, so run a local server from this folder:

```
python3 -m http.server 8000
```

and open `http://localhost:8000`.
