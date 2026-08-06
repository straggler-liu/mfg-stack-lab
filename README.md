# MFG Stack Lab

Independent, evidence-led manufacturing software research for small manufacturers.

## Public URL

https://straggler-liu.github.io/mfg-stack-lab/

## Current operating status

- Independent, non-incorporated validation-stage research project
- No affiliate tracking links at launch
- No advertising analytics or email collection at launch
- Product review pages remain `noindex,follow` until hands-on testing is complete
- Browser-only readiness assessment and TCO estimator

## Automatic operation

The repository includes four GitHub Actions workflows:

1. **Deploy static site to GitHub Pages** — validates and deploys every push to `main`.
2. **Automated site health check** — runs daily, tests all internal links and critical live pages, and opens a GitHub Issue when the site fails.
3. **Weekly source and pricing watch** — checks official vendor pages for published-price and partner-term markers, uploads a report, and opens an Issue when material evidence changes.
4. **Monthly business validation review** — creates a structured monthly validation Issue.

Automated checks do not silently rewrite editorial conclusions. A source change creates a review task because vendor pages can be dynamic or temporarily blocked.

## Local validation

```bash
python scripts/site_audit.py
python -m http.server 8080
```

Then open `http://localhost:8080`.

## GitHub Pages

The repository is configured for deployment through GitHub Actions. In repository settings, **Pages → Build and deployment → Source** must be set to **GitHub Actions** once. Every later push to `main` deploys automatically.

## Later custom domain

The validation site does not require a purchased domain. When a domain is acquired, update canonical URLs, `robots.txt`, `sitemap.xml`, the workflow live URL and GitHub Pages custom-domain settings.

## Editorial safety

Public-source facts are dated. Product pages are marked `Hands-on test pending`. No fabricated test evidence, ratings or affiliate IDs are included.
