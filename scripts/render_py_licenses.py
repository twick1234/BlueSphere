#!/usr/bin/env python3
import json, os

base = os.path.dirname(os.path.dirname(__file__))
lic_dir = os.path.join(base, "LICENSES")
in_json = os.path.join(lic_dir, "py_licenses.json")
out_md = os.path.join(lic_dir, "THIRD_PARTY_PY.md")

if not os.path.exists(in_json):
    print("No Python license JSON found at", in_json)
    raise SystemExit(0)

with open(in_json, "r", encoding="utf-8") as f:
    data = json.load(f)

with open(out_md, "w", encoding="utf-8") as f:
    f.write("# Python Third‑Party Licenses\n\n")
    f.write("| Package | Version | License | URL | Author |\n|---|---|---|---|---|\n")
    for row in data:
        f.write(f"| {row.get('Name','')} | {row.get('Version','')} | {row.get('License','')} | {row.get('URL','')} | {row.get('Author','')} |\n")
    print(f"Wrote {out_md}")
