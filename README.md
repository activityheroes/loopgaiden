# Loop Gaiden static website

This build uses only:
- HTML5
- CSS
- Vanilla JavaScript

No framework, build step, package manager, database, or external JavaScript dependency is required.

Editable content lives in:
- `content/site.json`
- `content/game.json`
- `content/socials.json`
- `content/issues.json`

For handoff instructions, read `EDITOR_GUIDE.md`.

## Run locally
Serve the folder with any static HTTP server.

Example:
```bash
python3 -m http.server 8080
```
Then visit:
`http://localhost:8080`

## Before publishing
1. Replace `TBA AT LAUNCH` in `content/site.json` with the full real CA.
2. Update the Pump.fun link in `content/site.json` to the exact coin page.
3. Replace or unlock comic scenes in `content/issues.json` as you publish them.
4. Update `content/game.json` when competitions, leaderboard rows, or rewards change.
5. Keep the Loop Code / fee allocation accurate to actual on-chain actions.
6. All artwork is stored locally under `/assets`, so the site can be hosted as a normal static site.

## Suggested hosting
Any static host works: GitHub Pages, Cloudflare Pages, Netlify, Vercel static hosting, or your own server.
