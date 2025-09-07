# 09 — Non-Functional Requirements

## Performance
- TTI < 3s on median network for first map load.
- Tiles served via CDN; cache-control: max-age=86400.
- API P95 < 300ms for cached queries; < 600ms for cold reads.

## Availability
- SLO: 99.9% uptime; error budget 43m/month.

## Security
- HTTPS everywhere (prod); CORS allow-list.
- Input validation; parameterized SQL; no secrets in client.
- Dependency scanning (Snyk/GH Dependabot).

## Privacy
- No PII; public datasets; logs scrub IPs (or retain short TTL).

## Observability
- Metrics: request rate, latency, error rate, tile cache hit ratio.
- Traces for API handlers; structured JSON logs with request id.
