# Solisite

Nuxt 4 app with a minimal custom CMS backed by SQLite.

## Run

```bash
bun install
bun run dev
```

The CMS lives at `/admin`.

- `Pages` edits string content for the public pages.
- `Articles` edits rich text content with Nuxt UI's TipTap-based editor.

SQLite defaults to `data/cms.sqlite`. Override it with `NUXT_SQLITE_PATH` if needed.
