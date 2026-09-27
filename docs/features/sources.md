# Sources

Every number the app holds your child's record against — how much sleep is
recommended at this age, how long a baby is usually awake between sleeps,
what counts as a short nap — comes from somebody else: a WHO guideline, a
systematic review, the child health services' own pages. **Settings → About
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

For now the sleep tracker's sources are listed here in full. The other
trackers still name their sources in their own views — the WHO growth
standards, the Nordic Nutrition Recommendations, Folkhälsomyndigheten's
vaccination programme — and the screen says so; they join the list as each
one's numbers are checked against their sources again.

The list is the app's references registry, `docs/references.json`, the same
file the code cites by id beside every number — so a source is on this
screen the moment the code rests on it. See
[Where the numbers come from](../architecture.md#where-the-numbers-come-from).
