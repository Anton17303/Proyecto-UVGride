// src/hooks/useStreak.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../context/UserContext";
import { useAchievements } from "../achievements/AchievementsContext";

type StreakState = {
  current: number;
  best: number;
  lastDay: string | null; // "YYYY-MM-DD" con corte a las 04:00 local
};

const DEFAULT_ROLLOVER_HOUR = 4; // 4am: el día "cambia" a esta hora

function dayKeyFrom(date: Date, rolloverHour = DEFAULT_ROLLOVER_HOUR) {
  // Mueve el reloj atrás 'rolloverHour' para evitar cortar racha justo en medianoche
  const d = new Date(date);
  d.setHours(d.getHours() - rolloverHour, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useStreak(rolloverHour = DEFAULT_ROLLOVER_HOUR) {
  const { user } = useUser();
  const { emit } = useAchievements();

  const storageKey = useMemo(
    () => (user?.id ? `streak:${user.id}` : null),
    [user?.id]
  );

  const [ready, setReady] = useState(false);
  const [state, setState] = useState<StreakState>({
    current: 0,
    best: 0,
    lastDay: null,
  });

  const load = useCallback(async () => {
    if (!storageKey) {
      setReady(true);
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const saved: StreakState | null = raw ? JSON.parse(raw) : null;
      if (saved) setState(saved);
    } catch {
      // noop
    } finally {
      setReady(true);
    }
  }, [storageKey]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(
    async (next: StreakState) => {
      if (!storageKey) return;
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    },
    [storageKey]
  );

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  /**
   * Marca el día actual. Si es un día nuevo (según dayKey con corte 4am),
   * incrementa la racha y (opcional) emite APP_OPENED para logros.
   */
  const touchToday = useCallback(
    async (opts?: { emitAchievement?: boolean }) => {
      const todayKey = dayKeyFrom(new Date(), rolloverHour);
      let next: StreakState;

      if (!state.lastDay) {
        // Primera vez
        next = { current: 1, best: 1, lastDay: todayKey };
      } else if (state.lastDay === todayKey) {
        // Ya contamos hoy
        next = { ...state };
      } else {
        // Calcula diferencia de días
        const last = new Date(`${state.lastDay}T00:00:00`);
        const today = new Date(`${todayKey}T00:00:00`);
        const diffDays = Math.round(
          (today.getTime() - last.getTime()) / (24 * 3600 * 1000)
        );

        if (diffDays === 1) {
          const cur = state.current + 1;
          next = { current: cur, best: Math.max(state.best, cur), lastDay: todayKey };
        } else if (diffDays > 1) {
          // Racha rota; reinicia
          next = { current: 1, best: Math.max(state.best, 1), lastDay: todayKey };
        } else {
          // diff negativo (cambio de hora hacia atrás). Ignora.
          next = { ...state };
        }
      }

      const wasNewDay = next.lastDay !== state.lastDay;
      if (wasNewDay && opts?.emitAchievement) {
        try {
          emit?.("APP_OPENED", {}); // Solo cuando realmente contó como día nuevo
        } catch {
          // noop
        }
      }

      setState(next);
      await persist(next);
      return { updated: wasNewDay, next };
    },
    [emit, persist, rolloverHour, state]
  );

  return {
    ready,
    current: state.current,
    best: state.best,
    lastDay: state.lastDay,
    refresh,
    touchToday, // 👈 nuevo
  };
}
