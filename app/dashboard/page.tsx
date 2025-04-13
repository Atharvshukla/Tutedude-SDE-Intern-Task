'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCourses, searchYouTubePlaylists, addCourseToLibrary } from '@/lib/api';
import { Course } from '@/lib/types';
import Link from 'next/link';
import { toast } from 'sonner';
import SignOutButton from "@/components/SignOutButton";
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Define an interface for the YouTube search result
interface YouTubeSearchResult {
  id: {
    playlistId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const response = await getCourses();
    if (response.data) {
      setCourses(response.data);
    } else {
      toast.error('Failed to load courses');
    }
    setIsLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const response = await searchYouTubePlaylists(searchQuery);
    if (response.data) {
      setSearchResults(response.data);
    } else {
      toast.error('Failed to search YouTube playlists');
    }
    setIsSearching(false);
  };

  const handleAddCourse = async (playlistId: string) => {
    setIsAdding(playlistId);
    console.log('Starting to add course with playlist ID:', playlistId);
    try {
      const response = await addCourseToLibrary(playlistId);
      console.log('Add course response:', response);
      
      if (response.data) {
        toast.success('Course added successfully');
        await loadCourses();
        setSearchResults([]);
        setSearchQuery('');
      } else {
        if (response.error?.includes('not authenticated')) {
          console.error('Authentication error:', response.error);
          toast.error('You need to be signed in to add courses. Please sign in and try again.');
        } else {
          console.error('Error adding course:', response.error);
          toast.error(response.error || 'Failed to add course');
        }
      }
    } catch (error) {
      console.error('Exception when adding course:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsAdding(null);
    }
  };

  // Add this new function to navigate to the video library
  const navigateToVideoLibrary = () => {
    router.push('/video-library');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Your Learning Dashboard</h1>
          <div className="flex gap-4">
            <Button 
              onClick={navigateToVideoLibrary}
              variant="outline"
            >
              JavaScript Video Library
            </Button>
            <SignOutButton />
          </div>
        </div>
        
        <div className="flex flex-col space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search for YouTube playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Search Results</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((result) => (
                  <Card key={result.id.playlistId} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{result.snippet.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {result.snippet.description}
                      </p>
                      <Button
                        onClick={() => handleAddCourse(result.id.playlistId)}
                        className="w-full mt-auto"
                        disabled={isAdding === result.id.playlistId}
                      >
                        {isAdding === result.id.playlistId ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add to Library'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Courses</h2>
          {courses.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              <p>No courses yet. Search for YouTube playlists to add them to your library.</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card className="hover:shadow-lg transition-shadow h-full">
                    {course.thumbnailUrl && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 line-clamp-3">{course.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Overall Progress</span>
                          <span>{course.progress?.toFixed(1)}%</span>
                        </div>
                        <Progress value={course.progress || 0} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}