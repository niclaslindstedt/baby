# Baby

> A local-first baby health and nutrition tracker for parents in Sweden — is the food regimen still enough, is the baby growing along the curve, how many diapers today, and which vaccination comes next. No account, no server.

[![ci](https://github.com/niclaslindstedt/baby/actions/workflows/ci.yml/badge.svg)](https://github.com/niclaslindstedt/baby/actions/workflows/ci.yml)
[![seo](https://github.com/niclaslindstedt/baby/actions/workflows/seo.yml/badge.svg)](https://github.com/niclaslindstedt/baby/actions/workflows/seo.yml)
[![pages](https://github.com/niclaslindstedt/baby/actions/workflows/pages.yml/badge.svg)](https://github.com/niclaslindstedt/baby/actions/workflows/pages.yml)
[![license](https://img.shields.io/badge/license-PolyForm--Noncommercial--1.0.0-blue.svg)](LICENSE)

## What

**Baby** follows one child from birth and answers the four questions
that matter most, without turning childcare into data entry. It runs
entirely in your browser and is built around one principle: **minimal
input, useful output.**

- **Diapers.** Three buttons — pee, poo, both — and the time is recorded for
  you, from the Diapers tab or the **+** on any screen. The app knows how many
  wet and dirty diapers a baby of that age usually produces (from the first days' ramp to the Swedish "minst sex kissblöjor per
  dygn") and says so when the last 24 hours look thin, naming the sign to look
  for rather than a diagnosis.
- **Growth.** Weight, length and head circumference, as often as you like —
  a BVC visit or a bathroom scale every morning — plotted on the WHO growth
  standards as SD channels, the way Swedish child health care draws them. The
  trend across channels is the headline, not the single reading, and the chart
  projects where the next readings are likely to land. Both parents' heights
  give the expected adult height with the formula BVC uses.
- **Food.** Nothing to track before about six months — breast milk or
  formula is everything, and the screen says so. From then on you keep a
  simple **daily regimen** (the foods the baby typically gets in a day, with a
  daily amount each; only calories are required) and the app compares it with
  the recommendation for the child's current age and weight — the Nordic
  Nutrition Recommendations 2023, with breast milk's expected share left out
  of the target because it is not measurable. As the child grows the target
  moves and the regimen does not, and the app says when the child has
  outgrown it.
- **Vaccinations.** Folkhälsomyndigheten's childhood programme as a timeline
  for your child — given, expected by now, upcoming — plus the vaccinations
  offered outside it, each recordable with its date and the vaccine's name.

Each of the four has a tab of its own and a switch in **Settings → What you
track**. Switch one off and its tab and its card leave the app; nothing is
deleted, and switching it back on finds everything where you left it.

It is built on [`@niclaslindstedt/oss-framework`](https://github.com/niclaslindstedt/oss-framework),
the shared React/Preact surface behind the sibling
[meds](https://github.com/niclaslindstedt/meds),
[contacts](https://github.com/niclaslindstedt/contacts) and
[cycle](https://github.com/niclaslindstedt/period) apps — same storage
adapters, same theme engine, same PWA update lifecycle — and it speaks
English and Swedish.

## Why

A child's growth readings, diaper log and vaccination card are health data,
and most apps in this category are an account wrapped around a server you
cannot inspect — often with a feeding diary that asks for every millilitre.

This one has no account and no server. The record lives on your device, in
your browser's own storage. If you want it on more than one device, you keep
a copy in a folder you pick, in **your own** Dropbox — a JSON file you can
open and read — or, in the App Store app, in **your own** iCloud Drive.
Nothing else leaves the device: no analytics, no telemetry, no third-party
requests at runtime. The growth standards, the food presets and the
vaccination schedule are bundled with the app and read locally.

And it asks for as little as it can. Breast milk is deliberately not
measured. Meals are not logged. A diaper is one tap. The app's job is to
turn the few things you do enter into the answers a parent actually wants.

## Prerequisites

- Node.js ≥ 22 (CI pins 24 — see `.nvmrc`), npm ≥ 10
- A GitHub personal access token with `read:packages` in `~/.npmrc` — the
  `@niclaslindstedt/oss-framework` dependency resolves from GitHub Packages

## Install

```sh
npm config set //npm.pkg.github.com/:_authToken <your-token>
git clone https://github.com/niclaslindstedt/baby.git
cd baby
npm install
```

Or just open the hosted app at
[baby.niclaslindstedt.se](https://baby.niclaslindstedt.se/) and install it
from your browser's "Add to Home Screen" / install prompt — it is a PWA and
works fully offline.

## Quick start

```sh
npm run dev
```

Open the printed URL. The app opens on the child setup: a birth date and a
sex are all it needs (a name and the parents' heights are optional). Press
**Save** and you land on **Today**: tap **Pee**, **Poo** or **Both** when
you change a diaper, and the last 24 hours count up. Add a reading under
**Growth**, and from six months keep the regimen under **Food** — the
common-foods chips fill in typical values from Livsmedelsverket's database.

To see every screen populated, turn on **Settings → Developer mode → Demo
data**: an invented eight-month-old with readings, diapers, a regimen and a
vaccination card, in memory only.

To try the production build the way it deploys:

```sh
npm run build && npm run preview
```

## Usage

Five tabs on a bottom bar — swipe left or right to move between them. **Today
is where the answers are; the other four are where things go in.** Not
everyone tracks everything: **Settings → What you track** switches a tracker
off, and its tab and its card go with it (nothing is deleted). Tapping one of
Today's cards opens the matching view over the screen — full screen on a
phone, a panel over a blurred page on a desktop — and closing it puts you back
where you were.

| Tab          | What it does                                                                                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Today**    | The child's age, then one line each on diapers, the regimen, growth and the next vaccine — tap a card for its full view, and it warms when it is asking for a look.                                       |
| **Diapers**  | The three buttons — pee, poo, both — and the last seven days of changes under them, newest first, so a mistap is one tap to remove.                                                                       |
| **Growth**   | The readings list, and the form behind it: weight, length and head circumference, as often as you like.                                                                                                   |
| **Food**     | The daily regimen with one-tap presets and, optionally, the times of day each food is given; then milk feeding (breast / formula / both, and which formula — modersmjölksersättning or tillskottsnäring). |
| **Vaccines** | The Swedish programme as a timeline — given, expected by now, upcoming — where a dose is marked given with the vaccine name off the card, beside the extras outside the programme.                        |

The four views Today opens:

| View             | What it shows                                                                                                                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Diapers**      | The last 24 hours as wet and dirty against the floor for the child's age, the source that floor comes from, and the week as a chart.                                                                                                |
| **Growth**       | A tab each for weight, length and head circumference on the WHO standard with the SD channels, the trend across them, the projected range ahead, and (under Length) the expected and projected adult heights.                       |
| **Food regimen** | Whether the regimen covers the day, and how the day fills up: energy accumulating across the clock against the line it is held to, then iron, vitamin D, the fat shares, omega-3/6 and DHA against the recommendations for the age. |
| **Vaccinations** | The card at a glance: every visit the programme books, a tick against what is recorded, and how much of the card is done.                                                                                                           |

…and two buttons on the top bar, for the things you do and then leave:

| Button | What it does                                                                                                                                         |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **+**  | Log a diaper without leaving the screen you are on: a sheet with the same three buttons. One tap logs and closes. Gone while diaper tracking is off. |
| **⚙**  | Settings: theme, language, what you track, the child's profile, where the record lives, backup / restore / delete, About.                            |

## Configuration

The app needs no configuration to run. The build-time variables switch cloud
backends on; both OAuth identifiers are public (the flows are PKCE, so there
is no secret to protect), and leaving either unset simply hides that provider:

| Variable                  | Effect                                                    |
| ------------------------- | --------------------------------------------------------- |
| `VITE_DROPBOX_APP_KEY`    | Enables the Dropbox backend.                              |
| `VITE_DROPBOX_APP_FOLDER` | Folder name the document is filed under (default `baby`). |
| `VITE_BASE`               | Deploy base path (default `/`).                           |

**This device** — the browser's own storage, and the default — and the local
folder need nothing. See
[`docs/configuration.md`](docs/configuration.md) for the details.

## Examples

Place a reading on the standard and read the numbers that come out of it —
the derivation is pure, so it runs anywhere, no DOM required:

```ts
import { WEIGHT_FOR_AGE } from "./src/app/data/whoGrowth.ts";
import { lmsAt, targetHeight, zScore } from "./src/app/growth.ts";
import { requirements } from "./src/app/nutrition.ts";
import { emptyDoc } from "./src/app/types.ts";

const doc = emptyDoc();
doc.child = {
  name: "Elias",
  birthDate: "2026-01-15",
  sex: "male",
  motherHeightCm: 167,
  fatherHeightCm: 182,
  updatedAt: "2026-01-15T10:00:00.000Z",
};

// A 9.65 kg boy on his first birthday sits on the median.
zScore(lmsAt(WEIGHT_FOR_AGE, "male", 365)!, 9.65); // → ≈ 0.0

// The mid-parental target height, the way BVC computes it.
targetHeight(doc.child); // → { cm: 182.1, low: 172.1, high: 192.1 }

// What an eight-month-old breastfed boy's regimen is held to.
requirements(doc, "2026-09-15", WEIGHT_FOR_AGE)?.targetKcal; // → ≈ 150 kcal from food
```

Every number is a function of the document and `today`, which is always passed
in — nothing here reads the clock. A sample document is in
[`examples/`](examples/README.md).

## Troubleshooting

| Symptom                                     | Fix                                                                                                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm install` fails with `401 Unauthorized` | The framework comes from GitHub Packages — see Prerequisites.                                                                                  |
| The Food tab says there is nothing to track | The child is under six months. Tiny tastes from four months are fine; the regimen starts when solids do.                                       |
| A reading sits far off the curve            | Check the date and the unit (kg, cm). The trend across readings is what matters; one reading is a fact about that morning.                     |
| The "Local folder" backend is missing       | The directory picker exists in desktop Chromium browsers (Chrome, Edge, Opera) only; stay on This device or connect a cloud backend elsewhere. |
| Cloud sync shows "Reconnect needed"         | The provider's session lapsed, or the folder grant was revoked. Tap the sync glyph → Reconnect.                                                |

More in [`docs/troubleshooting.md`](docs/troubleshooting.md).

## Documentation

- [The desktop app](docs/features/desktop-app.md)
- [Getting started](docs/getting-started.md)
- [Configuration](docs/configuration.md)
- [Architecture](docs/architecture.md)
- [Growth](docs/growth.md) — the standards, the trend, the forecast, the target height
- [Nutrition](docs/nutrition.md) — the regimen, the recommendations, the assessment
- [Diapers](docs/diapers.md) — the counts and the age-scoped floors
- [Vaccinations](docs/vaccinations.md) — the programme and the extras
- [Sync](docs/sync.md)
- [Troubleshooting](docs/troubleshooting.md)
- [`AGENTS.md`](AGENTS.md) — conventions for humans and coding agents

## Contributing

Bugs and feature requests go to
[Issues](https://github.com/niclaslindstedt/baby/issues); open-ended
questions to [Discussions](https://github.com/niclaslindstedt/baby/discussions).
See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the workflow, and
[`SECURITY.md`](SECURITY.md) for private vulnerability reporting.

## License

[PolyForm Noncommercial 1.0.0](LICENSE) © Niclas Lindstedt.

---

**This app is not a medical device.** It is a notebook of what you told it
and a comparison with published recommendations — Folkhälsomyndigheten's
vaccination programme, the Nordic Nutrition Recommendations 2023, the WHO
growth standards, and the diaper counts child health care quotes. Questions
about your child's health belong with the child health centre (BVC).
