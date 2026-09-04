import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSettings, type SettingsMap } from '@/data/api';
import type { SiteSetting } from '@/types/db';

export interface SettingsState {
  map: SettingsMap;
  rows: SiteSetting[];
  isLoading: boolean;
  error: unknown;
}

export const SettingsContext = createContext<SettingsState>({
  map: {}, rows: [], isLoading: true, error: null,
});

export function useSettingsQuery() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useSettings() {
  return useContext(SettingsContext);
}

/** قراءة إعداد نصي مع قيمة احتياطية */
export function useSetting(key: string, fallback = ''): string {
  const { map } = useSettings();
  const v = map[key];
  if (v === null || v === undefined) return fallback;
  return typeof v === 'string' ? v : String(v);
}

export function useSettingList(key: string): string[] {
  const { map } = useSettings();
  const v = map[key];
  return Array.isArray(v) ? (v as string[]) : [];
}

export function useSettingBool(key: string, fallback = false): boolean {
  const { map } = useSettings();
  const v = map[key];
  if (v === null || v === undefined) return fallback;
  return v === true || v === 'true';
}

export function useSettingNumber(key: string, fallback = 0): number {
  const { map } = useSettings();
  const n = Number(map[key]);
  return Number.isFinite(n) ? n : fallback;
}
