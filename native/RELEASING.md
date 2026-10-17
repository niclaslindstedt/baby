# Releasing the native app

Builds run on **EAS Build** (Expo's infrastructure), not on GitHub's runners
and not on a laptop. Everything below is a one-time setup followed by a
one-click dispatch.

## One-time setup

### 1. The Expo project

```sh
cd native
npx eas-cli login
npx eas-cli init          # prints the project id
```

`eas init` normally writes the id into `app.json` — this app uses a **dynamic**
config (`app.config.js`), which it cannot write to, so the id is passed in
instead:

- **CI**: set it as the repository **secret** `EAS_PROJECT_ID`
  (Settings → Secrets and variables → Actions → Secrets).
- **Locally**: `native/.env` (`cp .env.example .env`).

`APP_DISPLAY_NAME` (the listing name) and `APP_BUNDLE_ID` travel the same way,
as secrets under those names and as EAS environment variables. The listing
name is also the app's name in its own top bar: `scripts/bundle-web.mjs`
bakes it into the web bundle, and refuses a `production` bundle without it.

### 2. The CI token

Create a **robot** access token at
`https://expo.dev/accounts/<account>/settings/access-tokens` — a robot cannot
sign in to the dashboard and owns no projects, so its blast radius is bounded —
and set it as the repository **secret** `EXPO_TOKEN`.

### 3. Store credentials

EAS holds these on the project, not in this repo:

```sh
npx eas-cli credentials          # iOS signing + Android keystore
```

For submission, fill in the placeholders in `eas.json` →
`submit.production`:

| Field                       | Where it comes from                                                                                                                                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apple ID (not committed)    | Asked for by `eas submit` when it signs in; never written into `eas.json`.                                                                                                                                                                                 |
| `ascAppId`                  | App Store Connect → the app → App Information → **Apple ID** (digits). Add it under `submit.production.ios` once the app record exists; until then the key is absent, not a placeholder — `eas submit` rejects placeholder values before it does anything. |
| `appleTeamId`               | developer.apple.com → Membership details → **Team ID** (10 characters). Added beside `ascAppId`.                                                                                                                                                           |
| `play-service-account.json` | Play Console → Setup → API access → a service account key. Gitignored; upload it to EAS with `eas credentials` rather than committing it.                                                                                                                  |

### 4. iOS capabilities

None. The app declares no entitlements (the backup export's share sheet
needs none), and in particular **no iCloud**: App
Store guideline 5.1.3(ii) says apps "may not store personal health information
in iCloud", and the record is a child's health data. Leave the iCloud
capability off the App ID in the Apple Developer portal.

### 5. No Dropbox

The phone app offers no Dropbox: the record stays on the device. The build
job does not pass `VITE_DROPBOX_APP_KEY` or `VITE_DROPBOX_APP_FOLDER` to the
web bundle, and the bundle's own build (`VITE_NATIVE_BUILD=on`) leaves
Dropbox out even if a key reaches it. Nothing needs registering in the
Dropbox App Console for the phone app. The website and the desktop app keep
their Dropbox.

## Cutting a build

Dispatch **Actions → native → Run workflow** and pick:

| Input      | Meaning                                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `platform` | `ios` (the default), `android` or `all`.                                                                                               |
| `profile`  | `development` (dev client), `preview` (internal, APK + simulator), `testflight` (store-signed, still ours), `production` (what ships). |
| `submit`   | Also submit to the stores. Refused on anything but `production`.                                                                       |

The job builds the web app, packs it into `native/assets/webroot.zip`, and
queues the build on EAS with `--no-wait` — it exits immediately, so watch the
build itself at <https://expo.dev>.

The **marketing version** comes from the repo root's `package.json`, so the app
and the website never disagree about which release they are. Store **build
numbers** are auto-incremented by EAS (`appVersionSource: remote`); nothing is
bumped by hand.

EAS installs with the Node that `eas.json` pins — `"node"` in every build
profile, the same major as `.nvmrc`. Without it EAS falls back to its image's
default Node, whose npm 10 reads the lockfile npm 11 wrote as out of sync and
stops the build at `npm ci` ("Missing: typescript@5.9.3 from lock file"). Move
the pin when `.nvmrc` moves.

## Doing it from a laptop instead

```sh
cd native
npm ci
npm run build:preview        # internal build
npm run build:testflight     # store-signed, to TestFlight
npm run build:production     # what ships
npm run submit
```

Each of those bundles the web app first — the wrapper serves that copy, and a
build without it launches to a blank screen.

## Checklist before a store build

- [ ] `make lint && make test && make build` is green at the repo root.
- [ ] `make native-typecheck` is green.
- [ ] `EXPO_PUBLIC_BABY_URL` is **unset** — a build that streams the website
      is the exact shape App Store guideline 4.2 rejects.
- [ ] The version in the root `package.json` is the one you mean to ship.
- [ ] **Settings → Where the record lives** says the record is kept on this
      device, with no picker: no Dropbox, no folder and no iCloud Drive.
- [ ] Settings → Your data → Export a backup opens the share sheet on
      `baby-backup-<date>.json`, and Save to Files writes a file that
      Restore from a backup reads back. Not yet tried on a device: until it
      has been, the store listing does not mention export.
