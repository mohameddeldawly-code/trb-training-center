import { Cog, Flame, GitMerge, Gauge, Ship, Wrench, Zap, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  ship: Ship, zap: Zap, settings: Settings, flame: Flame,
  cog: Cog, 'git-merge': GitMerge, gauge: Gauge, wrench: Wrench,
};

export const SPEC_ICON_OPTIONS = Object.keys(MAP);

export function SpecIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = MAP[name ?? 'wrench'] ?? Wrench;
  return <Icon className={className} aria-hidden />;
}
