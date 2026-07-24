# Personal Website — Vercel Full-Stack Deployment

This package includes:

- Vite/React public website
- Password-protected `/admin` panel
- Vercel Function API
- Upstash Redis persistence for editable content
- Vercel Blob storage for uploaded images

## Upload to GitHub

Upload the **contents of this folder** to the root of the GitHub repository.
Do not upload `.env`, `node_modules`, `dist`, or an old ZIP by itself.

## Import into Vercel

Use these project settings:

- Framework Preset: Vite
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`

## Required Vercel configuration

In Project → Settings → Environment Variables, add:

- `ADMIN_USERNAME`: your private administrator username
- `ADMIN_PASSWORD`: a strong private password
- `JWT_SECRET`: a long random secret (at least 32 characters)

In Project → Storage:

1. Add an Upstash Redis database and connect it to this project. Vercel will add
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
2. Add a **Public** Vercel Blob store and connect it to this project. Vercel will
   add `BLOB_READ_WRITE_TOKEN`.
3. Redeploy after all variables and storage resources are connected.

The first successful API request copies the starter content into Redis.
After that, changes made in `/admin` are persisted and returned to the public site.
