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
| **iCloud Drive** | `baby.json` in the app's own iCloud container, shown in the Files app as **iCloud Drive → Baby**. Offered through a document-store host the App Store app installs (`src/app/cloudHost.ts`); absent in a browser.        | The App Store app, on a device signed in to iCloud.           |

All four speak the framework's one `StorageAdapter` contract, so the engine
(`src/app/useSyncEngine.ts`) is the same past the `create*Adapter` calls: it
pulls the backend's copy on connect, pushes the document after a short
debounce on every edit, and refuses a push whose base revision has moved.
The IndexedDB adapter is the one app-local one (`src/app/idbAdapter.ts`); it
keeps a revision counter beside the text so two tabs cannot write over each
other.

Only the last three are _sync_ in the sense the top bar's glyph means —
somewhere the record could also be read from. On **This device** there is no
glyph: there is nothing to watch the status of.

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

**Disconnecting** removes the credentials or the folder grant and comes back
to this device. The record stays here, and the copy already on the backend is
left exactly where it is.

## How two copies reconcile

Record by record, matched to what the data means:

- The **child**, each **measurement**, each **food**, the **milk feeding** and
  each **vaccination** carry an `updatedAt`; the later edit wins, record by
  record. Editing a reading on the phone and adding a food on the laptop
  keeps both.
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
