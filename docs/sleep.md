# Sleep

What a sleep records, how the log is added up, what it is compared with, and
how the next sleep is suggested — with the sources behind every number. The
code is `src/app/sleep.ts`; the numbers are pinned in `tests/sleep_test.ts`.

## Two taps

A sleep is a kind — **nap** or **night** — a start and an end. **Nap** or
**Night** when the child falls asleep, **Woke up** when they wake; the time is
the moment of the tap. Until the second tap the sleep is _open_ (`end: null`)
and the child reads as asleep.

The kind is the parent's tap rather than the app's guess. Nothing about a
start time says which it is — a newborn's longest sleep is as likely at noon as
at midnight, and a toddler's 18:30 is bedtime in one family and a late nap in
another — and the split is read by the day/night averages and by the bedtime
the suggestion aims for.

Unlike a diaper change, a sleep can be edited: a sleep noticed ten minutes
late, a **Woke up** tapped at breakfast, a nap nobody logged. The **Sleep** tab
lists the last seven days, grouped by sleep day, with an edit and a remove on
every row and **Add a sleep** for the ones that were missed. The top bar's
**+** opens the same buttons from any screen, and both write through the same
`saveSleep` edit. Nothing on the tab is derived.

An open sleep that is not the newest, or that has been running for more than
sixteen hours, is a **Woke up** nobody tapped. Its end is unknown, so no number
counts it; the tab shows it at the top with a way to set the end. (Sixteen
hours is past any single sleep the sources describe — Galland et al. 2012 put
the longest sleep period at 6–24 months at 8.3 hours, 13.7 at the top of its
95 % range.)

Two sleeps that overlap — the same nap logged on two phones, or a corrected
start that runs into the sleep before — are clipped, so no minute is counted
twice.

## The sleep day

A night that begins at 19:30 and ends at 06:10 is one night, and a parent calls
it "last night" whatever the calendar says. So a **night** counts toward the
day it began on in the evening — its _sleep day_ is the local date twelve hours
before its start, which puts a 19:30 start on that day and a 02:40 resumption
after a logged waking on the day before. A **nap** counts toward the day it
began on. A sleep day is therefore that day's naps and the night that follows:
the 24 hours a parent means by "how did she sleep yesterday?".

A sleep day is complete once the next morning is over — noon the day after —
and only complete days enter the averages. The one place the app cuts a night
at midnight is the hour-by-hour diary, which is a calendar on purpose.

## What is shown

On Today, behind the **Sleep** card:

- **Right now** — asleep since, or awake since, and for how long; and, when
  awake, the suggested time for the next sleep (below).
- **Last 24 hours** — minutes slept in the rolling day, at night and in naps.
  Rolling rather than the calendar day, for the reason the diaper count is:
  it can be asked at any hour.
- **Averages** over the last 30 and 90 complete sleep days: per day in
  total, at night, in naps, and naps per day, and how many logged days the
  average is from. The divisor is the days with anything logged, not the
  window — a family that started ten days ago has a ten-day average, and a
  week without the app is left out rather than read as a week without sleep.
  What a logged day cannot say is whether _every_ sleep in it was logged: a
  day with only the night entered reads as a day without naps, and the view
  says so.
- **Last 14 days** as columns, the night at the bottom and the naps on top,
  over the recommended range as a band. A day with nothing logged is an empty
  slot; a day whose night is still going is drawn faded.
- **Hour by hour** — the last seven days as a sleep diary, one row per day
  from midnight to midnight: the chart that shows the nights lengthening and
  the naps settling into place.

The Today card says the state and the suggestion, with last night and the
30-day average under it.

## How much is recommended

| Age          | Recommended (WHO 2019) | Observed mean (Galland 2012) | Observed 95 % range |
| ------------ | ---------------------- | ---------------------------- | ------------------- |
| 0–2 months   | 14–17 h                | 14.6 h                       | 9.3–20.0 h          |
| ≈3 months    | 14–17 h                | 13.6 h                       | 9.4–17.8 h          |
| 4 months     | 12–16 h                | 13.6 h                       | 9.4–17.8 h          |
| ≈6 months    | 12–16 h                | 12.9 h                       | 8.8–17.0 h          |
| ≈9 months    | 12–16 h                | 12.6 h                       | 9.4–15.8 h          |
| ≈12 months   | 11–14 h                | 12.9 h                       | 10.1–15.8 h         |
| 15–23 months | 11–14 h                | 12.6 h                       | 10.0–15.2 h         |
| 2–3½ years   | 11–14 h (10–13 from 3) | 12.0 h                       | 9.7–14.2 h          |
| 3½–5 years   | 10–13 h                | 11.5 h                       | 9.1–13.9 h          |

- **The recommendation** is the WHO's _Guidelines on physical activity,
  sedentary behaviour and sleep for children under 5 years of age_ (2019,
  p. 22): infants "should have 14–17 hours (0–3 months of age) or 12–16 hours
  (4–11 months of age) of good quality sleep, including naps"; 1–2 years
  "11–14 hours of good quality sleep, including naps, with regular sleep and
  wake-up times"; 3–4 years "10–13 hours … which may include a nap". From four
  months this is also the American Academy of Sleep Medicine's consensus
  (Paruthi et al. 2016, _J Clin Sleep Med_ 12(6):785–786), whose 3–5 years
  "10 to 13 hours" carries the last band to the sixth birthday. The AASM makes
  no recommendation under four months "due to the wide range of normal
  variation"; the WHO's 14–17 hours is the National Sleep Foundation's
  (Hirshkowitz et al. 2015, _Sleep Health_ 1(1):40–43).
- **The observed range** is what children are actually found to sleep: the
  pooled means and mean ±1.96 SD of Galland, Taylor, Elder & Herbison,
  "Normal sleep patterns in infants and children: a systematic review of
  observational studies" (_Sleep Med Rev_ 2012;16(3):213–222, table 2). Each
  row is used from halfway after the age before it to halfway before the age
  after it; the review has no 3–4 years row, so the turn from its 2–3 to its
  4–5 years is at three and a half.
- **The Swedish sources** give the same picture in wider strokes. 1177
  ("Barns sömn i olika åldrar"): "0–3 månader: 14–18 timmar per dygn. 4–11
  månader: 12–16 timmar per dygn. 1–2 år: 10–16 timmar per dygn. 3–5 år: 10-14
  timmar per dygn", and for 4–11 months "9–10 timmar på natten och 3–6 timmar
  på dagen". Folkhälsomyndigheten uses the same ranges; Rikshandboken: "Barn
  mellan 1–5 år behöver 11–14 timmar sömn dagligen, med stora individuella
  skillnader". The view quotes 1177 for the age band's night/day split.

The 30-day average is read against both, once seven days are logged:

| Where the average sits                | What the view says                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| Inside the recommendation             | Within the recommended range                                                     |
| Outside it, inside the observed range | A little under / over — but within what most children that age sleep             |
| Outside both                          | Under / over what 19 in 20 children sleep: check the log, then mention it at BVC |
| Fewer than seven logged days          | Nothing yet — a week is needed                                                   |

Only the last warms the Today card. "Short" says to check first that the naps
are logged, because an unlogged nap is the likeliest cause; either way it is a
reason to look, not a verdict. Past six years the app compares nothing.

## When the next sleep is likely to suit

While the child is awake, the view suggests a time for the next sleep from the
last sleep and its length. It is the least evidence-based number in the app,
and it says so.

**The age band.** How long a child is typically awake between sleeps, feeding
included — the "wake window". There is no peer-reviewed table of these. The
physiology is the two-process model, in which sleep pressure builds faster the
younger the child ("sleep pressure accumulates more slowly with increasing
age… enabling children to be awake for consolidated periods during the day",
Jenni & LeBourgeois 2006, _Curr Opin Psychiatry_ 19(3):282–287); the numbers
are the published guidance of the child and family health services of New
South Wales:

| Age                 | Awake between sleeps | Source                                                                                |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| Birth – 6 weeks     | 1–2 h                | Tresillian, "Newborn to 6 week wake window: 1 to 2 hours"; 1177, "en till två timmar" |
| 6–12 weeks          | 1–2½ h               | Tresillian, "6 to 12 week wake window: 1 - 2.5 hours"                                 |
| 12 weeks – 4 months | 1½–2 h               | Tresillian, "a 3 month old is 1.5 - 2 hours"                                          |
| 4–6 months          | 2–3 h                | Tresillian, "a 5 month old is 2 - 3 hours"                                            |
| 6–9 months          | 2–3 h                | Tresillian, 6–8 months "2 - 3 hours"                                                  |
| 9–11 months         | 2½–3½ h              | Tresillian, 9–10 months "around 2.5 - 3.5 hours"                                      |
| 11–12 months        | 3–4 h                | Tresillian, 11–12 months "around 3 - 4 hours"                                         |
| 12–18 months        | 4–6 h                | Karitane, _Sleep Needs Guide for Infants 0 to 3 Years_ (2016)                         |
| 18 months – 3 years | 5–7 h                | Karitane, same guide                                                                  |

From three there is no suggestion: half of three-year-olds no longer nap at
all (Iglowstein et al. 2003, _Pediatrics_ 111(2):302–307: "At the age of 3
years, 50.4% of the children still napped"), and most stop between three and
five (Galland 2012).

**The child's own days.** The band is a prior; the evidence is the last two
weeks. Every gap between one sleep's end and the next one's start is a wake
window, kept when it is plausible for the age — at least half the band's
shortest and at most one and a half times its longest; a shorter gap is a
night waking or a nap logged in two pieces, a longer one a sleep that was not
logged, and a gap between two night halves never counts. Windows after a night
(the morning, to the first nap) and windows after a nap are kept apart, so the
first nap of the day is read from mornings. With five or more of the right
kind, their median — clamped into the band — is the window; before that, the
band's middle.

**The last nap's length.** "Sleep cycles in healthy infants at term typically
last a mean of 50–60 min (range, 30–70 min)" (Grigg-Damberger 2016, _J Clin
Sleep Med_ 12(3):429–445); Rikshandboken: "Spädbarn har sömncykler som är
ungefär 50 minuter långa". A nap under **45 minutes** has not finished one
cycle and moves the window halfway toward the band's short end; a nap of **two
hours** or more has been through two and moves it halfway toward the long end.
The reasoning is the two-process model's — a short nap discharges less sleep
pressure, so it builds back sooner — but **no study measures this**, and the
halfway rule is the app's own. It is written down here so it can be argued
with.

**Bedtime.** With three or more nights logged in the last two weeks, the
child's usual bedtime is the median start of the first night sleep. When it is
within the band's longest window of the end of the last nap, the next sleep is
**bedtime**: the usual time, but no sooner than the band's shortest window.
Before the app knows a bedtime, it says "next sleep", not "next nap".

**What it says.** A time rounded to five minutes, with a quarter of an hour
either side; the band; whether the window is the child's own or the band's
middle; the last nap's effect; bedtime when it applies; and, once the time has
passed, that tired signs — yawning, rubbing eyes, staring, fussing — say more
than the clock. Every suggestion ends with the same line: the child's tired
signs come first.

**When it says nothing.** While the child is asleep. After a night sleep that
ends before the child's earliest recent morning (or before five, until three
mornings are logged) or after six in the evening — a night waking, where the
next sleep is the rest of the night. And when the gap since the last sleep is
more than twice the band's longest window, which means a sleep went unlogged.

Night wakings are normal: Galland 2012 counts 1.7 a night at 0–2 months and
still 0.7 at 1–2 years (table 3), and a day–night rhythm usually appears
between two and four months (1177: "Efter ungefär 2 till 4 månader brukar
barnet sova längre perioder på natten"; the melatonin rhythm appears at 9–12
weeks, Kennaway et al. 1992, _J Clin Endocrinol Metab_ 75(2):367–369).

## Sources

- World Health Organization. _Guidelines on physical activity, sedentary
  behaviour and sleep for children under 5 years of age._ Geneva: WHO; 2019.
- Paruthi S, et al. Recommended amount of sleep for pediatric populations: a
  consensus statement of the American Academy of Sleep Medicine. _J Clin Sleep
  Med._ 2016;12(6):785–786. doi:10.5664/jcsm.5866
- Hirshkowitz M, et al. National Sleep Foundation's sleep time duration
  recommendations: methodology and results summary. _Sleep Health._
  2015;1(1):40–43. doi:10.1016/j.sleh.2014.12.010
- Galland BC, Taylor BJ, Elder DE, Herbison P. Normal sleep patterns in infants
  and children: a systematic review of observational studies. _Sleep Med Rev._
  2012;16(3):213–222. doi:10.1016/j.smrv.2011.06.001
- Iglowstein I, Jenni OG, Molinari L, Largo RH. Sleep duration from infancy to
  adolescence: reference values and generational trends. _Pediatrics._
  2003;111(2):302–307. doi:10.1542/peds.111.2.302
- Jenni OG, LeBourgeois MK. Understanding sleep–wake behavior and sleep
  disorders in children: the value of a model. _Curr Opin Psychiatry._
  2006;19(3):282–287. doi:10.1097/01.yco.0000218599.32969.03
- Grigg-Damberger MM. The visual scoring of sleep in infants 0 to 2 months of
  age. _J Clin Sleep Med._ 2016;12(3):429–445. doi:10.5664/jcsm.5600
- Kennaway DJ, Stamp GE, Goble FC. Development of melatonin production in
  infants and the impact of prematurity. _J Clin Endocrinol Metab._
  1992;75(2):367–369. doi:10.1210/jcem.75.2.1639937
- Tresillian Family Care Centres (NSW Health): "Newborn sleep",
  "3 to 5 months", "6 to 8 months" and "9 to 12 months" routines.
  tresillian.org.au
- Karitane. _Sleep Needs Guide for Infants 0 to 3 Years._ May 2016 (FAM002).
- 1177, "Barns sömn i olika åldrar"; Rikshandboken barnhälsovård, "Främja god
  sömn"; Folkhälsomyndigheten, "God sömn för barn och unga".
