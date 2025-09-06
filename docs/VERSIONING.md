# Versioning Policy (SemVer)

We follow **Semantic Versioning**: `MAJOR.MINOR.PATCH`

- **MAJOR**: incompatible API changes or schema breaks
- **MINOR**: backwards-compatible features, new endpoints, UI modules
- **PATCH**: backwards-compatible bug fixes, perf tweaks, doc updates

### Examples
- Add new endpoint `/api/search` → bump **MINOR**.
- Fix bug in `/api/stations` → bump **PATCH**.
- Change DB schema incompatibly → bump **MAJOR** (and document migration).

### Tagging
- Tags are annotated: `git tag -a vX.Y.Z -m "..."`
- Releases are created from tags (see `docs/RELEASES.md`).

### CHANGELOG
- Every change lands in `CHANGELOG.md` with date and version.
- One entry per release with bullet-point highlights.
