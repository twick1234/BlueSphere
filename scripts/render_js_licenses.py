#!/usr/bin/env python3
import json, os, sys

base = os.path.dirname(os.path.dirname(__file__))
lic_dir = os.path.join(base, "LICENSES")
out_md = os.path.join(lic_dir, "THIRD_PARTY_JS.md")

def load(path):
    if not os.path.exists(path): return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

prod = load(os.path.join(lic_dir, "js_licenses.json"))
dev  = load(os.path.join(lic_dir, "js_dev_licenses.json"))

def to_rows(data):
    rows = []
    for name, meta in sorted(data.items()):
        license = meta.get("licenses", "UNKNOWN")
        repo = meta.get("repository", "")
        rows.append((name, license, repo))
    return rows

with open(out_md, "w", encoding="utf-8") as f:
    f.write("# JS/TS Third‑Party Licenses\n\n")
    for label, data in [("Production", prod), ("Development", dev)]:
        f.write(f"## {label} Dependencies\n\n")
        f.write("| Package | License | Repository |\n|---|---|---|\n")
        for name, license, repo in to_rows(data):
            link = f"[{repo}]({repo})" if repo else ""
            f.write(f"| {name} | {license} | {link} |\n")
    print(f"Wrote {out_md}")
