import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACHIEVEMENTS_CATALOG } from "./catalog";
import {
  AchievementProgress,
  Counters,
  EventName,
  EventPayloads,
  AchievementStatus,
} from "./types";

const STORAGE_KEY = "@uvgride_achievements_v1";

type State = {
  counters: Counters;
  progressById: Record<string, AchievementProgress>;
  pendingQueue: string[]; // ids de logros recién desbloqueados (para el modal)
};

type Ctx = {
  state: State;
  // API pública
  emit<E extends EventName>(name: E, payload: EventPayloads[E]): void;
  getStatus(id: string): { status: AchievementStatus; progress: number; goal: number; awardedAt?: number };
  consumeNextPending(): string | undefined;
  catalog: typeof ACHIEVEMENTS_CATALOG;
  resetAll(): Promise<void>; // útil en QA
};

const AchievementsContext = createContext<Ctx | null>(null);

const initialCounters: Counters = {
  totalRides: 0,
  totalKm: 0,
  groupsCreated: 0,
  invitesSent: 0,
  sosTests: 0,
  daysActive: 0,
  lastActiveDay: undefined,
};

const initialProgress = (): Record<string, AchievementProgress> => {
  const map: Record<string, AchievementProgress> = {};
  for (const def of ACHIEVEMENTS_CATALOG) {
    map[def.id] = {
      id: def.id,
      progress: 0,
      goal: def.goal,
      awarded: false,
      awardedAt: undefined,
    };
  }
  return map;
};

export function AchievementsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({
    counters: initialCounters,
    progressById: initialProgress(),
    pendingQueue: [],
  });

  const readyRef = useRef(false);

  // cargar estado
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as State;
          // seguridad por si el catálogo cambió: hidratar faltantes
          const hydrated: State = {
            counters: { ...initialCounters, ...parsed.counters },
            progressById: { ...initialProgress(), ...parsed.progressById },
            pendingQueue: [],
          };
          setState(hydrated);
        }
      } catch {
        // noop
      } finally {
        readyRef.current = true;
      }
    })();
  }, []);

  // persistir cambios
  useEffect(() => {
    if (!readyRef.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  // --------- Motor: Update counters por evento ---------
  function applyEventToCounters<E extends EventName>(
    counters: Counters,
    name: E,
    payload: EventPayloads[E]
  ): Counters {
    const next: Counters = { ...counters };

    if (name === "APP_OPENED") {
      const d = new Date((payload as any).at ?? Date.now());
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      if (next.lastActiveDay !== key) {
        next.daysActive += 1;
        next.lastActiveDay = key;
      }
    }

    if (name === "RIDE_COMPLETED") {
      const { distanceKm } = payload as EventPayloads["RIDE_COMPLETED"];
      next.totalRides += 1;
      next.totalKm += Math.max(0, Number(distanceKm) || 0);
    }

    if (name === "GROUP_CREATED") {
      next.groupsCreated += 1;
    }

    if (name === "INVITE_SENT") {
      const { count = 1 } = payload as EventPayloads["INVITE_SENT"];
      next.invitesSent += Math.max(1, Number(count) || 1);
    }

    if (name === "SOS_TESTED") {
      next.sosTests += 1;
    }

    return next;
  }

  // --------- Motor: Evaluación y otorgamiento ---------
  function evaluateUnlocks(prev: State, counters: Counters): { progressById: State["progressById"]; newlyAwardedIds: string[] } {
    const nextProgress: State["progressById"] = { ...prev.progressById };
    const newly: string[] = [];

    for (const def of ACHIEVEMENTS_CATALOG) {
      const ap = nextProgress[def.id] ?? { id: def.id, progress: 0, goal: def.goal, awarded: false as const };
      // actualizar progreso basado en su counterKey
      const current = counters[def.counterKey] as number;
      const clamped = Math.max(0, current);
      const alreadyAwarded = ap.awarded === true;

      const updated: AchievementProgress = {
        ...ap,
        progress: clamped,
        goal: def.goal,
      };

      const meets = clamped >= def.goal;

      if (meets && !alreadyAwarded) {
        updated.awarded = true;
        updated.awardedAt = Date.now();
        newly.push(def.id);
      }

      nextProgress[def.id] = updated;
    }

    return { progressById: nextProgress, newlyAwardedIds: newly };
  }

  function emit<E extends EventName>(name: E, payload: EventPayloads[E]) {
    setState((prev) => {
      const counters = applyEventToCounters(prev.counters, name, payload);
      const { progressById, newlyAwardedIds } = evaluateUnlocks(prev, counters);

      // cola (sin duplicados):
      const pendingSet = new Set(prev.pendingQueue);
      for (const id of newlyAwardedIds) pendingSet.add(id);

      return {
        counters,
        progressById,
        pendingQueue: Array.from(pendingSet),
      };
    });
  }

  function getStatus(id: string) {
    const ap = state.progressById[id];
    if (!ap) return { status: "locked" as AchievementStatus, progress: 0, goal: 1 };
    const pct = Math.min(ap.progress / Math.max(ap.goal, 1), 1);
    const status: AchievementStatus = ap.awarded ? "completed" : ap.progress > 0 ? "in_progress" : "locked";
    return { status, progress: ap.progress, goal: ap.goal, awardedAt: ap.awardedAt };
  }

  function consumeNextPending() {
    let nextId: string | undefined;
    setState((prev) => {
      const q = [...prev.pendingQueue];
      nextId = q.shift();
      return { ...prev, pendingQueue: q };
    });
    return nextId;
  }

  async function resetAll() {
    const fresh: State = {
      counters: initialCounters,
      progressById: initialProgress(),
      pendingQueue: [],
    };
    setState(fresh);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }

  const value = useMemo<Ctx>(
    () => ({
      state,
      emit,
      getStatus,
      consumeNextPending,
      catalog: ACHIEVEMENTS_CATALOG,
      resetAll,
    }),
    [state]
  );

  return <AchievementsContext.Provider value={value}>{children}</AchievementsContext.Provider>;
}

export function useAchievements() {
  const ctx = useContext(AchievementsContext);
  if (!ctx) throw new Error("useAchievements must be used within AchievementsProvider");
  return ctx;
}
