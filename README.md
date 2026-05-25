# Solisite

Nuxt 4 app with a minimal custom CMS backed by MySQL through Prisma.

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

The CMS lives at `/admin`.

- `Pages` edits string content for the public pages.
- `Articles` edits rich text content with Nuxt UI's TipTap-based editor.

Set `DATABASE_URL` in `.env` to the MySQL database used by the CMS, for example `mysql://user:password@127.0.0.1:3306/solisite`.

Set `NUXT_PUBLIC_SITE_URL` to the public origin of the site so canonical URLs and social preview images use absolute production URLs.

If you change the Prisma schema, apply it locally with:

```bash
npm run db:push
```
