# Sync

The app is local-first: the record lives in this browser, and that copy is
always the working copy. "Where the record lives" in Settings adds a second
copy — on the same device or in your own account — so it survives more, or so
another device can read it. There is no server in between.

## The backends

| Backend          | What it is                                                                                                                                                                                                | Needs                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **This device**  | The localStorage working copy alone.                                                                                                                                                                      | Nothing.                                             |
| **IndexedDB**    | A second copy in the browser's IndexedDB (`baby:documents`) — more room than localStorage, and kept when the browser trims other site data.                                                               | Nothing.                                             |
| **Local folder** | A directory you pick through the browser's File System Access API; the record becomes `baby.json`, a real file you can open, back up, or point another app at. The grant is stored and re-probed on boot. | A Chromium browser (Chrome, Edge). Hidden elsewhere. |
| **Dropbox**      | `Apps/nird-baby/baby.json` in your Dropbox.                                                                                                                                                               | `VITE_DROPBOX_APP_KEY` at build time.                |
| **Google Drive** | `nird-baby/baby.json` in My Drive, with the `drive.file` scope — the app sees the files it created and nothing else.                                                                                      | `VITE_GOOGLE_CLIENT_ID` at build time.               |

All five speak the framework's one `StorageAdapter` contract, so the engine
(`src/app/useSyncEngine.ts`) is the same past the `create*Adapter` calls: it
pulls the backend's copy on connect, pushes the document after a short
debounce on every edit, and refuses a push whose base revision has moved.
The IndexedDB adapter is the one app-local one (`src/app/idbAdapter.ts`); it
keeps a revision counter beside the text so two tabs cannot write over each
other.

**Disconnecting** removes the credentials or the folder grant from this
device. The record stays here, and the copy already on the backend is left
exactly where it is.

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
