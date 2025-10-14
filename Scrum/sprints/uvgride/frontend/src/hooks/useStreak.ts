// src/hooks/useStreak.ts
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "uvgride:streak:v1";

export type StreakState = {
  current: number;
  best: number;
  lastDate: string | null;
};

const initial: StreakState = { current: 0, best: 0, lastDate: null };

const localISODate = (d: Date = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate())
    .toISOString()
    .slice(0, 10);

const daysDiff = (aISO: string, bISO: string) => {
  const MS = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(bISO).getTime() - new Date(aISO).getTime()) / MS
  );
};

async function load(): Promise<StreakState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StreakState) : initial;
  } catch {
    return initial;
  }
}

async function save(s: StreakState) {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

export function useStreak() {
  const [state, setState] = useState<StreakState>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await load();
      const today = localISODate();
      if (s.lastDate) {
        const gap = daysDiff(s.lastDate, today);
        if (gap >= 2 && s.current !== 0) {
          s.current = 0; // racha rota
          await save(s);
        }
      }
      setState(s);
      setReady(true);
    })();
  }, []);

  const registerCreation = useCallback(async (dateISO?: string) => {
    const today = dateISO ?? localISODate();
    let s = await load();

    if (!s.lastDate) {
      s = { current: 1, best: 1, lastDate: today };
      await save(s);
      setState(s);
      return s;
    }

    const gap = daysDiff(s.lastDate, today);
    if (gap === 0) {
      // ya contamos hoy
      return s;
    } else if (gap === 1) {
      s.current += 1;
    } else {
      s.current = 1;
    }

    if (s.current > s.best) s.best = s.current;
    s.lastDate = today;

    await save(s);
    setState(s);
    return s;
  }, []);

  const reset = useCallback(async () => {
    await save(initial);
    setState(initial);
  }, []);

  return {
    ready,
    current: state.current,
    best: state.best,
    lastDate: state.lastDate,
    registerCreation,
    reset,
  };
}
