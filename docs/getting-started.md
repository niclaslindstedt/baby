# Getting started

## Run it

The app is a static site — there is nothing to provision, no database, no
account.

```sh
npm install     # needs a GitHub Packages token, see below
npm run dev
```

Open the printed URL. Everything you enter is written to your browser's
localStorage under the `baby:doc` key and nothing else happens: no request
leaves the page until you connect a folder or a cloud backend yourself.

### The GitHub Packages token

`@niclaslindstedt/oss-framework` is published to GitHub Packages, which
requires authentication even to read a public package. Create a personal
access token with the `read:packages` scope and tell npm about it once:

```sh
npm config set //npm.pkg.github.com/:_authToken <your-token>
```

CI does the same thing with the workflow's own `GITHUB_TOKEN`, and Claude Code
web sessions do it from `.claude/hooks/session-start.sh`.

## Set up your child

The app opens on the child setup. Two facts are required — the **birth
date**, which dates everything, and the **sex**, because the growth standards
publish one curve per sex and the expected adult height is computed
differently for each. A **name** is optional (the copy says "your baby"
without one), and so are **both parents' heights**, which unlock the expected
adult height under Growth.

All of it can be changed later from **Settings → Your child**.

Every date in the app — the birth date, a reading's date, a dose's date — is
picked from the same calendar: tap the field, and tap the month caption at
the top of the calendar to jump to another month or year without paging
through them one at a time.

## Log a diaper

Under **Diapers**, tap **Pee**, **Poo** or **Both**. That is the whole flow —
the time is recorded for you, and the last seven days are listed under the
buttons so a mistap is one tap to remove. The **+** in the top bar opens the
same three buttons as a sheet from any screen, so a change never costs you
the chart you had open.

Today's **Diapers** card carries the last 24 hours, and tapping it opens the
week as a chart. When those 24 hours hold fewer wet diapers than a baby of
that age usually produces, or the gap since the last dirty diaper is longer
than usual for the age and feeding, the card warms and the view says what to
look at. See [`diapers.md`](diapers.md) for the floors and where they come
from.

## Add a reading

Under **Growth**, tap **Add a reading**: a date and whichever of weight,
length and head circumference was measured. One field is enough, and readings
can be added as often as you like — a scale at home every morning is fine.
The chart places each on the WHO growth standard, the trend card reads the
movement across the SD channels, and the shaded range ahead of the last
reading is where the next ones are likely to land. See [`growth.md`](growth.md).

## Keep the regimen

Under **Food**, first say how the child's milk is fed: breastfed, formula,
both, or neither. On bottles, say which formula — modersmjölksersättning or
tillskottsnäring, which carries about two and a half times the iron — and a
typical daily amount. Before six months that is
all the screen asks; from six months, **Add a food** for each thing the child
typically gets in a day — the **Common foods** chips fill in typical values
from Livsmedelsverket's database — with a daily amount. Only calories are
required.

The assessment card then answers the app's central question: does the
regimen cover the day? Energy first, then iron, vitamin D, the fat shares,
omega-3 and omega-6, and DHA. See [`nutrition.md`](nutrition.md) for how the
target is computed and why breast milk is left out of it.

## Record vaccinations

Under **Vaccines**, the programme is a timeline for your child. Tap **Mark as
given** on a dose to record it with the date and, optionally, the vaccine's
name off the card. Vaccinations outside the programme — BCG, the RSV
antibody, TBE, an extra pneumococcal dose, or anything else — are recorded
under **Outside the programme**. See [`vaccinations.md`](vaccinations.md).

## Track only what you use

Everything is on out of the box, and **Settings → What you track** switches
off what you don't. Each tracker has a tab of its own, and a switched-off one
leaves the bottom bar — taking its card on Today with it, and, for diapers,
the **+** as well — so an app opened only for the vaccination card is one tab
deep. Nothing is deleted: the
records stay, they keep syncing, and switching the tracker back on puts
everything where you left it. The choice is per device, like the theme.

## Install it as an app

The production build is an installable PWA that works fully offline:

```sh
npm run build && npm run preview
```

Open the printed URL and use the browser's install prompt (or Safari's
Share → Add to Home Screen on iOS). The hosted app at
[baby.niclaslindstedt.se](https://baby.niclaslindstedt.se/) installs the same
way. Updates download in the background and apply when you accept the
in-app prompt — never mid-use.
