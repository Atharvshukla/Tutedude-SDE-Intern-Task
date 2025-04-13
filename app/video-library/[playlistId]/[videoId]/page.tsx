'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EnhancedVideoPlayer from '@/components/EnhancedVideoPlayer';

// Import the hardcoded playlists
const jsPlaylists = [
  {
    id: 'js-basics',
    title: 'JavaScript Fundamentals',
    description: 'Learn the basics of JavaScript programming language with this comprehensive tutorial series.',
    thumbnailUrl: 'https://i.ytimg.com/vi/W6NZfCO5SIk/maxresdefault.jpg',
    videos: [
      {
        id: 'js-basics-1',
        title: 'JavaScript Basics - Variables and Data Types',
        url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
        duration: 3600, // 1 hour in seconds
      },
      {
        id: 'js-basics-2',
        title: 'JavaScript Functions and Objects',
        url: 'https://www.youtube.com/watch?v=xUI5Tsl2JpY',
        duration: 2700, // 45 minutes in seconds
      },
    ]
  },
  {
    id: 'js-advanced',
    title: 'Advanced JavaScript Concepts',
    description: 'Dive deeper into JavaScript with advanced concepts like closures, prototypes, and async programming.',
    thumbnailUrl: 'https://i.ytimg.com/vi/8dWL3wF_OMw/maxresdefault.jpg',
    videos: [
      {
        id: 'js-advanced-1',
        title: 'JavaScript Closures Explained',
        url: 'https://www.youtube.com/watch?v=8dWL3wF_OMw',
        duration: 3000, // 50 minutes in seconds
      },
      {
        id: 'js-advanced-2',
        title: 'Async JavaScript - Promises and Async/Await',
        url: 'https://www.youtube.com/watch?v=PoRJizFvM7s',
        duration: 4200, // 1 hour 10 minutes in seconds
      },
    ]
  },
  {
    id: 'js-frameworks',
    title: 'JavaScript Frameworks',
    description: 'Explore popular JavaScript frameworks like React, Vue, and Angular.',
    thumbnailUrl: 'https://i.ytimg.com/vi/w7ejDZ8SWv8/maxresdefault.jpg',
    videos: [
      {
        id: 'js-frameworks-1',
        title: 'React JS Crash Course',
        url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
        duration: 5400, // 1 hour 30 minutes in seconds
      },
      {
        id: 'js-frameworks-2',
        title: 'Vue JS Crash Course',
        url: 'https://www.youtube.com/watch?v=qZXt1Aom3Cs',
        duration: 3900, // 1 hour 5 minutes in seconds
      },
    ]
  }
];

export default function VideoPage({ params }: { params: { playlistId: string; videoId: string } }) {
  const [video, setVideo] = useState<any>(null);
  const [playlist, setPlaylist] = useState<any>(null);
  
  useEffect(() => {
    // Find the playlist and video by ID
    const foundPlaylist = jsPlaylists.find(p => p.id === params.playlistId);
    if (foundPlaylist) {
      setPlaylist(foundPlaylist);
      const foundVideo = foundPlaylist.videos.find((v: any) => v.id === params.videoId);
      if (foundVideo) {
        setVideo(foundVideo);
      }
    }
  }, [params.playlistId, params.videoId]);

  if (!video || !playlist) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p>Video not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href={`/video-library/${params.playlistId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{video.title}</h1>
            <p className="text-muted-foreground">{playlist.title}</p>
          </div>
        </div>
        
        <EnhancedVideoPlayer 
          videoId={video.id}
          url={video.url}
          duration={video.duration}
        />
      </div>
    </div>
  );
}