# Agent guidance for baby

This file is the canonical source of truth for AI coding agents working in this
repo. `CLAUDE.md`, `.cursorrules`, `.windsurfrules`, `GEMINI.md`,
`.aider.conf.md`, and `.github/copilot-instructions.md` are symlinks to this
file.

Fleet guidelines: APP_GUIDELINES 1.1.0

## What this app is, and the three rules that follow from it

A baby tracker holds health data about a child. The whole design premise is
that the data never leaves the device unless its parents explicitly connect a
folder or their own cloud account, and that the app asks for as little as it
can.

**Rule one: never add a network call that isn't the user's own storage
backend.** No analytics, no error reporting service, no font CDN, no
"anonymous" telemetry, no third-party script, and no food or growth lookup
API — not behind a flag, not in dev only. The WHO growth standards, the food
presets and the vaccination schedule are bundled chunks
(`src/app/data/`) read locally, never a service. If a change would send a
byte of the record, or a byte _about_ the record, anywhere the user did not
choose, it is the wrong change however useful the feature is.

**Rule two: minimal input, useful output.** The app is not a diary. A diaper
change is one tap and a timestamp; a sleep is a tap when it starts and one
when it ends; a growth reading is what the scale said;
the food regimen is the foods the child _typically_ gets in a day with a
daily amount each and, optionally, the times of day they are given, updated
when the normal diet changes — never a meal log.
Before six months there is nothing to track about food, and the Food screen
says so and stays out of the way. Every field in the model is read by a
number on some screen; a field nothing reads is a question asked for
nothing. Before adding one, name the answer on Today, Sleep, Growth, Food or
Vaccines that would move because of it.

**Rule three: the app is a notebook, not a clinician.** It records what the
parent entered and compares it with published recommendations —
Folkhälsomyndigheten's vaccination programme, the Nordic Nutrition
Recommendations 2023, the WHO growth standards, the diaper counts child
health care quotes. Copy must not imply medical authority: a reading outside
the band is "a reason to look, not a verdict", a thin diaper day names the
sign to look for, and the disclaimer in Settings exists for this reason and
must not be quietly dropped. Every threshold in the code cites its source in
a comment with a `[ref:<id>]` tag into `docs/references.json`, which
Settings → About lists for the parent, citation, quotes and all (see "Every
threshold cites its source" below). A number no source gives — a floor the
sources leave open, an extrapolation past where a guideline stops — says in
its comment that it is the app's own.

## Build and test commands

```sh
make install       # npm install (needs GitHub Packages auth — see below)
make build         # production build (vite build)
make test          # full test suite (vitest)
make lint          # eslint + tsc --noEmit
make fmt           # prettier --write
make fmt-check     # verify formatting (CI)
make icons         # regenerate the PWA icons, favicon, and og image
```

The phone wrapper in `native/` has a **dependency tree of its own** — `make
install` does not touch it, and neither does `npm ci` at the root:

```sh
make native-install    # npm --prefix native install
make native-bundle     # build the web app into native/assets/webroot.zip
make native-typecheck  # the wrapper's own tsc
make native-prebuild   # inspect what expo prebuild generates
```

It is a thin Expo shell for the App Store and Google Play: the built site in
a `WebView`, served from a loopback origin — nothing in `src/` asks whether
it is native. The wrapper offers Dropbox's sign-in an in-app authentication
session at `window.__ossAuthSession`, a **capability** the framework's
`getAuthSessionHost` looks for; a browser has none and keeps its redirect.
There is **no iCloud, on purpose**: App Store guideline 5.1.3(ii) keeps
personal health information out of it, so the child's record stays on the
device or in the parent's own Dropbox. Do not add an iCloud store, CloudKit
or an iCloud entitlement. See
[`native/README.md`](native/README.md) and
[`docs/features/native-app.md`](docs/features/native-app.md).

The desktop shell in `tauri/` is a Rust project with its own toolchain; `make
test` and `make lint` stop at its edge:

```sh
make tauri                # bundle the site into the shell and run the desktop app
make tauri-test           # its decision layer (cargo test -p baby-shell — no GUI libs)
make tauri-lint           # clippy at zero warnings, both crates
make tauri-fmt            # rustfmt in place (tauri-fmt-check verifies)
make tauri-package        # this machine's installers
make tauri-package-debug  # …debug profile: minutes faster, much bigger
```

It is a **thin** wrapper: a window, the built site served from a private
`baby://` scheme, and one capability a page cannot have — the loopback
listener that lets Dropbox sign in (`tauri/shell/src/oauth.rs`,
`tauri/src-tauri/src/loopback.rs`). **The page is never told it is inside
it** — no injected global, no Tauri command. `tauri/shell/` holds every
decision and needs no GUI toolkit; `tauri/src-tauri/` holds every effect. One
seam reaches back into this tree, `VITE_SHELL_BUILD`, set by the shell's site
build — and by the phone wrapper's — which switches off the service-worker
half of `appPwa` and — through `__SHELL_BUILD__` — the in-app update prompt. A
desktop or phone build updates by being replaced, never by a worker. Both
store builds also set
`VITE_EMBEDDED_BUILD`, which leaves the Open Graph / Twitter Card tags and the
Pages `CNAME` out: **a store app carries no link back to the source** — no
repository, issues, releases or sponsor link, and not the author's handle
anywhere — and both `bundle-web.mjs` scripts refuse a bundle that names it,
or that holds a `sw.js`. Only the phone's sets `VITE_NATIVE_BUILD`, which is
what gives its top bar the store listing's name (`app-name.ts`). The package's
name and identifier come from `APP_DISPLAY_NAME` and `APP_BUNDLE_ID` at
packaging time (`tauri/scripts/package.mjs`), like the phone app's. The macOS
package is signed and notarized by `.github/actions/apple-signing` when its six
optional secrets are set, and packaged as before when they are not. See
[`tauri/README.md`](tauri/README.md).

The `@niclaslindstedt/oss-framework` dependency comes from the **GitHub
Packages** npm registry (see `.npmrc`). GitHub Packages requires auth even for
public packages, so local installs need a `read:packages` token in `~/.npmrc`
(`//npm.pkg.github.com/:_authToken=<token>`); CI authenticates with the
workflow's `GITHUB_TOKEN`.

### Dependency install in web sessions

Claude Code on the web runs `.claude/hooks/session-start.sh` on `SessionStart`
(wired up in `.claude/settings.json`), so **dependencies install automatically
in the background** — an agent shouldn't run `make install` by hand first. The
hook resolves a GitHub Packages token from the environment
(`NODE_AUTH_TOKEN` / `GITHUB_PAT` / `GH_TOKEN` / `GITHUB_TOKEN`, first wins),
writes it to `~/.npmrc`, and runs `npm install` — the committed project
`.npmrc` stays token-free. It runs in **async** mode, so `node_modules` may
still be populating for a moment after the session opens; if a `make` target
fails on a missing dependency, wait and retry. The hook is a no-op outside the
web environment (`CLAUDE_CODE_REMOTE`), so it never touches a local
developer's npm config.

### Keep the framework current

Before starting a task, check the newest framework release with
`npm view @niclaslindstedt/oss-framework version`, bump the `package.json`
range if a newer one exists, reinstall, and work against that.

## Commit and PR conventions

- All commits follow [Conventional Commits](https://www.conventionalcommits.org/).
- PRs are squash-merged; the **PR title** becomes the single commit on `main`,
  so it must follow conventional-commit format.
- Breaking changes use `<type>!:` or a `BREAKING CHANGE:` footer.

### Watching a PR after you open it

Don't babysit a PR with polling. **Do not** schedule `send_later`, cron jobs,
`ScheduleWakeup`, or timed self-check-ins to re-check CI or merge state — those
just burn turns. Open the PR, confirm the checks you can see are green, then
stop. CI failures and review comments are delivered to the session as webhook
events, so you'll be woken when there's actually something to act on.

## Architecture summary

This is a **frontend-only, local-first PWA** — there is no server. It is built
on [`oss-framework`](https://github.com/niclaslindstedt/oss-framework), the
same shared surface behind the sibling `meds`, `contacts`, `notes` and `cycle`
apps, and its shell is the `meds` app's: a top bar with the app mark, the sync
glyph, a `+` and a cog, six bottom-nav tabs a swipe moves between, and three
off-bar screens (the child profile, Settings, and About behind it).

The framework owns the UI kit and the generic mechanics: modals, form
primitives, the theme engine, the bottom bar and the tab-paging swipe, the
chart primitives, the storage adapters (localStorage / a picked folder /
Dropbox) and the IndexedDB store, the i18n runtime, logging,
the toast store, and the PWA update state machine.

### The renderer is Preact

`preact` is the only renderer dependency — **never add `react` or `react-dom`
back.** `@preact/preset-vite` compiles JSX against `preact/jsx-runtime` and
aliases `react` / `react-dom` (and their `/jsx-runtime` + `/client` subpaths)
onto `preact/compat`; `tsconfig.json` `paths` and `package.json` `overrides`
mirror that for `tsc` and npm, so the framework — which is built against React
— resolves to Preact too. App code keeps importing hooks and types from
`"react"`, which is the supported compat path; only `src/main.tsx` uses
Preact's own `render`. Two differences bite in new code: use `e.currentTarget`
rather than `e.target` in event handlers, and spell string-valued attributes
like SVG's `focusable` as `"false"` rather than a JSX boolean.

### The app owns the domain ("store stays in the app")

- `src/app/types.ts` — the `Child` / `Measurement` / `DiaperChange` /
  `SleepSession` / `Food` / `MilkFeeding` / `Vaccination` / `AppData` model. One child per document.
  A food is a name, a daily amount and its content per 100 g, of which only
  calories are required; a blank nutrient is unknown, never zero.
- `src/app/age.ts` — days and WHO months for the tables, calendar months
  for the schedule, and the parts a parent says out loud. **Pure and
  clock-free**, like everything below: `today` is always a parameter.
- `src/app/growth.ts` — readings placed on the WHO standards as z-scores
  (LMS), the SD channel curves, the trend across channels, the
  channel-following forecast with damped drift and nested credible bands,
  and the Swedish mid-parental target height (Luo 1998). The standards
  themselves are `src/app/data/whoGrowth.ts`, generated from the WHO tables
  and loaded once through `useGrowthStandards.ts`.
- `src/app/nutrition.ts` — the recommendation for the child's age and
  weight (NNR2023 / FAO 2004 / WHO 2023), the regimen's totals, the
  assessment, and `outgrown` — the one sentence the app exists to say.
  `src/app/data/foods.ts` is the preset list behind the food form's chips.
- `src/app/diapers.ts` — the counts (per local day, wet and dirty), the
  daily series, and the age-scoped norms with the last-24-hours assessment.
- `src/app/sleep.ts` — the sleep log read: the spans (the running sleep up
  to now, overlaps clipped), the sleep day a night belongs to (the evening it
  began), the rolling 24 hours, the 30/90-day averages, the WHO
  recommendation and Galland 2012's observed range for the age, the
  Tresillian/Karitane wake windows, the child's own rhythm, and `nextSleep`
  — where the child is now and when the next nap or bedtime is likely to
  suit.
- `src/app/vaccines.ts` — Folkhälsomyndigheten's programme as data, the
  extras outside it, and the timeline derivation (given / due / upcoming).
- `src/app/merge.ts` — the document merge both sync and backup restore run
  through: stamped records (sleeps included) by last edit, diaper changes by
  union.
- `src/app/migrations.ts` — parse / normalise / serialize; the only module
  that trusts stored bytes.
- `src/app/references.ts` — the references registry bound to this app (see
  "Every threshold cites its source"): the framework's `references` types
  with the trackers as topics, the summary languages, and `useReferences`,
  which loads `docs/references.json` in its own chunk. The machinery — the
  evidence ranking, the citation helpers, the audit and `ReferenceCard` — is
  the framework's `references` module, shared with the sibling apps.
- `src/app/useDocStore.ts` — the document store over a `DocBackend` seam
  (which is what demo data swaps). Its edits are the app's whole write
  vocabulary.
- `src/app/useSyncEngine.ts` — the sync engine over the framework's storage
  adapters plus the app's own `idbAdapter.ts`: local, IndexedDB, a picked
  folder, Dropbox. Suspended wholesale while demo data has
  taken over storage. A copy in the folder or Dropbox is **always
  encrypted**: the adapter comes from the framework's
  `useEncryption` (`policy: "required"`, `remember: "device"`), which is `null` until the passphrase is held, so
  nothing is ever written there in plaintext. Never sync through the raw
  `inner` adapter.
- `src/app/SyncEncryption.tsx` — the app's words for the framework's
  encryption kit: `EncryptionGate` in the shell, `EncryptionSettings` under
  sync, and the PIN's `PinGate` and `PinLockControl`. The kit owns the
  machinery; this file only translates it. The passphrase is
  remembered on the device per backend; the PIN verifier never leaves the
  device. A PIN is a soft lock and its copy must keep saying so.
- `src/app/dev/` — the developer "Demo data" switch: an invented
  baby of seven and a half months (`demoData.ts`, pure, every date an
  offset from the moment it opens — also the store screenshots' data,
  booted before the first render by `VITE_SEED=demo` / `make demo`,
  with tests in `tests/demo_test.ts`), the in-memory `DocBackend` that serves it, and the
  never-persisted flag. Behind `import()`.
- `src/app/TodayScreen.tsx`, `DiapersScreen.tsx`, `SleepScreen.tsx`,
  `GrowthScreen.tsx`, `FoodScreen.tsx`, `VaccinesScreen.tsx` — the six tabs;
  `ChildScreen.tsx`, `SettingsScreen.tsx` and `AboutScreen.tsx` (behind
  Settings → About: the disclaimer and every source in the registry) — the
  three off-bar screens;
  `QuickLogSheet.tsx` — the sheet behind the top bar's `+`.
  `WhenModal.tsx` is the "when?" sheet both logging buttons open after the
  tap — **Now**, and behind **Earlier** the usual lags as tiles and a
  single-handle dial (`TimeDial.tsx`) for any other time — over the pure
  `when.ts`. Show a control when it is wanted, not all the time: the app
  stays uncluttered by keeping the rarer choices one tap away.
  `DiaperButtons.tsx` is the app's only diaper-logging control and
  `SleepButtons.tsx` its only sleep-logging one, and every place that logs
  either renders it; `SleepForm.tsx` is the sheet that corrects a sleep on
  the Sleep tab, on the dial `SleepClock.tsx` draws, and `SleepNow.tsx` the
  tab's live dial (plus the ring, running line and countdown on Today's
  card).
- `src/app/sleepEdit.ts` — the sleep log, written: the rules a tapped time
  (`sleepTimeProblem`) or a corrected span (`sleepEditProblem`) must pass,
  and where the dial opens (`sleepDraft`). Pure, like `sleep.ts`.
- `src/app/dial.ts` and `ClockDial.tsx` — the 24-hour dial: the pure
  arithmetic (a time's angle, the time under a finger, a drag read as a
  change in angle so it runs past midnight, snapping, stopping at now) and
  the face every sleep dial is drawn on.
- `src/app/live.tsx` — the moving parts: `useTick` (a clock that re-renders
  only its holder and stops while the page is hidden), `Elapsed` (a
  stopwatch or countdown to the second) and `ProgressRing`. The CSS they
  wear is `styles.css`'s "Live" block, all of it still under reduced
  motion.
- `src/app/ViewModal.tsx` and the five views it wraps — `DiapersModal.tsx`,
  `SleepModal.tsx`, `GrowthModal.tsx`, `FoodModal.tsx`, `VaccinesModal.tsx`
  — the read-only
  answers, opened from Today's headline cards. See "Input on the tabs,
  answers on Today" below.
- `src/app/GrowthChart.tsx`, `DiaperChart.tsx`, `SleepChart.tsx`,
  `SleepDiary.tsx`, `DayCoverageChart.tsx` —
  hand-built from the framework's chart _primitives_ (`bandPath`, `linePath`,
  `areaPath`, `barPath`, `linearScale`, `niceTicks`), not its finished chart
  components.
- `src/app/i18n/en.ts` — every user-facing string; `sv.ts` must satisfy it.
- `src/app/locale.ts` — the one locale every date, time and number is
  formatted in (the language's words, the device's formats), read through
  `useLocale()`; never name a BCP-47 tag in a component.
- `src/app/units.ts` — US units at the edge: pounds/ounces and inches for a
  US locale, converted on display (`format.ts`) and in the forms' drafts, the
  document always metric and the WHO curves drawn by a linear scale.
- `src/output.ts` — the central output module.
- `pwa-plugin.ts` — emits the service worker + version/precache manifests
  the framework's `usePwaUpdate` consumes.

Dependency direction: screens → stores → framework. Nothing imports from the
framework's internals — only its published subpaths.

### Input on the tabs, answers on Today

The five bottom-bar destinations beside Today are where a record goes **in** —
a diaper, a sleep, a reading, a food, a dose marked given — and they carry no
derived numbers. Everything the app _concludes_ is on Today, one tap behind a
headline card, in a `ViewModal`: the last 24 hours of diapers, the sleep
averages and the suggested next nap, the growth curves, the day's food
coverage, the vaccination card. Full screen on a phone, a card over
a blurred page from `sm:` up.

Two rules follow. **A view never writes** — a modal that could edit would be a
second write path for data the tab behind it owns. And **a stat never moves to
a tab**: if a new derivation needs a home, it belongs in the matching view or
on a Today card, not on the screen where the record is typed. A running
record's own clock — a sleep counting up from its start — is a reading of the
record, not a stat, and belongs on the tab; a ring filling toward a suggested
time is a comparison, and stays on Today.

### Alive, not explained — the sleep module is the reference

A record that is running shows its clock running, to the second, and a span
of time is drawn on the 24-hour dial rather than described. The Sleep tab is
the reference every tracker is to be brought up to: a live dial and
stopwatch where there used to be a paragraph of instructions, rows that open
the record on a draggable dial instead of four date and time fields, and no
hint text a shape can replace. Reuse the pieces — `live.tsx`, `dial.ts`,
`ClockDial.tsx`, the "Live" CSS — rather than growing a second set, keep
every animation in CSS and still under `prefers-reduced-motion`, and tick
only the component that shows the time, never a whole screen.

### Derive, don't store

Nothing about the assessments is persisted — not a z-score, not "regimen
sufficient", not a diaper verdict, not a vaccination's status. The document
holds the child and the records and only those; everything else is
recomputed on render. This is why editing a reading immediately fixes every
downstream number, and why there is no cache to invalidate. **Adding a
derived field to `AppData` is almost always the wrong fix** — the right one
is a function in the matching domain module.

### Every threshold cites its source

The growth standards, the energy and nutrient targets, the breast-milk
energy shares, the diaper floors, the sleep recommendations and wake
windows, and the vaccination ages are all quoted
from a named source in the module header or beside the number. A change to
one of them is a change to a claim the app makes to a parent: keep the
citation next to the value, and update `docs/` (see the sync table) in the
same PR.

**The references registry.** `docs/references.json` is the one list of every
source the app's numbers and claims rest on, keyed by a stable id. Each
entry carries its authors or organization, title, where it was published, the DOI / URL / ISBN,
the language, the kind of evidence (`EVIDENCE` in the framework's
`references` module:
`guideline`, `consensus`, `systematic-review`, `meta-analysis`,
`randomized-trial`, `cohort`, `clinical-study`, `review`, `method`,
`dataset`, or `health-service` for practitioner guidance), the verbatim
quotes the numbers were taken from, what the app uses it for (`supports`, for
a contributor), and `usedBy` — the files that cite it. Two fields are the
app's own: `summary`, the same in a parent's words in English and Swedish,
and `topics`, the trackers the source serves. Both are read by the About
screen, which lists every entry straight from the registry through
`references.ts` — so a new source is shown to parents in the same change
that cites it, with no second list to keep. Code cites an entry with a
`[ref:<id>]` tag in the comment beside the number (a claim in a catalog
string gets its tag in a comment above the key). `tests/references_test.ts`
runs the framework's `auditReferences` over `src/`, and fails on a tag with
no entry, an entry nothing cites, a `usedBy` that doesn't match the tags, an
incomplete entry, or one without its `summary` in both languages and a
`topics` tracker. A new source means
an entry and a tag in the same change. Every tracker's module is in the
registry — `sleep.ts`, `growth.ts` (with `data/whoGrowth.ts` and `age.ts`'s
WHO month), `nutrition.ts` (with `data/foods.ts`), `diapers.ts` and
`vaccines.ts` — and the test pins that every tracker has sources listed, so
a new one arrives with its own.

## Where new code goes

| Change                                 | Goes in                                                                                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| A new fact about the child or a record | Probably nowhere — see rule two. If it survives that: `src/app/types.ts` + `migrations.ts` (bump `DOC_VERSION`, append a step)           |
| A new derived number                   | The matching domain module (`growth.ts`, `nutrition.ts`, `diapers.ts`, `sleep.ts`, `vaccines.ts`) with tests in `tests/<module>_test.ts` |
| A change to a recommendation or floor  | The same module, next to its `[ref:<id>]` citation, plus the entry in `docs/references.json` and the matching `docs/*.md` topic          |
| A new source                           | An entry in `docs/references.json` (with `summary` in both languages and `topics`) and its `[ref:<id>]` tag — About lists it by itself   |
| A new programme dose or extra vaccine  | `src/app/vaccines.ts` (`PROGRAMME` / `EXTRAS`) + the group label in `i18n/en.ts` and `sv.ts`                                             |
| A food preset                          | `src/app/data/foods.ts`                                                                                                                  |
| A new screen                           | `src/app/<Name>Screen.tsx` + a tab in `BottomNav.tsx`, or a button in `TopBar.tsx` if it is an action rather than a place                |
| A new way to keep the record           | `useSyncEngine.ts` (`SyncBackendId`, `AVAILABLE_BACKENDS`, the adapter) + `settings.backendName`/`backendHint` in both catalogs          |
| A new answer to show a parent          | A card on `TodayScreen.tsx`, or the matching `*Modal.tsx` behind it — never one of the five input tabs                                   |
| A new way to log a diaper              | Never a second write path — render `DiaperButtons` and write through `addDiaper`                                                         |
| A new way to log a sleep               | Never a second write path — render `SleepButtons` and write through `saveSleep`                                                          |
| A running clock, a ring, a pulse       | `live.tsx` (`Elapsed`, `ProgressRing`, `FillRing`, `useTick`) and the "Live" block of `styles.css` — never a per-screen `setInterval`    |
| When a tapped thing happened           | `WhenModal.tsx` (icon, title, question, optional `earliest` and `usual`) over `when.ts` — never a per-button time row or a second picker |
| A time span to show or drag            | `ClockDial.tsx` over `dial.ts` (with tests in `tests/dial_test.ts`); `SleepClock.tsx` is the worked example of dragging one              |
| A new setting                          | `src/app/useAppSettings.ts` (shape + fallbacks) + a `Section` in `SettingsScreen.tsx`                                                    |
| A new feature switch                   | `FeatureId` in `useAppSettings.ts`, guards on the screens it owns, and `navTabs()` if it has a tab                                       |
| A new storage backend                  | The framework, if generic; `useSyncEngine.ts` wires adapters up, and `idbAdapter.ts` is the one app-local adapter                        |
| A change to what the demo shows        | `src/app/dev/demoData.ts` (offsets from `now`, never fixed dates), with tests in `tests/demo_test.ts`                                    |
| Any user-facing string                 | `src/app/i18n/en.ts` **and** `sv.ts`, never inline in a component                                                                        |
| A shared UI primitive                  | The framework, if it is domain-free; `src/app/ui.tsx` only for this app's layout pieces                                                  |
| Tests                                  | `tests/<module>_test.ts`                                                                                                                 |
| Docs                                   | `docs/` (references) and `docs/features/` (changelog-linked feature docs only)                                                           |
| LLM prompt                             | `prompts/<name>/<major>_<minor>_<patch>.md` (see `prompts/README.md`) — none exist; the app makes no LLM calls                           |

## Test conventions

Tests live in `tests/` with a `_test` suffix and run under
Vitest in the `node` environment — they cover the pure domain modules
(`age`, `growth`, `nutrition`, `diapers`, `sleep` — `sleepEdit` included —,
`dial`, `vaccines`, `merge`, `migrations`, `references` — which also holds
the registry to the tags),
which is where the app's real logic is. No DOM, no testing-library, no mocked
clock: every test pins real dates, and the WHO rows it checks against are the
published ones.

Run one file with `npx vitest run tests/growth_test.ts`.

A change to a derivation without a test that pins the new behaviour to real
dates is not finished. UI changes should keep the boot smoke path working:
`npm run build && npm run preview`, set up a child, log a diaper on Today, add
a reading under Growth, and check that the Today cards move with it.

## Source file size

- Non-test source files must stay under **1000 physical lines**. Prefer
  splitting by concern over relaxing the cap.
- A file may opt out with `guidelines:allow-large-file: <reason>` in its first
  20 lines; the reason must be real, and a marked file is split when it is
  next touched.

## Changelog and feature docs

`CHANGELOG.md`'s released sections are **generated** — never hand-edit them.
Every user-visible change adds a fragment under `.changes/unreleased/`:

```
.changes/unreleased/$(date +%s)-short-slug.md
---
type: Added        # Added | Changed | Fixed | Removed | Security | Deprecated
title: Short bold title
doc: growth        # optional — the slug of a docs/features/<slug>.md feature doc
breaking: true     # optional — forces a major release
---

One sentence a user will read in the changelog.
```

A fragment for a substantial feature links to its doc under `docs/features/`
with `[Learn more](feature:<slug>)`. One doc per feature, one feature per
doc; `docs/features/` holds changelog-linked docs only, and the fuller
references live under `docs/` proper.

## Documentation sync points

| If you change…                                   | Update…                                                                                                        |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `growth.ts` or `data/whoGrowth.ts`               | `docs/growth.md`, `docs/features/growth.md`, and the README's Examples block if the output shape moved         |
| `nutrition.ts` or `data/foods.ts`                | `docs/nutrition.md`, `docs/features/food.md`                                                                   |
| `diapers.ts`                                     | `docs/diapers.md`, `docs/features/diapers.md`                                                                  |
| `sleep.ts`, `sleepEdit.ts`                       | `docs/sleep.md`, `docs/features/sleep.md`, and `docs/references.json` for any source added or dropped          |
| `live.tsx`, `dial.ts`, `ClockDial.tsx`           | `docs/architecture.md` ("Live, and the dial") and this file's "Alive, not explained"                           |
| A `[ref:<id>]` tag anywhere                      | `docs/references.json` — the entry, its quotes, its `usedBy`, and its `summary` / `topics` for About           |
| `references.ts` or `AboutScreen.tsx`             | `docs/architecture.md` ("Where the numbers come from"), `docs/features/sources.md`                             |
| `vaccines.ts`                                    | `docs/vaccinations.md`, `docs/features/vaccinations.md`                                                        |
| The document shape (`types.ts`, `migrations.ts`) | `docs/architecture.md`'s data shape, and a `migrations.ts` step                                                |
| `useSyncEngine.ts`, `idbAdapter.ts`, `merge.ts`  | `docs/sync.md`, `docs/features/cloud-sync.md`                                                                  |
| The phone wrapper (`native/`, `cloudHost.ts`)    | `native/README.md`, `native/RELEASING.md`, `docs/features/native-app.md`                                       |
| A `VITE_*` variable                              | `docs/configuration.md`, `src/vite-env.d.ts`, `.env.example`, the README's Configuration table, the workflows  |
| A screen's behaviour                             | The matching `docs/features/*.md` and the README's Usage table                                                 |
| The navigation (nav or top bar)                  | `docs/architecture.md` and the README's Usage tables                                                           |
| Module layout                                    | The "Where new code goes" table above and `docs/architecture.md`                                               |
| A make target or script                          | `CONTRIBUTING.md`, the README's Quick start, and this file's command list                                      |
| The app mark                                     | `public/icons/icon.svg`, `scripts/generate-icons.mjs`, `AppMarkIcon` in `src/app/icons.tsx`, then `make icons` |

## Parity and cross-cutting rules

- **Every string goes through `t()`**, and `sv.ts` must carry every key
  `en.ts` does — the `Catalog` type enforces it. A runtime-built key needs a
  cast at the call site: ``t(`prefix.${x}` as Parameters<typeof t>[0])``.
- **Two themes only** — one light, one dark, plus "follow the device". The
  framework ships a dozen palettes; this app deliberately exposes none of
  them. Don't reintroduce the picker.
- **The bottom nav is the navigation.** Six tabs — Today plus one per
  tracker, in `FEATURES` order — no sidebar, no drawer, and they are
  _destinations_ in a fixed order a swipe moves along, minus the ones whose
  tracker is switched off in Settings (`navTabs()` filters the order; Today
  is never one of them). Things you do and then leave — editing the child,
  changing a setting — belong on the top bar, and so does the `+`: it opens
  a sheet rather than a screen so logging a diaper or a sleep never costs
  the chart someone had open.
- **Logging is one code path.** The Diapers tab and the sheet both render
  `DiaperButtons` and both write through `addDiaper`; the Sleep tab and the
  sheet both render `SleepButtons`, and starting, ending and correcting a
  sleep all write through `saveSleep`.
- **The service-worker contract** (cache id, `sw.js`, `version.json`,
  `precache-manifest.json`) is shared between `src/app/pwa.ts` and
  `pwa-plugin.ts`; change them together.
- **`public/icons/*`, `native/assets/*.png` and the desktop icons are
  generated** — edit `scripts/generate-icons.mjs` (and
  the hand-written `public/icons/icon.svg` and `AppMarkIcon` to match) and
  rerun `make icons`.
- **No dependency creep.** The framework, Preact, two fonts, and
  workbox-window. A new runtime dependency needs a reason the framework can't
  serve.
- **The phone app's URL scheme is its bundle id** (`scheme: BUNDLE_ID` in
  `native/app.config.js`): `se.agilator.baby` in a store build,
  `dev.local.baby` in a plain checkout. Reverse-DNS so no other app can claim
  it, and never committed as a literal — it follows `APP_BUNDLE_ID`.
- **The auth-session bridge's names are the framework's**
  (`AUTH_SESSION_HOST_PROPERTY`, `AUTH_SESSION_HOST_EVENT`), spelled again in
  `native/src/authSessionBridge.ts`; `tests/native_auth_session_test.ts` pins
  them. The phone app's Dropbox sign-in returns on `<scheme>://oauth` —
  `se.agilator.baby://oauth` in a store build — and the Dropbox app must list that exact
  URI, so changing the bundle id breaks phone sign-in until the App Console
  follows.

## Website staleness

The app _is_ the website — `pages.yml` builds it and
deploys `dist/`. There is no separate marketing site to drift out of date, but
the copy in `index.html` does: when the app's description changes, update
`index.html`'s title/description/Open Graph tags and the manifest copy in
`pwa-plugin.ts` together.

The website is a testing surface, not where people get the app: they install
it from its store listing. So the site is unlisted — every page carries
`<meta name="robots" content="noindex">`, `robots.txt` keeps allowing the fetch
that reads it, and there is no SEO and no size budget.

## Maintenance skills

Skills live under `.agents/skills/`; `.claude/skills` is a
symlink to that tree. Each has a `SKILL.md` with its discovery process, its
source→output mapping, and a `.last-updated` marker.

| Skill             | Runs when                                                     |
| ----------------- | ------------------------------------------------------------- |
| `maintenance`     | The registry and run order for every other skill — start here |
| `write-changeset` | Any user-visible change, before opening the PR                |
| `update-docs`     | `src/app/` changed in a way a `docs/` topic describes         |
| `update-readme`   | Commands, configuration, or the feature set changed           |
