// src/achievements/AchievementsContext.tsx
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

type State = {
  counters: Counters;
  progressById: Record<string, AchievementProgress>;
  pendingQueue: string[];
};

type Ctx = {
  state: State;
  emit<E extends EventName>(name: E, payload: EventPayloads[E]): void;
  getStatus(id: string): { status: AchievementStatus; progress: number; goal: number; awardedAt?: number };
  consumeNextPending(): string | undefined;
  catalog: typeof ACHIEVEMENTS_CATALOG;
  resetAll(): Promise<void>;
  ready: boolean;
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
  favoritesCreated: 0,
};

const initialProgress = (): Record<string, AchievementProgress> => {
  const map: Record<string, AchievementProgress> = {};
  for (const def of ACHIEVEMENTS_CATALOG) {
    map[def.id] = { id: def.id, progress: 0, goal: def.goal, awarded: false, awardedAt: undefined };
  }
  return map;
};

const makeStorageKey = (userKey: string) => `@uvgride:achievements:v1:user:${userKey}`;

export function AchievementsProvider({
  children,
  userKey = "anon",
}: {
  children: React.ReactNode;
  userKey?: string;
}) {
  const [state, setState] = useState<State>({
    counters: initialCounters,
    progressById: initialProgress(),
    pendingQueue: [],
  });
  const [ready, setReady] = useState(false);

  const STORAGE_KEY = useMemo(() => makeStorageKey(userKey), [userKey]);

  // Cargar estado cuando cambia el usuario
  useEffect(() => {
    let cancelled = false;
    setReady(false); // pausa persistencia mientras cambiamos de usuario
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as State;
          const hydrated: State = {
            counters: { ...initialCounters, ...parsed.counters },
            progressById: { ...initialProgress(), ...parsed.progressById },
            pendingQueue: [], // no revivir modales antiguos
          };
          setState(hydrated);
        } else {
          // usuario nuevo → estado en blanco
          setState({
            counters: initialCounters,
            progressById: initialProgress(),
            pendingQueue: [],
          });
        }
      } catch {
        // noop
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [STORAGE_KEY]);

  // Persistir (solo cuando estamos listos)
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready, STORAGE_KEY]);

  // --- Motor (igual que ya tenías) ---
  function applyEventToCounters(c: Counters, name: EventName, payload: any): Counters {
    const next = { ...c };
    if (name === "APP_OPENED") {
      const d = new Date(payload?.at ?? Date.now());
      const key = d.toISOString().slice(0, 10);
      if (next.lastActiveDay !== key) {
        next.daysActive += 1;
        next.lastActiveDay = key;
      }
    }
    if (name === "RIDE_COMPLETED") {
      next.totalRides += 1;
      next.totalKm += Math.max(0, Number(payload?.distanceKm) || 0);
    }
    if (name === "GROUP_CREATED") next.groupsCreated += 1;
    if (name === "INVITE_SENT") next.invitesSent += Math.max(1, Number(payload?.count) || 1);
    if (name === "SOS_TESTED") next.sosTests += 1;
    if (name === "FAVORITE_ADDED") next.favoritesCreated += 1;
    return next;
  }

  function evaluateUnlocks(prev: State, counters: Counters) {
    const progressById = { ...prev.progressById };
    const newly: string[] = [];
    for (const def of ACHIEVEMENTS_CATALOG) {
      const ap = progressById[def.id] ?? { id: def.id, progress: 0, goal: def.goal, awarded: false as const };
      const current = counters[def.counterKey] as number;
      const updated = { ...ap, progress: Math.max(0, current), goal: def.goal };
      const meets = updated.progress >= def.goal;
      if (meets && !ap.awarded) {
        updated.awarded = true;
        (updated as any).awardedAt = Date.now();
        newly.push(def.id);
      }
      progressById[def.id] = updated;
    }
    return { progressById, newlyAwardedIds: newly };
  }

  function emit<E extends EventName>(name: E, payload: EventPayloads[E]) {
    if (!ready) return; // evita carrera antes de hidratar
    setState((prev) => {
      const counters = applyEventToCounters(prev.counters, name, payload);
      const { progressById, newlyAwardedIds } = evaluateUnlocks(prev, counters);
      const pendingSet = new Set(prev.pendingQueue);
      newlyAwardedIds.forEach((id) => pendingSet.add(id));
      return { counters, progressById, pendingQueue: Array.from(pendingSet) };
    });
  }

  function getStatus(id: string) {
    const ap = state.progressById[id];
    if (!ap) return { status: "locked" as AchievementStatus, progress: 0, goal: 1 };
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
      ready,
    }),
    [state, ready]
  );

  return <AchievementsContext.Provider value={value}>{children}</AchievementsContext.Provider>;
}

export function useAchievements() {
  const ctx = useContext(AchievementsContext);
  if (!ctx) throw new Error("useAchievements must be used within AchievementsProvider");
  return ctx;
}
