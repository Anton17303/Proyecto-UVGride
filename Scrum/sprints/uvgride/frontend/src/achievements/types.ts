export type AchievementStatus = "completed" | "in_progress" | "locked";
export type AchievementType = "binary" | "progress";

export type EventName =
  | "APP_OPENED"
  | "RIDE_COMPLETED"
  | "GROUP_CREATED"
  | "INVITE_SENT"
  | "SOS_TESTED"
  | "FAVORITE_ADDED";

export type EventPayloads = {
  APP_OPENED: { at: number };
  RIDE_COMPLETED: { distanceKm: number };
  GROUP_CREATED: { groupId: string | number };
  INVITE_SENT: { count?: number };
  SOS_TESTED: { at: number };
  FAVORITE_ADDED: { favoriteId: string | number; name?: string };
};

export type Counters = {
  totalRides: number;
  totalKm: number;
  groupsCreated: number;
  invitesSent: number;
  sosTests: number;
  daysActive: number; // simple “día activo” (puedes luego cambiar por tu hook de streak)
  lastActiveDay?: string; // YYYY-MM-DD para contar daysActive
  favoriteCreated: number;
};

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  type: AchievementType;
  goal: number; // 1 para binarios
  category?: string;
  icon?: string; // ionicon name
  listensTo: EventName[]; // eventos relevantes
  // qué contador alimenta este logro (para progreso)
  counterKey:
    | "totalRides"
    | "totalKm"
    | "groupsCreated"
    | "invitesSent"
    | "sosTests"
    | "daysActive"
    | "favoritesCreated";
  hidden?: boolean;
  repeatable?: boolean; // en MVP: false
};

export type AchievementProgress = {
  id: string;
  progress: number;
  goal: number;
  awarded: boolean;
  awardedAt?: number;
};
