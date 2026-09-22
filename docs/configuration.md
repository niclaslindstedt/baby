# Configuration

The app has no configuration file and needs no configuration to run. What
follows is the build-time environment (which decides whether the cloud
backends are offered at all) and the runtime settings a user can change.

## Build-time environment

All optional. The app builds and runs with none of them set. `.env.example`
lists them with comments; copy it to `.env` for local overrides.

| Variable                  | Default     | Effect                                                                                                                                                                                                                             |
| ------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_BASE`               | `/`         | Deploy base path. Drives the bundler base, the service-worker scope, and the PWA install identity. The Pages workflow sets `/` for the released build and `/preview/` for main.                                                    |
| `VITE_PWA_IGNORE_PATHS`   | —           | Comma-separated absolute paths this build's service worker must disown. Only the root release sets it (`/preview/`), because a scope is a path prefix and the root worker would otherwise claim the preview channel's navigations. |
| `VITE_DROPBOX_APP_KEY`    | —           | Dropbox OAuth app key (PKCE public client). Unset ⇒ the Dropbox backend is hidden from Settings rather than offered and then failing.                                                                                              |
| `VITE_GOOGLE_CLIENT_ID`   | —           | Google OAuth client id (GIS token client). Unset ⇒ the Google Drive backend is hidden.                                                                                                                                             |
| `VITE_DROPBOX_APP_FOLDER` | `nird-baby` | The app-folder name shown as the file's location. Dropbox fixes this from the OAuth app's own configuration, so it has to be told what the folder is actually called.                                                              |
| `VITE_GDRIVE_APP_FOLDER`  | `nird-baby` | The folder the app creates in the user's My Drive.                                                                                                                                                                                 |

Both OAuth identifiers are **public**: the flows are PKCE with no client
secret, so they are supplied as repository _variables_ (not secrets) and
injected at build time. There is no server-side half of the flow to protect.

The declarations live in `src/vite-env.d.ts`; the consumers are
`vite.config.ts` and `src/app/useSyncEngine.ts`.

**This device** and the **local folder** need no configuration. This device
is the default and is always available; the folder backend appears wherever
the browser has the File System Access directory picker — desktop Chrome,
Edge and Opera — and is left off the list, with a line saying why, wherever
it doesn't.

### Setting the cloud backends up

- **Dropbox** — create an app at
  [dropbox.com/developers/apps](https://www.dropbox.com/developers/apps) with
  "App folder" access, add your deploy origin as a redirect URI, and take the
  app key. The app-folder name you pick there is what `VITE_DROPBOX_APP_FOLDER`
  must repeat.
- **Google Drive** — create an OAuth 2.0 Web client in Google Cloud Console,
  add your origin to the authorised JavaScript origins, and take the client id.
  The app requests `drive.file` scope only, so it can see the files it created
  and nothing else in the user's Drive.

## Runtime settings

Everything under Settings persists to localStorage and applies immediately.
Stored values fall back to defaults on read, so a hand-edited blob can't
crash a screen.

| Setting                | Default       | Range                                               | Notes                                                                                                                                                                |
| ---------------------- | ------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme                  | System        | light / dark / system                               | Two palettes only, by design.                                                                                                                                        |
| Language               | The browser's | Svenska / English                                   | Stored under `baby:language`.                                                                                                                                        |
| Where the record lives | This device   | this device / local folder / Dropbox / Google Drive | See [sync.md](sync.md). This device is the browser's own IndexedDB. The folder option appears only in browsers with the directory picker.                            |
| Developer mode         | Off           | on / off                                            | Reveals everything below it: demo data, log capture, the app log, and the raw document size.                                                                         |
| Demo data              | Off           | on / off                                            | Replaces your record with an invented eight-month-old. In memory only — never saved, never synced, gone on reload — so it is deliberately _not_ a persisted setting. |
| Capture console output | Off           | on / off                                            | Mirrors `console.*` into the in-app log buffer.                                                                                                                      |

The child's profile — name, birth date, sex, the parents' heights — is not a
setting: it lives in the document and is edited from **Settings → Your child**.

## Storage keys

Everything the app persists, all under one origin:

| Key                                     | Holds                                                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `baby:doc`                              | The document — the child and every record.                                                                            |
| `baby:settings`                         | The settings above.                                                                                                   |
| `baby:logs`                             | The in-app log buffer.                                                                                                |
| `baby:language`                         | The active UI language.                                                                                               |
| `baby:sync:backend`                     | Which backend is selected (`idb` / `folder` / `dropbox` / `gdrive`). A `local` left by an older build reads as `idb`. |
| `baby:sync:dropbox`, `baby:sync:gdrive` | OAuth tokens for the connected cloud backend.                                                                         |
| `oss:cache:<backend>:baby`              | The framework's offline mirror of the cloud copy.                                                                     |
| IndexedDB `baby:documents`              | The durable copy of the document on this device.                                                                      |
| IndexedDB `oss:folder-handles`          | The framework's stored grant for the picked local folder.                                                             |

Clearing site data removes all of it. That is the whole uninstall procedure —
there is nothing on a server to delete.
