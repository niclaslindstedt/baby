# Architecture

A frontend-only, local-first PWA. There is no server: the app is static files
on GitHub Pages, and every byte of user data lives in the browser — by
default in this device's own IndexedDB, and, if the user connects one, also
in a picked folder, or as a single file in their own Dropbox — encrypted on
the device first either way (see [sync.md](sync.md#encryption)). Never in
iCloud: App Store guideline 5.1.3(ii) keeps personal health information out
of it.

## The stack

- **Preact** through `preact/compat` — the app and the framework both write
  React-flavoured code, and the alias map in `vite.config.ts` /
  `tsconfig.json` resolves all of it onto Preact. React itself never reaches
  the bundle.
- **[`@niclaslindstedt/oss-framework`](https://github.com/niclaslindstedt/oss-framework)**
  — the shared surface behind the sibling meds, contacts, notes and cycle
  apps: the UI kit, the theme engine, the bottom bar and tab-paging swipe,
  the chart primitives, the storage adapters and IndexedDB store, the i18n
  runtime, logging, toasts, and the PWA update state machine.
- **Tailwind v4** for styling, over the framework's theme tokens.
- **Vite** with a hand-rolled PWA plugin (`pwa-plugin.ts`) that emits the
  service worker, the web manifest, and the version/precache manifests the
  framework's update hook reads.

Dependency direction: screens → stores → framework. App code imports only the
framework's published subpaths, never its internals.

## The shape of the data

One JSON document, stored under `baby:doc` and synced verbatim when a backend
is connected:

```jsonc
{
  "version": 4,
  "child": {
    "name": "Alva", // "" when none was given
    "birthDate": "2026-01-15",
    "sex": "female", // "female" | "male"
    "motherHeightCm": 166, // null when unknown
    "fatherHeightCm": 180,
    "updatedAt": "2026-01-15T12:00:00.000Z",
  },
  "measurements": {
    "<id>": {
      "id": "<id>",
      "date": "2026-07-15",
      "weightKg": 7.4, // each null when not measured; at least one set
      "lengthCm": 66.0,
      "headCm": 42.5,
      "updatedAt": "2026-07-15T10:00:00.000Z",
    },
  },
  "diapers": {
    "<id>": { "id": "<id>", "kind": "both", "at": "2026-09-12T06:40:00.000Z" },
  },
  "sleeps": {
    "<id>": {
      "id": "<id>",
      "kind": "night", // "nap" | "night" — the button that was tapped
      "start": "2026-09-12T17:05:00.000Z",
      "end": "2026-09-13T04:10:00.000Z", // null while still asleep
      "updatedAt": "2026-09-13T04:10:00.000Z",
    },
  },
  "foods": {
    "<id>": {
      "id": "<id>",
      "name": "Fullkornsgröt (berikad)",
      "amount": 150, // per day, in `unit`
      "unit": "g", // "g" | "ml"
      "per100": { "kcal": 104, "ironMg": 1.7, "fatG": 3.7 }, // kcal required; the rest optional
      "times": ["08:00", "18:00"], // when it is typically given; [] = sometime during the day
      "updatedAt": "2026-08-01T09:00:00.000Z",
    },
  },
  "milk": {
    "kind": "breast", // "breast" | "formula" | "mixed" | "none"
    "formulaMlPerDay": null,
    "formulaType": "infant", // "infant" | "followOn" (tillskottsnäring)
    "updatedAt": "2026-08-01T09:00:00.000Z",
  },
  "vaccinations": {
    "<id>": {
      "id": "<id>",
      "doseId": "dtp-1", // a programme dose, an extra's id, or "other"
      "date": "2026-04-15",
      "vaccineName": "Infanrix hexa",
      "label": "", // for "other": what it was against
      "note": "",
      "updatedAt": "2026-04-15T10:00:00.000Z",
    },
  },
}
```

Two invariants shape everything else:

- **Derive, don't store.** No z-score, no "regimen sufficient", no diaper
  verdict, no sleep average or suggested nap time, no vaccination status is
  persisted. Every screen recomputes from
  the records at render, so a corrected reading fixes every downstream number
  and there is no cache to invalidate.
- **Every record is keyed by id and stamped.** That is what makes two
  devices' copies mergeable record by record (see [sync.md](sync.md)). A
  sleep is stamped too — ending one, or correcting its times, is an edit.
  Diaper changes are the exception — immutable events with no `updatedAt`,
  merged as a union.

`src/app/migrations.ts` is the one module that trusts stored bytes: it
validates every field on the way in, drops what it can't read, and never
throws on a shape problem. A schema change bumps `DOC_VERSION` and appends a
step; existing steps are never edited.

## Where the numbers come from

Every threshold, band and recommendation the app compares a record with is a
claim made to a parent, so each one names its source. `docs/references.json`
is the registry of those sources — authors, title, journal or publisher,
DOI / URL / ISBN, the kind of evidence, the verbatim quotes the numbers were
taken from, what the app uses each for, and which files cite it — and code
points into it with a `[ref:<id>]` tag in the comment beside the number.
`tests/references_test.ts` keeps the two in step both ways, and
`oss-spec validate` checks the same rules (OSS_SPEC.md §24). Every tracker's module is cited this way — `sleep.ts`, `growth.ts`,
`nutrition.ts`, `diapers.ts` and `vaccines.ts`, with the WHO tables, the WHO
month in `age.ts` and the food presets — and a claim in a catalog string
carries its tag in a comment above the key.

The registry is also what a parent reads. The framework's `references`
module is its typed face — the shape, the evidence vocabulary ranked
strongest first, how an entry is cited, the audit the test runs, and the
card each entry is shown on — and `src/app/references.ts` binds it to this
app: the trackers as topics, the two summary languages, and the loader. The
About screen, behind Settings → About, lists every entry from it: grouped by the tracker it serves (the entry's `topics`),
with a line for a parent in either language (`summary`), the citation, a link
to the DOI or page, and the quotes one tap down. Nothing is copied by hand, so
an entry added for a new number is on that screen in the same change. Should a tracker ever have no source listed, the screen names it as still to
come rather than let a short list pass for a whole one; the test holds every
tracker to having one.

## What loads when

Everything on the entry path is downloaded before the user sees anything, so
four things ride in their own chunks behind `import()`:

- the WHO growth standards (`data/whoGrowth.ts`, loaded once through
  `useGrowthStandards.ts` and shared by the Today, Growth and Food screens);
- the food presets (`data/foods.ts`, fetched when the food form opens);
- the references registry (`docs/references.json`, loaded through
  `useReferences` in `references.ts` when the About screen opens);
- the demo document and its backend (`dev/`), fetched only when the toggle
  turns on — or, in a build made with `VITE_SEED=demo` (`make demo`, the App
  Store screenshots), before the first render, so the first frame is already
  the demo and the device's own document is never read, cached or synced;
  there the switch cannot be turned off and Settings refuses to connect or
  disconnect a backend while it shows;

plus the Swedish catalog (`i18n/sv.ts`), which the framework's i18n runtime
loads on demand.

The language picks the words; the device picks the formats. Every date, time
and number is formatted in one tag, `useLocale()` (over the pure `locale.ts`):
Sweden's formats in Swedish, and in English the device's own English — a US
phone reads "Sep 21" and "9:03 PM", a British one "21 Sept" and "21:03", and a
device with no English keeps the British formats. The `format.ts` helpers take
that tag as a required argument, so no screen or chart can format in a locale
of its own. The same tag picks the units a body is read and typed in
(`units.ts`): pounds, ounces and inches for a US locale, converted at the
edge — the document stays metric.

## The shell

```
App.tsx
├── TopBar          the mark, the sync glyph, `+` (quick-log sheet), ⚙ (Settings)
├── <main>          one scrolling region; the swipe is measured across it
│   ├── TodayScreen     the age line, then one headline card per tracker
│   │   ├── DiapersModal    last 24 h against the floor for the age, the week chart
│   │   ├── SleepModal      the dial with the suggested window, averages vs. the age, SleepChart, SleepDiary
│   │   ├── GrowthModal     indicator tabs, GrowthChart, trend, forecast, adult height
│   │   ├── FoodModal       the verdict, DayCoverageChart, the target, the regimen, nutrients
│   │   └── VaccinesModal   the card at a glance: visits, ticks, the count
│   ├── DiapersScreen   DiaperButtons, then the last seven days of changes
│   ├── SleepScreen     the live dial (SleepNow), SleepButtons, the last seven days (SleepForm → SleepClock)
│   ├── GrowthScreen    the readings list, and MeasurementForm
│   ├── FoodScreen      the regimen (FoodForm), then milk feeding
│   ├── VaccinesScreen  the programme timeline, the extras, the record form
│   ├── ChildScreen     first run, and Settings → Your child
│   ├── SettingsScreen
│   └── AboutScreen     Settings → About: the disclaimer, and every source from the registry
├── BottomNav       Today · Diapers · Sleep · Growth · Food · Vaccines (minus the trackers that are off)
├── QuickLogSheet   the `+` sheet — the same DiaperButtons and SleepButtons the tabs render
│   └── WhenModal       "when?" after any logging tap: Now, the lags, a TimeDial
└── SyncDetailsModal, ToastViewport, UpdateToast
```

**Input on the tabs, answers on Today.** The five destinations beside Today
are where a record goes in — a change, a sleep, a reading, a food, a dose
marked given — and each of Today's
headline cards opens the matching _view_ over the screen instead of
navigating to it (`ViewModal.tsx`, which is the framework's `Modal` in its
non-centred mode: full screen on a phone, a card over a blurred page from
`sm:` up). It is dismissed the way the sibling `contacts` app's card is — a
swipe down on a phone, the backdrop or Escape on a desktop, and no footer bar
in either, so the height a Close row would take goes to the chart instead. A
view never writes; closing one returns to Today rather than leaving the
parent on a tab to navigate out of.

The bottom bar carries _destinations_ in a fixed order, and a swipe moves
along it; the three off-bar screens — the child, Settings, and About behind
it — cross-fade in and go back where they came from. Logging a diaper is one code path: both places render `DiaperButtons`
and both write through `addDiaper`. Logging a sleep is too: the Sleep tab and
the sheet both render `SleepButtons`, and starting, ending and correcting a
sleep all write through `saveSleep`. Both sets of buttons ask _when_ the same
way: the tap opens `WhenModal.tsx` — **Now**, and only behind **Earlier** a
tile per usual lag showing the clock time it stands for and **Another time**
on a single-handle dial (`TimeDial.tsx`) — whose arithmetic is the pure
`when.ts`. Nothing is on show before it is wanted: the sheet seen most is two
rows tall. The sheet takes an
icon, a title, a question, an optional lower bound (`sleepEarliest` for a
sleep) and an optional usual time (`sleepDefault`: the child's own bedtime, nap
length or morning), so the next tracker that logs a moment opens it as it is.

**Live, and the dial.** A record that is still running shows its clock
running. `live.tsx` holds the pieces: `useTick`, a clock that re-renders only
the component holding it and stops while the page is hidden; `Elapsed`, a
stopwatch (or a countdown) to the second; `ProgressRing`; and `FillRing`,
stacked shares filling a ring over a track that washes in a reference band —
the sleep rings, and the shape any "how much of the recommended amount" is to
take. The 24-hour dial
is `ClockDial.tsx` over the pure `dial.ts` — the face, the arcs on its track
(a span under ten minutes drawn as its chord, which WebKit can't misplace the
way it does a near-closed arc), the now dot — and the sleep module uses it three ways: showing the last day on
the Sleep tab (`SleepNow.tsx`), showing it with the suggested window on the
view, and editing one sleep by dragging its ends (`SleepClock.tsx`); and the
"when?" sheet sets one moment on it with a single handle (`TimeDial.tsx`). A running
clock of a record's own start is allowed on a tab; a comparison — a ring
filling toward a suggested time — stays on Today. Every animation is CSS
(`styles.css`, "Live") and holds still under reduced motion. The sleep module
is the reference: the other trackers take these pieces up as they are, rather
than growing their own.

**Trackers switch off.** Settings → What you track carries a switch per
tracker — diapers, sleep, growth, food, vaccines — stored in
`useAppSettings.ts` (`Features`, defaulting to all on, and only an explicit
`false` reads as off). Each of the five has a tab of its own, so a
switched-off tracker loses it (`navTabs()` filters `TABS`, so the order
survives and the swipe closes over the gap) along with its card on Today,
and — for diapers and sleep — its half of the sheet behind the top bar's `+`,
which leaves the bar when both are off. Today is
never one of them: it is the home screen, the tab the shell falls back to
when the screen someone is on disappears under them, and with every tracker
off it still says how old the child is.

The switches hide screens and nothing else. They are a display setting, not
a data one: they live in localStorage rather than the document, they are not
synced, and nothing in `AppData` is dropped or stops being merged when one
goes off — which is what makes switching a tracker back on cost nothing.

## The service worker

`pwa-plugin.ts` emits a "prompt to update" precaching worker at build time:
it installs the build's assets, parks in `waiting`, and applies on the
framework toast's say-so — never mid-use. The cache id is derived from the
deploy base (`src/app/pwa.ts`) so the `/` and `/preview/` channels never share
a precache, and the root worker disowns the preview path so each channel's own
worker serves its pages.
