# Loop Gaiden Website Editor Guide

This site is static, but the main editable content now lives in JSON files.
Most future updates should not require editing `index.html`, `styles.css`, or
`script.js`.

## Files To Edit

- `content/site.json` controls page copy, token launch state, metadata, and CTA text.
- `content/game.json` controls the game page, leaderboard, wallet-claim labels, and competitions.
- `content/socials.json` controls X, TikTok, Instagram, Dexscreener, and future links.
- `content/issues.json` controls the active issue, cover, scene videos, scene text, and locked Greed Lords.
- `assets/` stores images and videos.

## Update Social Links

Edit `content/socials.json`.

Each link looks like this:

```json
{
  "label": "TikTok",
  "handle": "@loopgaiden",
  "url": "https://www.tiktok.com/@loopgaiden"
}
```

Change the `url` when the official link changes. The site will update the
token section, community section, footer, link hub, and mobile sticky bar.

## Update Launch / Contract Info

Edit the `token` section in `content/site.json`.

Token launch state:

```json
"launchStatus": "LAUNCH STATUS: LIVE",
"contractStatus": "LIVE ON SOLANA",
"contractMessage": "OFFICIAL CONTRACT ADDRESS",
"contractAddress": "Eepq1Wpq4q8cA4PphwCGkkTSdPHnwJubAnyoTha2pump",
"buyUrl": "https://pump.fun/coin/Eepq1Wpq4q8cA4PphwCGkkTSdPHnwJubAnyoTha2pump"
```

Keep this exact contract visible anywhere the token is promoted.

## Update The Game Section

Edit the `game` section in `content/site.json`.

```json
"game": {
  "kicker": "ARCADE FILE",
  "title": "LOOP GAIDEN GAME",
  "body": "The cartridge is inserted. The Trenches are waiting for the first playable build.",
  "status": "LAUNCHING SOON",
  "image": "assets/game.png",
  "url": "game.html"
}
```

When the game page is live, change `status` to something like `PLAY NOW` and
replace `url` with the real game page link.

## Update The Game Leaderboard

Edit `content/game.json`.

The locked arcade preview lives in `prototype`:

```json
"prototype": {
  "status": "ACCESS LOCKED",
  "objective": "OBJECTIVE: SURVIVE THE TRENCHES",
  "threats": ["SNIPERS", "FARMERS", "BUNDLES", "HVT"]
}
```

The How To Play strip and enemy cards live in `gameplay`:

```json
"gameplay": {
  "steps": [
    {
      "label": "MOVE",
      "title": "Cross the trench",
      "body": "Dash between danger zones before the market turns against you."
    }
  ],
  "enemies": {
    "items": [
      {
        "name": "Snipers",
        "type": "Long-range pressure",
        "body": "They wait for clean entries and punish slow reactions.",
        "impact": "Breaks streaks"
      }
    ]
  }
}
```

## Add A Game Devlog Post

Put the image in `assets/` or `assets/optimized/`, then add a new item to
`devlog.posts` in `content/game.json`.

```json
{
  "date": "DEV UPDATE 004",
  "status": "NEXT",
  "title": "New arena test",
  "image": "assets/optimized/game-arena.jpg",
  "body": "Short update text about what changed in development.",
  "tags": ["Prototype", "Arena", "Combat"],
  "category": "Gameplay"
}
```

Devlog filter buttons live in `devlog.filters`. A post appears when its
`category` matches the selected filter.

Progress meters live in `devlog.progress`:

```json
{ "label": "Prototype", "value": 35 }
```

Use values from `0` to `100`.

Leaderboard tabs live in `leaderboard.tabs`. The active reward-claim tab should
normally be `current`.

Leaderboard rows live inside each tab's `entries`:

```json
{
  "rank": 1,
  "player": "LoopRunner",
  "score": "98,420",
  "multiplier": "12.5x",
  "eligible": true
}
```

Only rows with `"eligible": true` show the wallet submit button. Keep that to
the top 3 unless the competition rules change.

Competition rules live in `rules.items`. Reward slots live in `rewards.slots`.
Game mode cards live in `modes.items`.

Upcoming competitions live in `competitions.items`:

```json
{
  "name": "First Trench Run",
  "status": "COMING SOON",
  "reward": "Top 3 wallet claim",
  "details": "Opening competition for the first playable browser prototype."
}
```

Previous winners live in `hallOfFame.winners`. Fair-play notes live in
`fairPlay.checks`.

The current wallet form is a static preview flow. It saves in the visitor's
browser only. Use a real backend or verified form before collecting live reward
wallets.

## Update The Mission / Roadmap

Edit the `mission` section in `content/site.json`.

Use `chapters` for the visible roadmap path. Each chapter can include:

```json
{
  "number": "04",
  "tone": "sealed",
  "status": "TARGET: GREED LORD #2",
  "title": "CHAPTER 04 — CLASSIFIED",
  "body": "The next signal has been found.",
  "items": ["Next issue file sealed"],
  "silhouette": "?"
}
```

The Seven Greed Lords slots live in the chapter with `bosses`. Keep unreleased
issues as `???` or `CLASSIFIED`, then reveal one new slot when its issue is
actually released.

## Add Or Replace Comic Scenes

Put new MP4 files in:

```text
assets/scenes/
```

Then edit `content/issues.json` and add a scene to `activeIssue.scenes`:

```json
{
  "kicker": "SIGNAL RECOVERED",
  "title": "THE FARM IS NOT DONE.",
  "body": "The Trenches are still sending fragments. Loop follows the signal deeper.",
  "video": "assets/scenes/sc8.mp4",
  "ariaLabel": "The eighth Loop Gaiden comic scene"
}
```

Optional: add a `poster` image if you want a preview image before the MP4 loads.

```json
"poster": "assets/optimized/scene-08.jpg"
```

The site automatically updates:

- scene count
- progress bar
- scene picker buttons
- previous / next buttons
- final share / back controls

## Change The Issue Cover

Replace the cover file path in `content/issues.json`:

```json
"cover": "assets/optimized/cover.jpg"
```

Use an optimized image for the website. Keep original large files in `assets/`
if you want to preserve them as masters.

## Update The Next Issue Teaser

Edit `nextIssue` in `content/site.json`:

```json
"nextIssue": {
  "kicker": "NEXT FILE",
  "title": "CLASSIFIED TRANSMISSION",
  "body": "The next Greed Lord file is sealed. The issue name and number unlock when it is ready.",
  "button": "WATCH ON X"
}
```

## Update Locked Greed Lords

Edit `lockedLords` in `content/issues.json`.

```json
{
  "number": "02",
  "title": "CLASSIFIED",
  "quote": "SIGNAL HIDDEN.",
  "status": "ISSUE LOCKED"
}
```

## Local Preview

Run this from the project folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Do not preview by opening `index.html` directly when checking JSON changes.
Browsers often block local JSON loading from plain file URLs.

## Quick Rule

If you are changing words, links, issue data, or video files, start with the
`content/` folder. Touch the HTML/CSS/JS only when changing layout or behavior.
