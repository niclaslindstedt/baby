# Examples

- [`baby-backup.json`](baby-backup.json) — a document exactly as **Settings →
  Your data → Export a backup** writes it: one child, a few growth readings, a
  day of diaper changes, a small food regimen alongside breastfeeding, and the
  first vaccination visits recorded. Restore it with **Settings → Your data →
  Restore from a backup** to see the screens populated with a real-looking
  record (it merges into whatever is already there), or read it to see the
  shape documented in [`docs/architecture.md`](../docs/architecture.md).

The developer **Demo data** switch under Settings builds a richer document in
memory without touching yours; this file is the on-disk form of the same idea.
