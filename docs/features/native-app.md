# The app on a phone

Baby is a PWA first: open it in a browser, add it to the home screen, and it
is an app. `native/` is the other way in — the same web app, wrapped thinly
enough to ship through the **App Store** and **Google Play**, and in exchange
for that wrapper it gains what the browser cannot give it: the whole app
inside the download, and a Dropbox sign-in in a sheet over the app.

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

There is **no native UI**. Everything you see is the web app, unchanged —
except its name: the top bar says the name the app has in the store, the same
one under its icon.

## No iCloud

The app does not offer iCloud, on purpose. This is your child's health
record, and App Store guideline 5.1.3(ii) says apps may not store personal
health information in iCloud. **Settings → Where the record lives** offers
this device and your own Dropbox — the same as the website — and the record
never goes anywhere else.

## Dropbox

Connecting Dropbox opens Dropbox's own sign-in in a sheet over the app. You
approve there, the sheet closes, and the app is connected — the sign-in never
leaves for Safari. Closing the sheet simply leaves Dropbox unconnected. The
app never sees your Dropbox password; the sheet is Dropbox's page, and what
comes back is a one-time code the app trades for access to its own folder.

## What the wrapper is not allowed to do

Two rules, and they are what keep the app and the website the same product:

- **Nothing in `src/` knows the wrapper exists.** The web app does not check
  whether it is native. It looks for a sign-in _capability_ on `window`
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
