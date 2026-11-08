# Nagaraj B — portfolio

A single-page developer portfolio built with plain HTML, CSS and a small amount of JavaScript. No build step, no framework and no external dependencies. KVix and Saarthi have hand-built UI visuals; Where Is My Bus has a screenshot slot.

## Preview locally

From this folder:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Before you publish

The only remaining placeholder is the **Where Is My Bus screenshot**:

1. Replace `assets/bus-placeholder.svg` with your real screenshot.
2. Update the `<img src="...">` and `alt` text in `index.html`. A 1600 × 1000 px image (16:10) fits best.
3. Optionally replace `assets/nagaraj-b-resume.pdf` whenever you update your resume — the Download resume button already points to it.

The KVix, Saarthi and Where Is My Bus GitHub links and social links are wired up. The Codeforces achievement is presented as plain text, with no profile link. Double-check the social URLs before publishing.

## Deploy

### GitHub Pages

1. Create a repository and push the contents of this folder to the root of the `main` branch.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select `main` and `/ (root)`, then save.

The included `.nojekyll` file keeps GitHub Pages from running Jekyll.

### Netlify

- Drag this folder onto the Netlify dashboard, or connect the repository.
- Build command: none.
- Publish directory: `.` (the repository root).

### Vercel

- Import the repository.
- Framework preset: **Other**.
- Build command: none.
- Output directory: `.`

## Notes

- The site uses a locally served variable font, [Geist](https://fonts.google.com/specimen/Geist), under the SIL Open Font License. Geist is the open-source sans-serif base behind Anthropic's custom Anthropic Sans typeface. The licence is in `assets/fonts/OFL.txt`.
- Motion is limited to scroll-triggered reveals, the KVix terminal entrance, the Saarthi phone animation and hover states. Scroll reveals replay whenever an element fully leaves and re-enters the viewport. All motion is removed for visitors who prefer reduced motion.
- The page has no cookies, trackers or third-party requests.
