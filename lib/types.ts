// API Types
export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  progress?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videos: Video[];
  progress?: number;
}

export interface WatchedInterval {
  start: number;
  end: number;
}

export interface VideoProgress {
  videoId: string;
  userId: string;
  watchedIntervals: WatchedInterval[];
  totalWatchedSeconds: number;
  progressPercentage: number;
  lastPosition: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}