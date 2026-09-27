# Encryption and the app lock

## Encryption

Your child's record is health information, so a copy that is not the
browser's own — in a local folder or in Dropbox — is always encrypted first.
Connect either and the app asks you to **choose a passphrase**; everything it
writes there from then on is an AES-256-GCM envelope sealed with a key derived
from that passphrase (PBKDF2-SHA256, 600,000 iterations). The folder, whatever
program syncs it, and Dropbox hold ciphertext they cannot read — and so would
anyone who got into the account.

It is not optional: while a folder or a cloud copy is connected and no
passphrase is held, sync simply waits — nothing is ever written there in
plaintext. A copy an earlier version left in plaintext is re-written encrypted
the first time the app reads it after you set the passphrase.

On a second device the app finds the encrypted copy and asks for the same
passphrase. Each device remembers it, so you type it once per device. Change it
from Settings → Where the record lives and the other devices ask for the new
one on their next sync.

**Write the passphrase down.** Nobody can recover it — not this app, not
Dropbox. The record on your devices is unaffected if you lose it; the copy in
the folder or the cloud is what becomes unreadable.

The details — what is asked when, and what is remembered where — are in
[`../sync.md`](../sync.md#encryption).

## App lock

Settings → **App lock** sets a PIN this device asks for when the app opens, and
again after it has spent five minutes in the background. It is a soft lock: it
keeps a borrowed or unlocked phone out of the record, and the copy says so — it
does not encrypt anything on the device, and a short code is not a secret
against someone who can read the browser's storage. The PIN is never stored,
only a PBKDF2 verifier of it, and it stays on this device: each parent's phone
chooses its own.
