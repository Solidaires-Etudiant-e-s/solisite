# Solisite

Nuxt 4 app with a minimal custom CMS backed by SQLite through Prisma.

## Run

```bash
npm install
npm run dev
```

The CMS lives at `/admin`.

- `Pages` edits string content for the public pages.
- `Articles` edits rich text content with Nuxt UI's TipTap-based editor.

SQLite defaults to `file:./data/cms.sqlite`. Override it with `DATABASE_URL` if needed.

Set `NUXT_PUBLIC_SITE_URL` to the public origin of the site so canonical URLs and social preview images use absolute production URLs.

If you change the Prisma schema, apply it locally with:

```bash
npm run db:push
```
