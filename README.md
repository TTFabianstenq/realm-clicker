# Realm Clicker

An original dark-fantasy idle clicker RPG in the tradition of the classic hero-hiring clickers. Slay monsters, hire a party of twenty heroes, beat timed bosses, hunt primal bosses for Essence, and ascend to start over stronger — forever.

## How it plays

- **Zones** — clear 10 monsters to unlock the next zone. Every 5th zone is a **boss** with a 30-second timer. If it escapes, auto-progress pauses so you can farm and come back stronger.
- **Heroes** — 20 heroes, levels cost ×1.07 each. Buy ×1 / ×10 / ×25 / ×100 / MAX. Each hero has 5 upgrades (levels 10–100), and from level 200 every 25 levels **triples** their DPS.
- **Clicking** — fast clicks build a **combo** for bonus damage; crits hit for 5×+. Upgrades can add a share of your DPS to every click.
- **Treasure chests** — rare monsters worth 10× gold.
- **Skills** (keys 1–9) — Stormstrike, Warsurge, Fortune's Eye, Gold Sense, Midas Touch, Blood Pact, Overpower, Empower and Rewind, unlocked as you push deeper.
- **Primal bosses** (zone 25+) give **Essence**. **Ascend** to reset with it: every unspent Essence is +10% DPS, or spend it on 14 **Ancients** (familiars that auto-attack, idle bonuses, boss timers, chest luck, and more).
- **Gilds** — every 10 new record zones from zone 30 gilds a random hero (+50% DPS). Move gilds to your best hero for Essence.
- **Contracts, daily streaks, 50+ badges** (each +3% DPS), offline progress, stats.
- Synthesized sound effects, particles, screen shake, reduced-motion mode, four number formats, keyboard shortcuts, responsive layout, installable as a PWA.

## Tech

React 18 · TypeScript · Vite · Tailwind CSS. The whole game engine (`src/game/logic.ts`) is pure functions — state in, state + events out — so it runs headless in Node for tests and balance simulation. Big numbers use a tiny mantissa/exponent type (`src/game/numbers.ts`).

```
src/game/       content, formulas, engine, save parsing (no React)
src/state/      React provider: game loop, autosave, events → sound/FX
src/components/ HUD, zone bar, arena, skill bar, panels, SVG art
src/audio/      Web Audio sound effects (no asset files)
scripts/        engine tests and a bot that simulates hours of play
```

## Development

```bash
npm install
npm run dev        # play locally
npm test           # engine tests
npm run sim -- 6 4 # simulate 6 hours at 4 clicks/sec and print pacing
npm run build      # production build to dist/
```

Deploys on Vercel with the Vite preset (`vercel.json`).

## Saves

Saves live in `localStorage` under `realm-clicker-save-v1` and autosave every 5 seconds. Version 1 saves are migrated automatically (heroes, upgrades, Essence and prestige levels carry over). Export/import uses a base64 string; imported data is parsed and validated field by field and never executed.
