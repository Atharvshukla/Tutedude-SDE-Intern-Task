import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface EnhancedVideoPlayerProps {
  videoId: string;
  url: string;
  duration: number;
}

interface WatchedInterval {
  start: number;
  end: number;
}

interface VideoProgress {
  videoId: string;
  watchedIntervals: WatchedInterval[];
  totalWatchedSeconds: number;
  progressPercentage: number;
}

export default function EnhancedVideoPlayer({ videoId, url, duration }: EnhancedVideoPlayerProps) {
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const lastPositionRef = useRef<number>(0);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const watchedIntervalsRef = useRef<WatchedInterval[]>([]);
  
  // Load progress from localStorage on component mount
  useEffect(() => {
    loadProgress();
    
    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
    };
  }, [videoId]);

  const loadProgress = () => {
    try {
      const savedProgress = localStorage.getItem(`video-progress-${videoId}`);
      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress) as VideoProgress;
        setProgress(parsedProgress);
        watchedIntervalsRef.current = parsedProgress.watchedIntervals;
        
        // Set the player to the furthest watched position
        if (parsedProgress.watchedIntervals.length > 0) {
          const maxEnd = Math.max(...parsedProgress.watchedIntervals.map(interval => interval.end));
          lastPositionRef.current = maxEnd;
        }
      } else {
        // Initialize new progress
        const newProgress: VideoProgress = {
          videoId,
          watchedIntervals: [],
          totalWatchedSeconds: 0,
          progressPercentage: 0
        };
        setProgress(newProgress);
        watchedIntervalsRef.current = [];
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      toast.error('Failed to load video progress');
    }
  };

  const saveProgress = (updatedIntervals: WatchedInterval[]) => {
    try {
      // Merge overlapping intervals
      const mergedIntervals = mergeIntervals(updatedIntervals);
      
      // Calculate total watched seconds
      const totalWatchedSeconds = mergedIntervals.reduce(
        (total, interval) => total + (interval.end - interval.start),
        0
      );
      
      // Calculate progress percentage
      const progressPercentage = (totalWatchedSeconds / duration) * 100;
      
      const updatedProgress: VideoProgress = {
        videoId,
        watchedIntervals: mergedIntervals,
        totalWatchedSeconds,
        progressPercentage: Math.min(progressPercentage, 100) // Cap at 100%
      };
      
      // Save to localStorage
      localStorage.setItem(`video-progress-${videoId}`, JSON.stringify(updatedProgress));
      
      // Update state
      setProgress(updatedProgress);
      watchedIntervalsRef.current = mergedIntervals;
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save video progress');
    }
  };

  // Merge overlapping intervals
  const mergeIntervals = (intervals: WatchedInterval[]): WatchedInterval[] => {
    if (intervals.length <= 1) return intervals;
    
    // Sort intervals by start time
    const sortedIntervals = [...intervals].sort((a, b) => a.start - b.start);
    
    const result: WatchedInterval[] = [];
    let current = sortedIntervals[0];
    
    for (let i = 1; i < sortedIntervals.length; i++) {
      const interval = sortedIntervals[i];
      
      // If current interval overlaps with the next one, merge them
      if (current.end >= interval.start) {
        current.end = Math.max(current.end, interval.end);
      } else {
        // No overlap, add current to result and move to next
        result.push(current);
        current = interval;
      }
    }
    
    // Add the last interval
    result.push(current);
    
    return result;
  };

  const handleProgress = ({ playedSeconds }: { playedSeconds: number }) => {
    // Only track progress when the video is actually playing
    if (!isPlaying) return;
    
    const currentPosition = Math.floor(playedSeconds);
    
    // Check if we've moved to a new second
    if (currentPosition !== lastPositionRef.current) {
      // Create a new interval for the watched second
      const newInterval: WatchedInterval = {
        start: lastPositionRef.current,
        end: currentPosition
      };
      
      // Only add the interval if it's forward progress (not skipping)
      if (newInterval.end > newInterval.start && newInterval.end - newInterval.start <= 2) {
        const updatedIntervals = [...watchedIntervalsRef.current, newInterval];
        saveProgress(updatedIntervals);
      }
      
      lastPositionRef.current = currentPosition;
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    
    // Set up interval to periodically update the UI
    watchIntervalRef.current = setInterval(() => {
      if (progress) {
        setProgress({...progress});
      }
    }, 5000);
  };

  const handlePause = () => {
    setIsPlaying(false);
    
    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
    }
  };

  const handleSeek = (seconds: number) => {
    // When user seeks, update the last position
    lastPositionRef.current = Math.floor(seconds);
  };

  const handleBuffer = () => {
    setIsBuffering(true);
  };

  const handleBufferEnd = () => {
    setIsBuffering(false);
  };

  const handleReady = () => {
    // When player is ready, seek to the last position if available
    if (playerRef.current && lastPositionRef.current > 0) {
      playerRef.current.seekTo(lastPositionRef.current, 'seconds');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <div className="aspect-video rounded-t-lg overflow-hidden bg-black">
          <ReactPlayer
            ref={playerRef}
            url={url}
            width="100%"
            height="100%"
            controls
            playing={isPlaying}
            onProgress={handleProgress}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onBuffer={handleBuffer}
            onBufferEnd={handleBufferEnd}
            onReady={handleReady}
            progressInterval={1000}
            config={{
              youtube: {
                playerVars: { 
                  modestbranding: 1,
                  rel: 0 
                }
              }
            }}
          />
        </div>
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Progress</span>
            <div className="space-x-2">
              <span className="text-muted-foreground">
                {formatTime(progress?.totalWatchedSeconds || 0)}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{formatTime(duration)}</span>
              <span className="font-medium">
                ({progress?.progressPercentage.toFixed(1) || 0}%)
              </span>
            </div>
          </div>
          <Progress value={progress?.progressPercentage || 0} />
        </div>
      </CardContent>
    </Card>
  );
}