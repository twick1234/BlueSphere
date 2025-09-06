# Releases

This repo uses **semantic versioning** and **annotated git tags** for releases.

## How to Cut a Release

1. Ensure your changes are committed:
```bash
git add .
git commit -m "Release vX.Y.Z"
```

2. Create an **annotated tag**:
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z: short description of changes"
```

3. Push code + tags:
```bash
git push origin main --tags
```

4. (Optional) Create a GitHub Release:
- Go to **Releases → Draft a new release**
- Select tag `vX.Y.Z`
- Title: `vX.Y.Z`
- Paste the entry from **CHANGELOG.md**
- Publish

## Version Bumping

- Backwards-compatible features → **minor** (v0.1.0 → v0.2.0)
- Fixes or docs-only → **patch** (v0.1.0 → v0.1.1)
- Breaking changes → **major** (v1.0.0)

See also: **docs/VERSIONING.md**
