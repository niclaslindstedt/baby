# Sources

Every number the app holds your child's record against — how much sleep is
recommended at this age, the growth curves and the expected adult height, how
much energy, iron and fat a child of this age and weight needs, how many wet
diapers a day are usual, when each vaccination is due — comes from somebody
else: a WHO guideline, the Nordic Nutrition Recommendations, a systematic
review or a cohort study, Folkhälsomyndigheten's programme, the child health
services' own pages. **Settings → About
and sources** lists them.

Each source is listed under the tracker it serves, the strongest evidence
first — a guideline before a consensus statement, a systematic review before
a single cohort, the health services' practical advice last — and each one
says:

- what kind of evidence it is, and when it was published;
- its title, authors or publisher, and the journal it appeared in;
- one line on what in the app rests on it;
- **What the app took from it** — the source's own words, in its own
  language, that the numbers were taken from, with the page or table they
  are on. This is how you can check a number against where it came from
  rather than take the app's word for it;
- a link to the paper's DOI or the page itself, which opens in your browser
  and is the only thing on the screen that reaches the internet — and only
  when you tap it. The list itself is part of the app and works offline.

The screen also carries the app's disclaimer, because it is the right place
for it: the app is a notebook that compares what you enter with these
sources, not a clinician, and questions about your child's health belong
with the child health centre.

Every tracker's sources are listed — Diapers, Sleep, Growth, Food and
Vaccines — each checked against the source's own words. Where the check
found the app saying more than its source, the app was changed to match: a
source is not a decoration on a number but the reason for it.

The list is the app's references registry, `docs/references.json`, the same
file the code cites by id beside every number — so a source is on this
screen the moment the code rests on it. See
[Where the numbers come from](../architecture.md#where-the-numbers-come-from).
