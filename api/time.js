// Trusted server clock for the game's anti-cheat (offline progress + speed-hack detection).
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(JSON.stringify({ now: Date.now() }));
}
