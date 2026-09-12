# Troubleshooting

## Installing and building

### `npm install` fails with `401 Unauthorized` or `404` on the framework

`@niclaslindstedt/oss-framework` resolves from GitHub Packages, which
requires auth even for public packages. Put a `read:packages` token in your
npm config once:

```sh
npm config set //npm.pkg.github.com/:_authToken <your-token>
```

The committed project `.npmrc` only pins the registry for the
`@niclaslindstedt` scope — it deliberately carries no token.

### `npm install` fails with "Cannot read properties of null (reading 'edgesOut')"

An npm 10 quirk with the `react` → `preact/compat` overrides when no lockfile
is present. The committed `package-lock.json` avoids it; if you deleted it,
restore it from git before installing.

### `make lint` / `make test` fail on missing modules right after a web session opens

The session-start hook installs dependencies in the background
(`.claude/hooks/session-start.sh`); `node_modules` may still be populating.
Wait a moment and retry.

## Using the app

### The Food tab says there is nothing to track

The child is under six months. Breast milk or formula is everything an
infant needs until then; tiny tastes from four months are fine. The regimen
and the assessment appear from six months. See [nutrition.md](nutrition.md).

### The regimen "may no longer provide enough energy"

The child has grown past a regimen that used to be enough. Increase a
portion, add a food, or change the regimen until the assessment card reads
"covers the day" again — and check the milk feeding is right, because a
breastfed child's target is only the share food is expected to cover.

### A nutrient reads "no food states it"

No food in the regimen carries a value for it. The app never reads a blank as
zero; enter the value from the label on the foods that have it, or leave it —
only calories are needed.

### A reading sits far off the curve

Check the date and the unit — kilograms, centimetres — and whether the
child's sex is right under Settings → Your child. One reading is a fact about
that morning; the trend across readings is what the screen reads. See
[growth.md](growth.md).

### The expected adult height is missing

Both parents' heights are needed. Add them under Settings → Your child.

### A diaper warning appeared but the baby is fine

The floors are the cautious end of what child health care quotes, read over
the last 24 hours. A dirty-diaper gap for a breastfed baby past six weeks is
only mentioned beyond two weeks; a wet-diaper floor can be missed by a day
of heavier, fewer diapers. The copy names the signs that matter — light
diapers, dark urine, hard stools, an uncomfortable baby. See
[diapers.md](diapers.md).

### A vaccination shows "expected by now" but BVC hasn't called

The ages are the programme's; the child health centre works to its own
windows, and a dose a few weeks past its expected date is not late. Record it
when it is given.

## Storage and sync

### The "Local folder" backend is missing

The directory picker exists in Chromium browsers (Chrome, Edge, Brave, Arc)
only. Use IndexedDB, or a cloud backend, elsewhere.

### The folder asks to be reconnected

The browser revoked the stored grant (a restart, a cleared permission). Tap
**Reconnect to the folder** in Settings; the folder is remembered, only the
permission needs confirming.

### Cloud sync shows "Reconnect needed"

The provider's session lapsed (Google's token grants are short-lived; Dropbox
refreshes its own). Tap the sync glyph → **Reconnect**. The record is safe
locally the whole time — pushes are simply held until the session is back.

### A removed record came back

A removal is an absence, not a tombstone, so another device that still holds
the record re-contributes it on the next merge. Remove it on each device, or
remove it on one and let that device sync before the other opens. See
[sync.md](sync.md#the-known-limitation-removals-come-back).

## The PWA

### The installed app is stale after a deploy

Updates apply through the in-app prompt: the new version downloads in the
background and a toast offers **Reload** when it is ready. If the toast never
appears, close the app fully and reopen it — iOS in particular only checks
for a new worker on a fresh launch.

### The app shows the setup screen but your record existed

The document is only replaced when _you_ delete it — an unreadable stored
copy is left on disk untouched and quarantined under `baby:doc:unreadable`,
and it comes back once the app finishes updating. Check Settings → About
shows the newest version, and avoid clearing site data, which is the one
thing that genuinely erases the record.

## Developer

### The demo data won't turn off

It is in-memory only — reloading the page always restores your real record.
The toggle also turns itself off when developer mode is switched off.

### Where are the logs?

Settings → Developer → the log panel (turn on **Capture console output** to
mirror `console.*` there too). The sync engine writes its own lines into the
same buffer.
