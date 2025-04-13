import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from  '@/lib/auth';
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
  const { user } = useAuth(); // Get current user from auth context
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const lastPositionRef = useRef<number>(0);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const watchedIntervalsRef = useRef<WatchedInterval[]>([]);
  
  // Load progress on component mount
  useEffect(() => {
    if (user) {
      loadProgressFromSupabase();
    } else {
      // Fallback to localStorage if user is not authenticated
      loadProgressFromLocalStorage();
    }
    
    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
    };
  }, [videoId, user]);

  const loadProgressFromSupabase = async () => {
    try {
      if (!user) return;
      
      // First, check if we have a video record in the database
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('id')
        .eq('video_url', url)
        .single();
      
      if (videoError && videoError.code !== 'PGRST116') {
        console.error('Error checking video:', videoError);
        toast.error('Failed to load video data');
        return;
      }
      
      let dbVideoId;
      
      // If video doesn't exist in the database, create it
      if (!videoData) {
        const { data: newVideo, error: createError } = await supabase
          .from('videos')
          .insert({
            title: 'Video ' + videoId, // You might want to pass a better title
            video_url: url,
            duration: duration,
            course_id: null // You might want to associate with a course
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error('Error creating video:', createError);
          toast.error('Failed to create video record');
          return;
        }
        
        dbVideoId = newVideo.id;
      } else {
        dbVideoId = videoData.id;
      }
      
      // Now get the progress for this video
      const { data: progressData, error: progressError } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_id', dbVideoId)
        .single();
      
      if (progressError && progressError.code !== 'PGRST116') {
        console.error('Error loading progress:', progressError);
        toast.error('Failed to load video progress');
        return;
      }
      
      if (progressData) {
        // Convert the progress data from the database to our format
        const watchedIntervals = progressData.watched_intervals as WatchedInterval[];
        
        const videoProgress: VideoProgress = {
          videoId,
          watchedIntervals,
          totalWatchedSeconds: progressData.total_watched_seconds,
          progressPercentage: progressData.progress_percentage
        };
        
        setProgress(videoProgress);
        watchedIntervalsRef.current = watchedIntervals;
        
        // Set the player to the last position
        const lastPosition = progressData.last_position || 0;
        lastPositionRef.current = lastPosition;
        console.log('Loaded last position from Supabase:', lastPosition);
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
      console.error('Error loading progress from Supabase:', error);
      toast.error('Failed to load video progress');
      // Fallback to localStorage
      loadProgressFromLocalStorage();
    }
  };

  const loadProgressFromLocalStorage = () => {
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
      console.error('Error loading progress from localStorage:', error);
      toast.error('Failed to load video progress');
    }
  };

  const saveProgress = async (updatedIntervals: WatchedInterval[]) => {
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
      
      // Update state
      setProgress(updatedProgress);
      watchedIntervalsRef.current = mergedIntervals;
      
      // Save to localStorage as fallback
      localStorage.setItem(`video-progress-${videoId}`, JSON.stringify(updatedProgress));
      
      // If user is authenticated, save to Supabase
      if (user) {
        await saveProgressToSupabase(mergedIntervals, totalWatchedSeconds, progressPercentage);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save video progress');
    }
  };

  const saveProgressToSupabase = async (
    watchedIntervals: WatchedInterval[],
    totalWatchedSeconds: number,
    progressPercentage: number
  ) => {
    try {
      if (!user || isSaving) return;
      
      setIsSaving(true);
      
      // First, get the video ID from the database
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('id')
        .eq('video_url', url)
        .single();
      
      if (videoError) {
        console.error('Error getting video ID:', videoError);
        return;
      }
      
      const videoId = videoData.id;
      
      // Check if progress record exists
      const { data: existingProgress, error: checkError } = await supabase
        .from('video_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking progress:', checkError);
        return;
      }
      
      const progressData = {
        user_id: user.id,
        video_id: videoId,
        watched_intervals: watchedIntervals,
        total_watched_seconds: totalWatchedSeconds,
        progress_percentage: progressPercentage,
        last_position: lastPositionRef.current,
        updated_at: new Date().toISOString()
      };
      
      if (existingProgress) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('video_progress')
          .update(progressData)
          .eq('id', existingProgress.id);
        
        if (updateError) {
          console.error('Error updating progress:', updateError);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('video_progress')
          .insert(progressData);
        
        if (insertError) {
          console.error('Error inserting progress:', insertError);
        }
      }
    } catch (error) {
      console.error('Error saving to Supabase:', error);
    } finally {
      setIsSaving(false);
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
      console.log('Seeking to position:', lastPositionRef.current);
      // Add a small delay to ensure the player is fully initialized
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.seekTo(lastPositionRef.current, 'seconds');
          toast.info(`Resuming from ${formatTime(lastPositionRef.current)}`);
        }
      }, 500);
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