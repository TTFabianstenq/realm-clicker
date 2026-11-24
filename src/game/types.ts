import type { Dec, NumberFormatMode } from "./numbers";
import type { SkillId } from "./content";

export type MonsterKind = "normal" | "boss" | "chest";

export interface Monster {
  kind: MonsterKind;
  primal: boolean;
  hp: Dec;
  max: Dec;
  /** variant seed for art + name */
  seed: number;
  /** boss deadline (ms epoch) */
  until: number;
  /** monster can't be damaged before this time (spawn animation) */
  readyAt: number;
}

export interface Boost {
  id: string;
  label: string;
  until: number;
  multGold?: number;
}

export type QuestType = "kills" | "bosses" | "clicks" | "chests" | "heroLevels" | "skills" | "zone";

export interface Quest {
  id: number;
  type: QuestType;
  target: number;
  /** stat value when the quest was issued (zone quests use absolute target) */
  start: number;
  rewardGold: Dec;
  rewardEssence: number;
}

export interface Stats {
  clicks: number;
  autoClicks: number;
  totalDamage: Dec;
  totalGold: Dec;
  monsters: number;
  bosses: number;
  chests: number;
  primals: number;
  highestZone: number; // all-time
  playTime: number;
  heroLevelsBought: number;
  skillsUsed: number;
  bestCombo: number;
  totalEssence: number;
  runGold: Dec;
  runStart: number;
}

export interface Settings {
  sound: boolean;
  volume: number;
  music: boolean;
  reducedMotion: boolean;
  numberFormat: NumberFormatMode;
  showFloats: boolean;
  buyAmount: number; // 1, 10, 25, 100, -1 = max
  graphics3d: boolean;
}

export interface GameState {
  version: number;
  gold: Dec;

  zone: number;
  /** highest zone fully cleared this ascension */
  cleared: number;
  killsInZone: number;
  autoProgress: boolean;
  monster: Monster;

  heroLevels: Record<string, number>;
  gilds: Record<string, number>;
  heroUpgrades: string[];
  upgradeLevels: Record<string, number>;

  ancients: Record<string, number>;
  essence: number;
  pendingEssence: number;
  ascensions: number;

  skillCd: Partial<Record<SkillId, number>>;
  skillActive: Partial<Record<SkillId, number>>;
  energized: boolean;
  lastSkill: SkillId | null;
  ritualStacks: number;

  combo: number;
  lastClickAt: number;
  autoClickAcc: number;

  boosts: Boost[];
  achievements: string[];
  quests: Quest[];
  questSeq: number;

  stats: Stats;
  settings: Settings;

  lastSaved: number;
  lastSeen: number;
  lastDaily: string;
  dailyStreak: number;
  introSeen: boolean;
  createdAt: number;
}

export type TabId = "heroes" | "upgrades" | "ancients" | "quests" | "achieve" | "stats" | "settings";

/** Things the UI should react to (sound, floating numbers, particles, toasts). */
export type GameEvent =
  | { t: "hit"; amount: Dec; crit: boolean; auto: boolean; x?: number; y?: number }
  | { t: "kill"; gold: Dec; kind: "normal" | "boss" | "chest"; primal: boolean }
  | { t: "goldGain"; gold: Dec }
  | { t: "bossStart"; primal: boolean }
  | { t: "bossFail" }
  | { t: "zone"; zone: number; record: boolean }
  | { t: "toast"; text: string; icon?: string; tone?: "gold" | "magic" | "info" | "danger" }
  | { t: "buy" }
  | { t: "levelUp" }
  | { t: "skill"; id: SkillId }
  | { t: "essence"; amount: number }
  | { t: "gild"; heroIndex: number }
  | { t: "achievement" }
  | { t: "ascend"; essence: number };
