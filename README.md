# hetaira-db

Static frontend (plain HTML/CSS/JS, no build step). Deploy as-is to GitHub Pages.

| Repo | Role | Configured in `config.js` |
|---|---|---|
| `hetaira-data` | JSON catalog: `artists.json`, `tags.json`, `triggers.json`, `summary-all.json`, `<artist-uuid>/records/<uuid>.json` | `DB_BASE_URL` |
| `hetaira-c1` | media: `<artist-uuid>/cover/*`, `<artist-uuid>/audio/*` | `COVER_BASE_URL`, `AUDIO_BASE_URL` |

Every page loads `config.js` then `common.js` (shared helpers: HTML escaping, cover fallback, catalog loading, vocab lookups,
infinite scroll). Pages keep their own inline CSS.

Pages: `index` (archive, filters via `?q= &artist= &audience= &tier= &tag= &trigger=`), `detail?id=<record uuid>`,
`artists`, `tags`, `tag?tag=<slug>`, `triggers`, `trigger?trigger=<slug>`, `about`, `404`.

Local preview against the admin server in `hetaira-data`: open any page once with `?local=1` (see that repo's README).
