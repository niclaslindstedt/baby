# The app on a phone

Baby is a PWA first: open it in a browser, add it to the home screen, and it
is an app. `native/` is the other way in — the same web app, wrapped thinly
enough to ship through the **App Store** and **Google Play**, and in exchange
for that wrapper it gains what the browser cannot give it: the whole app
inside the download, and a backup that goes out through the phone's share
sheet.

## What the wrapper is

A `WebView` and a loopback HTTP server, and very little else.

The whole web build is packed into the download (`assets/webroot.zip`),
unpacked on first launch, and served from `http://localhost:<fixed port>`.
Nothing is fetched. The app works on a plane, in a waiting room with no
signal, and on a phone that has never had a network — and it changes only
when a new build ships to the store, not when the website deploys.

Around that, the wrapper keeps the native chrome in step: the status bar and
the safe-area bands take the page's own theme. Links out of the app open in
the system browser. On Android the hardware back button drives the WebView's
history.

**Export a backup** opens the phone's share sheet on the backup file — save it
to Files, AirDrop it, mail it to yourself — where the website downloads it.
The file is the same either way.

There is **no native UI**. Everything you see is the web app, unchanged —
except its name: the top bar says the name the app has in the store, the same
one under its icon.

## On this device

The phone app keeps your child's record on the phone, and nowhere else.
Settings has no section for where the record lives — there is nothing to
connect, no folder, no Dropbox and no iCloud — and **Settings → Your data**
says the record stays on this device. **Export a backup** is how you keep a
copy of your own. Settings → About and the About screen say the same, and
link to the full privacy policy.

There is no iCloud on purpose. This is your child's health record, and App
Store guideline 5.1.3(ii) says apps may not store personal health information
in iCloud. Dropbox and a local folder, which the website and the desktop app
offer, are left out of the phone app's build; a pre-release install that had
connected either comes back to this device, with its record intact.

## What the wrapper is not allowed to do

Two rules, and they are what keep the app and the website the same product:

- **Nothing in `src/` knows the wrapper exists.** The web app does not check
  at run time whether it is native; the one difference, no Dropbox, is
  decided when the phone build is made. It looks for a sign-in _capability_ on `window`
  (`window.__ossAuthSession`) and uses it when one is there — which is why
  the browser shows no native-shaped hole.
- **The wrapper decides nothing about the record.** It moves bytes. What a
  feed, a weighing or a vaccination is, and how two copies reconcile, are the
  web app's, in `migrations.ts` and `merge.ts`. A second copy of that in Swift
  would drift the first week it existed.

## Building it

See [`../../native/README.md`](../../native/README.md) for the day-to-day, and
[`../../native/RELEASING.md`](../../native/RELEASING.md) for what a store build
needs.
