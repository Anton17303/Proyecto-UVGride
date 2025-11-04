// src/achievements/catalog.ts
import { AchievementDef } from "./types";

export const ACHIEVEMENTS_CATALOG: AchievementDef[] = [
  {
    id: "first_open",
    title: "¡Bienvenido!",
    description: "Entraste al Home de UVGride por primera vez.",
    type: "binary",
    goal: 1,
    category: "Básicos",
    icon: "home-outline",
    listensTo: ["APP_OPENED"],
    counterKey: "daysActive",
  },
];
