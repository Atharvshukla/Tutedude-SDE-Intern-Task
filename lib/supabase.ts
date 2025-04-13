import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type WatchedInterval = {
  start: number;
  end: number;
};

export type VideoProgress = {
  id: string;
  user_id: string;
  video_id: string;
  watched_intervals: WatchedInterval[];
  total_watched_seconds: number;
  progress_percentage: number;
  last_position: number;
  created_at: string;
  updated_at: string;
};

export const mergeIntervals = (intervals: WatchedInterval[]): WatchedInterval[] => {
  if (intervals.length <= 1) return intervals;

  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: WatchedInterval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
};

export const calculateTotalWatchedTime = (intervals: WatchedInterval[]): number => {
  const merged = mergeIntervals(intervals);
  return merged.reduce((total, interval) => total + (interval.end - interval.start), 0);
};