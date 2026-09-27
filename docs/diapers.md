# Diapers

What a diaper change records, how the counts are read, and where the floors
the warnings rest on come from. The code is `src/app/diapers.ts`; the floors
are pinned in `tests/diapers_test.ts`.

## One tap

A change is a kind — pee, poo or both — and the moment it was logged. That
is the whole record: no size, no colour, no consistency. They are counted as
**wet** (pee or both) and **dirty** (poo or both), the two numbers a child
health nurse asks for.

The **Diapers** tab is where a change goes in: the three buttons, and the
last seven days under them, newest day first and newest change first inside a
day (`recentByDay`), so a mistap is one tap to remove. The window is bounded
rather than the whole history — a mistap is noticed the same day or the next
morning, and the diaper log is the one record here that grows by several rows
a day. The top bar's **+** opens the same three buttons from any screen, and
both write through the same `addDiaper` edit.

What the counts _mean_ is on Today, behind the Diapers card: the rolling day,
the floor it is read against, and the week as a chart. Nothing on the tab is
derived.

The day a change belongs to is the _local_ day it was logged on — a change at
23:40 is part of that evening — and the week chart draws every day in its
window, zeros included, because for a diaper log a quiet day is worth seeing.

## The last 24 hours

The warnings read the **last 24 hours**, not the calendar day. A calendar day
is only complete at midnight, and "two wet diapers so far today" at ten in
the morning is not a warning; a rolling day asks the question the nurse asks
— how many since this time yesterday? — and can be asked at any hour.

## The floors, by age

| Age                | Fewest wet diapers in 24 h | Dirty-diaper gap worth a look     | Source                                                                                                                              |
| ------------------ | -------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Day 1 / 2 / 3 / 4  | 1 / 2 / 3 / 3              | No stool within 48 hours of birth | Unicef UK's checklist and La Leche League for the ramp; 1177 for the first pee within a day and the meconium within two days        |
| Day 5 – 6 weeks    | 6                          | More than 48 hours                | NHS and La Leche League ("from day 5"); 1177 ("minst sex gånger per dag"), Rikshandboken ("kissar ljust minst 6 gånger varje dygn") |
| 6 weeks – 6 months | 5                          | None from the interval alone      | La Leche League ("five to six diapers per day" after about six weeks)                                                               |
| 6 – 12 months      | 5                          | More than 4 days                  | Same; once solids begin, Rikshandboken's "en avföring varannan dag" and 1177's signs of constipation                                |
| From 1 year        | 4 (soft)                   | More than 4 days                  | The sources give no toddler count; a toddler's diaper is dry for longer, and the copy says so                                       |

The 48 hours in the first six weeks is not a quoted gap: the sources give
counts — at least two stools a day from the fourth day for a breastfed baby
(NHS), at least once a day in the first month (AAP), while a formula-fed baby
"may go 1 to 2 days between bowel movements" (AAP) — and 48 hours is the
cautious gap those counts allow.

For a **breastfed** baby from six weeks the dirty-diaper interval is not a
signal on its own — 1177: "tio-tolv dagar eller längre", Rikshandboken:
"10–14 dagar" — so the gap is only mentioned beyond fourteen days, whatever
the age band says, until solids begin at six months. From then the stool
pattern moves toward "en avföring varannan dag" (Rikshandboken), and a
breastfed child's gap is read like any other. The warning copy points at the signs that matter (hard
stools, an uncomfortable baby; light diapers, dark urine) rather than at the
count alone, and the source of the floor is quoted under it.

These are the cautious end of what the sources allow. A warning is "worth a
look", never a diagnosis: the sources pair the counts with weight gain, the
urine's colour, tears and a dry mouth, and so does the copy.

## Sources

Every source above is an entry in [`references.json`](references.json), cited
in the code by its `[ref:<id>]` tag and listed for parents under Settings →
About, with the words the floors were taken from: 1177's pages on
breastfeeding, formula, the newborn's body, the first week's pee and poo and
constipation; Rikshandboken's pages on breastfeeding and constipation; the
NHS, Unicef UK and La Leche League pages on whether a baby gets enough milk;
and the AAP's page on infant constipation.
