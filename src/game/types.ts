import type { Dec } from "./numbers";
import type { NumberFormatMode } from "./numbers";

export interface Boost {
  id: string;
  label: string;
  until: number;
  multGold?: number;
  multDps?: number;
  multClick?: number;
  extraCrit?: number;
}

export interface GameState {
  version: number;
  gold: Dec;
  zone: number;
  killsInZone: number;
  monsterHp: Dec;
  monsterMax: Dec;
  bossActive: boolean;
  bossUntil: number;
  heroLevels: number[];
  upgradeLevels: Record<string, number>;
  prestigeLevels: Record<string, number>;
  essence: number;
  ascensions: number;
  skillsCd: Record<string, number>;
  boosts: Boost[];
  achievements: string[];
  questProgress: Record<string, number>;
  questsClaimed: string[];
  stats: {
    clicks: number;
    totalDamage: Dec;
    totalGold: Dec;
    monsters: number;
    bosses: number;
    highestZone: number;
    playTime: number;
    heroUpgrades: number;
    runGold: Dec;
    runBosses: number;
  };
  settings: {
    sound: boolean;
    music: boolean;
    reducedMotion: boolean;
    numberFormat: NumberFormatMode;
  };
  lastSaved: number;
  lastSeen: number;
  lastDaily: string;
  introSeen: boolean;
  createdAt: number;
}

export type TabId = "heroes" | "upgrades" | "skills" | "prestige" | "quests" | "achieve" | "stats" | "settings";
