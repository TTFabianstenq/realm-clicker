# Realm Clicker

A polished original browser-based idle clicker RPG. Click monsters, hire heroes, clear themed zones, fight timed bosses, spend Essence on Ascension bonuses, and push into huge numbers.

## Features

- Click combat with floating damage and crits
- Automated hero DPS
- Timed bosses every 10 monsters
- Procedural zone themes and original monster roster
- Click, hero, gold, and progression upgrades
- Active skills with cooldowns
- Ascension prestige with Essence shop
- Offline earnings (capped at 8 hours)
- Achievements, quests, and daily rewards
- Temporary boosts
- LocalStorage autosave, export, and import
- Responsive desktop / tablet / mobile layout
- Reduced-motion and number-format settings

No accounts, no backend, no payments.

## Tech stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Mantissa-exponent number system (no extra big-number dependency)

## Local development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm run preview
```

Deploy the `dist` folder or connect the repo to Vercel (Vite preset).

## Save data

Saves live in `localStorage` under `realm-clicker-save-v1`. Treat imported JSON as untrusted data; the loader validates shape and never executes save contents.
