import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Progress } from '@/components/ui/progress';
import { updateVideoProgress, getVideoProgress } from '@/lib/api';
import { WatchedInterval, VideoProgress } from '@/lib/types';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

interface VideoPlayerProps {
  videoId: string;
  url: string;
  duration: number;
}

export default function VideoPlayer({ videoId, url, duration }: VideoPlayerProps) {
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const lastUpdateRef = useRef<number>(0);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadProgress();
    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
    };
  }, [videoId]);

  const loadProgress = async () => {
    const response = await getVideoProgress(videoId);
    if (response.data) {
      setProgress(response.data);
    }
  };

  const handleProgress = ({ playedSeconds }: { playedSeconds: number }) => {
    const now = Date.now();
    if (now - lastUpdateRef.current >= 1000) {
      const interval: WatchedInterval = {
        start: Math.floor(playedSeconds - 1),
        end: Math.floor(playedSeconds)
      };
      updateVideoProgress(videoId, interval);
      lastUpdateRef.current = now;
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    watchIntervalRef.current = setInterval(() => {
      loadProgress();
    }, 5000);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
    }
  };

  const handleBuffer = () => {
    setIsBuffering(true);
  };

  const handleBufferEnd = () => {
    setIsBuffering(false);
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
            url={url}
            width="100%"
            height="100%"
            controls
            playing={isPlaying}
            onProgress={handleProgress}
            onPlay={handlePlay}
            onPause={handlePause}
            onBuffer={handleBuffer}
            onBufferEnd={handleBufferEnd}
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