# Third-Party Licenses

## JavaScript/TypeScript dependencies

| Package | Version Range | License (to be resolved) |
|---|---|---|

| @playwright/test | ^1.48.0 | _TBD via license-checker_ |
| gray-matter | ^4.0.3 | _TBD via license-checker_ |
| next | 14.2.5 | _TBD via license-checker_ |
| react | 18.2.0 | _TBD via license-checker_ |
| react-dom | 18.2.0 | _TBD via license-checker_ |
| remark | ^14.0.3 | _TBD via license-checker_ |
| remark-html | ^16.0.1 | _TBD via license-checker_ |

## Python dependencies

_List will be generated via `pip-licenses` once Python env is set up._

## How to regenerate


Use the provided scripts to collect third‑party license metadata:

### JavaScript (via `license-checker`)
```bash
cd frontend/bluesphere-site
npm install
npx license-checker --production --json > ../../LICENSES/js_licenses.json
npx license-checker --development --json > ../../LICENSES/js_dev_licenses.json
python ../../scripts/render_js_licenses.py
```

### Python (via `pip-licenses`)
```bash
pip install pip-licenses
pip-licenses --format=json --with-urls --with-authors --with-license-file > LICENSES/py_licenses.json
python scripts/render_py_licenses.py
```
