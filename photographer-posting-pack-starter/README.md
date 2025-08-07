# Photographer Posting Pack (No-Backend Starter)

This is a **no-backend, client-only** Next.js starter so you can try the idea immediately.
It lets you:
- Create a Project
- Upload 200–1500 JPEGs (drag multiple files)
- Choose up to 20 preferences (e.g., florals, sunsets, intimate)
- Generate a **Posting Pack**:
  - 10 carousels (placeholders: picks unique images)
  - Up to 5 single-photo posts
  - Up to 5 mini-carousels (2–9 slides)
- Export a ZIP with the folder structure + `captions.txt` (5 captions per post)

> This prototype does **not** include server storage or real AI scoring. Everything runs in your browser.
> For production (Supabase + Vercel + smarter scoring), we can upgrade later.

## One-time setup (no code experience required)
1) Create a **Vercel** account at https://vercel.com (free tier).
2) Download this folder as a ZIP, then upload it to a new **GitHub** repo.
3) In Vercel, click **New Project → Import from GitHub → Deploy**.
4) After it builds (2–3 minutes), open your URL and use the app.

## Local run (optional)
- Install Node (>= 18).
- Run: `npm install`
- Run: `npm run dev`
- Open: http://localhost:3000

## Using the app
1) Click **New Project** and name it.
2) **Upload** your JPEGs (select many at once).
3) Choose up to **20 preferences**.
4) Click **Generate Posting Pack**.
5) Click **Export Pack** to download a ZIP with everything you need.

## Limitations of this starter
- All data lives in your browser (localStorage); clearing site data removes projects.
- Carousel images are not server-rendered; this build exports the **original files** into a folder layout as a proof of flow.
- Captions are template-based (we'll wire smarter captions later).

## Upgrade path (when you're ready)
- Add **Supabase** for storage and auth
- Add server routes for **AI scoring** and **collage rendering**
- Track **Used/Exported** status across devices
- Schedule posts via CSV upload to a social scheduling tool

Enjoy!
