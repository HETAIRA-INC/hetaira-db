# hetaira-db

The database of the Hetaira archive: **JSON only**, written by `hetaira-admin`, read directly by the website from GitHub raw URLs.
Do not edit generated files by hand; use the admin (or `npm run build` in hetaira-admin to regenerate).

```
manifest.json  artists.json  vocab-tags.json  vocab-triggers.json
summary-all.json  tags.json  triggers.json  albums.json          generated
tags/ triggers/ albums/                                           generated (uuid references)
<artist-uuid>/data.json                                           source of truth
<artist-uuid>/summary.json  records/<uuid>.json                   generated
<artist-uuid>/backups/                                            automatic history (git-ignored)
```

Editable by hand only with care: `data.json`, `artists.json`, `vocab-*.json` (then run `npm run build` and `npm run check`).
Schema and file formats: [`../docs/DATA-SCHEMA.md`](../docs/DATA-SCHEMA.md).
