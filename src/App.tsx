import { AppShell } from "./components/AppShell";
import { GameProvider } from "./state/GameContext";

export default function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  );
}
