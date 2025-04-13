'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play } from 'lucide-react';

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

export default function PlaylistPage({ params }: { params: { playlistId: string } }) {
  const [playlist, setPlaylist] = useState<any>(null);
  
  useEffect(() => {
    // Find the playlist by ID
    const foundPlaylist = jsPlaylists.find(p => p.id === params.playlistId);
    if (foundPlaylist) {
      setPlaylist(foundPlaylist);
    }
  }, [params.playlistId]);

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p>Playlist not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/video-library">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{playlist.title}</h1>
        </div>
        
        <p className="text-lg text-muted-foreground">{playlist.description}</p>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Videos</h2>
          <div className="space-y-4">
            {playlist.videos.map((video: any) => (
              <Card key={video.id} className="hover:bg-accent/5 transition-colors">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{video.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Duration: {Math.floor(video.duration / 60)} minutes
                    </p>
                  </div>
                  <Link href={`/video-library/${params.playlistId}/${video.id}`}>
                    <Button>
                      <Play className="h-4 w-4 mr-2" />
                      Watch
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}