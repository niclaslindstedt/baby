# Diapers

What a diaper change records, how the counts are read, and where the floors
the warnings rest on come from. The code is `src/app/diapers.ts`; the floors
are pinned in `tests/diapers_test.ts`.

## One tap

A change is a kind — pee, poo or both — and the moment it was logged. That
is the whole record: no size, no colour, no consistency. The Today screen
counts them as **wet** (pee or both) and **dirty** (poo or both), the two
numbers a child health nurse asks for, and a mistap is removed from today's
list.

The day a change belongs to is the _local_ day it was logged on — a change at
23:40 is part of that evening — and the week chart draws every day in its
window, zeros included, because for a diaper log a quiet day is worth seeing.

## The last 24 hours

The warnings read the **last 24 hours**, not the calendar day. A calendar day
is only complete at midnight, and "two wet diapers so far today" at ten in
the morning is not a warning; a rolling day asks the question the nurse asks
— how many since this time yesterday? — and can be asked at any hour.

## The floors, by age

| Age                | Fewest wet diapers in 24 h | Dirty-diaper gap worth a look     | Source                                                                                                       |
| ------------------ | -------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Day 1 / 2 / 3 / 4  | 1 / 2 / 3 / 4              | No stool within 48 hours of birth | NHS, La Leche League, AAP for the ramp; 1177 for the meconium deadline                                       |
| Day 5 – 6 weeks    | 6                          | More than 48 hours                | 1177 ("minst sex gånger per dag"), Rikshandboken ("kissar ljust minst 6 gånger varje dygn"); NHS for the gap |
| 6 weeks – 6 months | 5                          | None from the interval alone      | La Leche League ("five to six"), AAP ("fewer than six" as a dehydration sign)                                |
| 6 – 12 months      | 5                          | More than 4 days                  | Same; 1177's constipation definition (fewer than three a week, hard stools) once solids begin                |
| From 1 year        | 4 (soft)                   | More than 4 days                  | The sources give no toddler count; a toddler's diaper is dry for longer, and the copy says so                |

For a **breastfed** baby past six weeks the dirty-diaper interval is not a
signal on its own — 1177: "tio–tolv dagar eller längre", Rikshandboken:
"10–14 dagar" — so the gap is only mentioned beyond fourteen days, whatever
the age band says. The warning copy points at the signs that matter (hard
stools, an uncomfortable baby; light diapers, dark urine) rather than at the
count alone, and the source of the floor is quoted under it.

These are the cautious end of what the sources allow. A warning is "worth a
look", never a diagnosis: the sources pair the counts with weight gain, the
urine's colour, tears and a dry mouth, and so does the copy.
