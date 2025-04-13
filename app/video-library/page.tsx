'use client';
import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, BarChart2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SignOutButton from "@/components/SignOutButton";

// Hardcoded JavaScript playlists
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

export default function VideoLibraryPage() {
  const router = useRouter();
  
  const navigateToDashboard = () => {
    router.push('/dashboard');
  };
  
  const navigateToAnalytics = () => {
    router.push('/analytics');
  };
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link> */}
            <h1 className="text-2xl font-bold">JavaScript Video Library</h1>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={navigateToDashboard}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add New Courses
            </Button>
            <Button 
              onClick={navigateToAnalytics}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart2 className="h-4 w-4" />
              View Analytics
            </Button>
            <SignOutButton />
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jsPlaylists.map((playlist) => (
            <Card key={playlist.id} className="hover:shadow-lg transition-shadow h-full">
              {playlist.thumbnailUrl && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={playlist.thumbnailUrl}
                    alt={playlist.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl line-clamp-2">{playlist.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col">
                <p className="text-muted-foreground mb-4 line-clamp-3">{playlist.description}</p>
                <Link href={`/video-library/${playlist.id}`} className="mt-auto">
                  <Button className="w-full">View Playlist</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}