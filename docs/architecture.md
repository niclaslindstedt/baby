# Architecture

A frontend-only, local-first PWA. There is no server: the app is static files
on GitHub Pages, and every byte of user data lives in the browser (plus, if
the user connects one, a copy in a picked folder, in IndexedDB, or as a single
JSON file in their own Dropbox or Google Drive).

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
  "version": 3,
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
  verdict, no vaccination status is persisted. Every screen recomputes from
  the records at render, so a corrected reading fixes every downstream number
  and there is no cache to invalidate.
- **Every record is keyed by id and stamped.** That is what makes two
  devices' copies mergeable record by record (see [sync.md](sync.md)).
  Diaper changes are the exception — immutable events with no `updatedAt`,
  merged as a union.

`src/app/migrations.ts` is the one module that trusts stored bytes: it
validates every field on the way in, drops what it can't read, and never
throws on a shape problem. A schema change bumps `DOC_VERSION` and appends a
step; existing steps are never edited.

## What loads when

Everything on the entry path is downloaded before the user sees anything, so
three things ride in their own chunks behind `import()`:

- the WHO growth standards (`data/whoGrowth.ts`, loaded once through
  `useGrowthStandards.ts` and shared by the Today, Growth and Food screens);
- the food presets (`data/foods.ts`, fetched when the food form opens);
- the demo document and its backend (`dev/`), fetched only when the toggle
  turns on;

plus the Swedish catalog (`i18n/sv.ts`), which the framework's i18n runtime
loads on demand.

## The shell

```
App.tsx
├── TopBar          the mark, the sync glyph, `+` (diaper sheet), ⚙ (Settings)
├── <main>          one scrolling region; the swipe is measured across it
│   ├── TodayScreen     diaper buttons, last 24 h, today's log, week chart, headline cards
│   │   ├── GrowthModal     indicator tabs, GrowthChart, trend, forecast, adult height
│   │   ├── FoodModal       the verdict, DayCoverageChart, the target, the regimen, nutrients
│   │   └── VaccinesModal   the card at a glance: visits, ticks, the count
│   ├── GrowthScreen    the readings list, and MeasurementForm
│   ├── FoodScreen      the regimen (FoodForm), then milk feeding
│   ├── VaccinesScreen  the programme timeline, the extras, the record form
│   ├── ChildScreen     first run, and Settings → Your child
│   └── SettingsScreen
├── BottomNav       Today · Growth · Food · Vaccines
├── DiaperSheet     the `+` sheet — the same DiaperButtons Today renders
└── SyncDetailsModal, ToastViewport, UpdateToast
```

**Input on the tabs, answers on Today.** The four destinations are where a
record goes in — a reading, a food, a dose marked given — and each of Today's
headline cards opens the matching _view_ over the screen instead of
navigating to it (`ViewModal.tsx`, which is the framework's `Modal` in its
non-centred mode: full screen on a phone, a card over a blurred page from
`sm:` up). It is dismissed the way the sibling `contacts` app's card is — a
swipe down on a phone, the backdrop or Escape on a desktop, and no footer bar
in either, so the height a Close row would take goes to the chart instead. A
view never writes; closing one returns to Today rather than leaving the
parent on a tab to navigate out of.

The bottom bar carries _destinations_ in a fixed order, and a swipe moves
along it; the two off-bar screens cross-fade in and go back where they came
from. Logging a diaper is one code path: both places render `DiaperButtons`
and both write through `addDiaper`.

## The service worker

`pwa-plugin.ts` emits a "prompt to update" precaching worker at build time:
it installs the build's assets, parks in `waiting`, and applies on the
framework toast's say-so — never mid-use. The cache id is derived from the
deploy base (`src/app/pwa.ts`) so the `/` and `/preview/` channels never share
a precache, and the root worker disowns the preview path so each channel's own
worker serves its pages.
