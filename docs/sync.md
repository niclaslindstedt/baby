# Sync

The app is local-first: the record lives in this browser, and that copy is
always the working copy. "Where the record lives" in Settings says where the
durable copy is kept — on this device, or somewhere another device can read
it too. There is no server in between.

## The backends

| Backend          | What it is                                                                                                                                                                                                               | Needs                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **This device**  | The default, and where every install starts: a durable copy in the browser's own IndexedDB (`baby:documents`) — more room than localStorage, and kept when the browser trims other site data. Nothing leaves the device. | Nothing.                                                      |
| **Local folder** | A directory you pick through the browser's File System Access API; the record becomes `baby.json`, a real file you can open, back up, or point another app at. The grant is stored and re-probed on boot.                | The browser's directory picker. Hidden where there isn't one. |
| **Dropbox**      | `Apps/baby/baby.json` in your Dropbox.                                                                                                                                                                                   | `VITE_DROPBOX_APP_KEY` at build time.                         |

All three speak the framework's one `StorageAdapter` contract, so the engine
(`src/app/useSyncEngine.ts`) is the same past the `create*Adapter` calls: it
pulls the backend's copy on connect, pushes the document after a short
debounce on every edit, and refuses a push whose base revision has moved.
The IndexedDB adapter is the one app-local one (`src/app/idbAdapter.ts`); it
keeps a revision counter beside the text so two tabs cannot write over each
other.

Only the last two are _sync_ in the sense the top bar's glyph means —
somewhere the record could also be read from. On **This device** there is no
glyph: there is nothing to watch the status of.

## Encryption

The same two — the local folder and Dropbox — are **always encrypted**. A
folder is on this computer, but it is a folder anything else may be syncing (a
Dropbox, OneDrive or iCloud Drive client), so the rule is not "Dropbox is
encrypted" but "a copy that is not the browser's own is only ever an
envelope". There is no switch to turn it off: it is a requirement of the
backend, not a setting (the framework's `useEncryption` with `policy: "required"`, wired in
`src/app/useSyncEngine.ts`). Until a passphrase is held the engine has no
adapter to talk to, so nothing is pulled or pushed at all.

`baby.json` on either backend is an `oss.encrypted.v1` envelope (AES-256-GCM,
PBKDF2-SHA256 at 600,000 iterations). You can see it, copy it and back it up,
but only your passphrase opens it.

- **First connect.** The app looks at what the backend holds. Nothing yet (or
  an old plaintext copy) → it asks you to **choose a passphrase**, twice. An
  old plaintext copy is re-written as ciphertext on the first read after that.
- **Another device.** The backend already holds an envelope → it asks you to
  **enter the passphrase** you chose; a wrong one is refused and nothing
  syncs.
- **Remembered here.** The passphrase is remembered on this device, per
  backend (in localStorage, beside the record itself, which is already
  plaintext here), so a device asks once, not on every open. What it protects
  is the copy the folder or Dropbox holds.
- **Changing it.** Settings → Where the record lives → **Change the
  passphrase** re-encrypts the copy. Other devices find their passphrase no
  longer opens it, forget it, and ask for the new one.
- **Forgetting it.** Nobody can recover a forgotten passphrase — not the app,
  not Dropbox. The record on each device is unaffected; disconnect, delete the
  file, and connect again with a new passphrase.

The on-device copy is not encrypted by this. If the phone itself needs a lock,
that is the [app lock](features/encryption.md#app-lock).

### Where the local folder is offered

The picker is the File System Access API's `showDirectoryPicker`, which
desktop Chrome, Edge and Opera ship and no mobile browser does — nor Safari
or Firefox on any platform. Where it is missing the choice is left off the
list rather than offered and then failing, and Settings says why. Use a cloud
backend to read the record on a phone as well as a laptop.

### An older install's "This device"

Earlier builds listed **This device** — which connected no backend at all —
beside **IndexedDB**. Both were this device, and one of them silently kept no
second copy, so they are one choice now, backed by IndexedDB. A stored
`local` reads as this device on the next boot; the document is untouched by
that, and the first pull finds an empty IndexedDB and pushes the localStorage
copy into it.

### No iCloud

There is no iCloud backend, on purpose: App Store guideline 5.1.3(ii) says
apps "may not store personal health information in iCloud", and the record is
a child's health data. A pre-release phone build offered iCloud Drive; a
stored `icloud` from it reads as this device (`parseBackend`). No released
build ever wrote to iCloud, so there is nothing there to migrate.

**Disconnecting** removes the credentials or the folder grant, and the
remembered passphrase, and comes back
to this device. The record stays here, and the copy already on the backend is
left exactly where it is.

## How two copies reconcile

Record by record, matched to what the data means:

- The **child**, each **measurement**, each **sleep**, each **food**, the
  **milk feeding** and each **vaccination** carry an `updatedAt`; the later
  edit wins, record by record. Editing a reading on the phone and adding a
  food on the laptop keeps both. Ending a sleep is an edit too, so the device
  that tapped **Woke up** wins over the one that still shows the child
  asleep.
- **Diaper changes** merge as a **union**: each is one tap that happened on
  one device, so a change logged on the phone and another on the tablet the
  same afternoon both survive.

No prompt, no "which side do you want to keep?", and the merge is
order-independent: both devices reach the same document regardless of which
pulled first.

## The known limitation: removals come back

A removal is an absence, not a tombstone, so a record deleted on one device
comes back from the other on the next merge until that device deletes it too
(or syncs before the first one opens). Records are added far more often than
deleted, and the deletions that matter — a mistapped diaper — are cheap to
repeat, so the trade is worth it. It is still a real limitation.

## Backups

**Settings → Your data → Export a backup** downloads the document as a
pretty-printed JSON file — the same bytes the backends hold. **Restore from a
backup** merges a file in with the same merge sync uses, so restoring an old
backup onto a live phone never drops this month.
