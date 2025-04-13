'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, CheckCircle2, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
} from 'chart.js';
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
);

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

interface VideoProgress {
  videoId: string;
  watchedIntervals: { start: number; end: number }[];
  totalWatchedSeconds: number;
  progressPercentage: number;
}

interface PlaylistProgress {
  id: string;
  title: string;
  totalVideos: number;
  completedVideos: number;
  totalDuration: number;
  watchedDuration: number;
  overallProgress: number;
  videos: {
    id: string;
    title: string;
    duration: number;
    progress: number;
    watchedSeconds: number;
  }[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [playlistsProgress, setPlaylistsProgress] = useState<PlaylistProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalWatchTime, setTotalWatchTime] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      loadProgressFromSupabase();
    } else {
      // Fallback to localStorage if user is not authenticated
      loadProgressFromLocalStorage();
    }
  }, [user]);

  const loadProgressFromSupabase = async () => {
    try {
      if (!user) return;
      
      setIsLoading(true);
      
      // Get all videos from the database
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('id, title, video_url, duration');
      
      if (videosError) {
        console.error('Error loading videos:', videosError);
        return;
      }
      
      // Get all progress records for the current user
      const { data: progressRecords, error: progressError } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (progressError) {
        console.error('Error loading progress:', progressError);
        return;
      }
      
      // Create a map of video URLs to their database IDs and progress
      const videoProgressMap = new Map();
      
      videos.forEach(video => {
        const progress = progressRecords.find(p => p.video_id === video.id);
        
        if (progress) {
          videoProgressMap.set(video.video_url, {
            totalWatchedSeconds: progress.total_watched_seconds,
            progressPercentage: progress.progress_percentage
          });
        }
      });
      
      // Process playlists with the progress data
      const progressData: PlaylistProgress[] = [];
      let totalWatchedSeconds = 0;
      let totalDurationSeconds = 0;
      
      jsPlaylists.forEach(playlist => {
        const playlistProgress: PlaylistProgress = {
          id: playlist.id,
          title: playlist.title,
          totalVideos: playlist.videos.length,
          completedVideos: 0,
          totalDuration: 0,
          watchedDuration: 0,
          overallProgress: 0,
          videos: []
        };
        
        playlist.videos.forEach(video => {
          playlistProgress.totalDuration += video.duration;
          totalDurationSeconds += video.duration;
          
          let videoProgress = 0;
          let watchedSeconds = 0;
          
          // Get progress from the map
          const progressInfo = videoProgressMap.get(video.url);
          
          if (progressInfo) {
            videoProgress = progressInfo.progressPercentage;
            watchedSeconds = progressInfo.totalWatchedSeconds;
            
            // Update completed videos count
            if (videoProgress >= 90) {
              playlistProgress.completedVideos++;
            }
          } else {
            // Check localStorage as fallback
            const savedProgress = localStorage.getItem(`video-progress-${video.id}`);
            
            if (savedProgress) {
              const parsedProgress = JSON.parse(savedProgress) as VideoProgress;
              videoProgress = parsedProgress.progressPercentage;
              watchedSeconds = parsedProgress.totalWatchedSeconds;
              
              if (videoProgress >= 90) {
                playlistProgress.completedVideos++;
              }
            }
          }
          
          // Add to total watched time
          playlistProgress.watchedDuration += watchedSeconds;
          totalWatchedSeconds += watchedSeconds;
          
          // Add video progress data
          playlistProgress.videos.push({
            id: video.id,
            title: video.title,
            duration: video.duration,
            progress: videoProgress,
            watchedSeconds: watchedSeconds
          });
        });
        
        // Calculate overall progress for the playlist
        playlistProgress.overallProgress = 
          playlistProgress.totalDuration > 0 
            ? (playlistProgress.watchedDuration / playlistProgress.totalDuration) * 100 
            : 0;
        
        progressData.push(playlistProgress);
      });
      
      // Calculate overall progress across all playlists
      const overallProgressPercentage = 
        totalDurationSeconds > 0 
          ? (totalWatchedSeconds / totalDurationSeconds) * 100 
          : 0;
      
      setPlaylistsProgress(progressData);
      setOverallProgress(overallProgressPercentage);
      setTotalWatchTime(totalWatchedSeconds);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading progress from Supabase:', error);
      // Fallback to localStorage
      loadProgressFromLocalStorage();
    }
  };

  const loadProgressFromLocalStorage = () => {
    try {
      const progressData: PlaylistProgress[] = [];
      let totalWatchedSeconds = 0;
      let totalDurationSeconds = 0;

      // Process each playlist
      jsPlaylists.forEach(playlist => {
        const playlistProgress: PlaylistProgress = {
          id: playlist.id,
          title: playlist.title,
          totalVideos: playlist.videos.length,
          completedVideos: 0,
          totalDuration: 0,
          watchedDuration: 0,
          overallProgress: 0,
          videos: []
        };

        // Calculate total duration for the playlist
        playlist.videos.forEach(video => {
          playlistProgress.totalDuration += video.duration;
          totalDurationSeconds += video.duration;

          // Get progress from localStorage
          const savedProgress = localStorage.getItem(`video-progress-${video.id}`);
          let videoProgress = 0;
          let watchedSeconds = 0;

          if (savedProgress) {
            const parsedProgress = JSON.parse(savedProgress) as VideoProgress;
            videoProgress = parsedProgress.progressPercentage;
            watchedSeconds = parsedProgress.totalWatchedSeconds;

            // Update completed videos count
            if (videoProgress >= 90) {
              playlistProgress.completedVideos++;
            }
          }

          // Add to total watched time
          playlistProgress.watchedDuration += watchedSeconds;
          totalWatchedSeconds += watchedSeconds;

          // Add video progress data
          playlistProgress.videos.push({
            id: video.id,
            title: video.title,
            duration: video.duration,
            progress: videoProgress,
            watchedSeconds: watchedSeconds
          });
        });

        // Calculate overall progress for the playlist
        playlistProgress.overallProgress = 
          playlistProgress.totalDuration > 0 
            ? (playlistProgress.watchedDuration / playlistProgress.totalDuration) * 100 
            : 0;

        progressData.push(playlistProgress);
      });

      // Calculate overall progress across all playlists
      const overallProgressPercentage = 
        totalDurationSeconds > 0 
          ? (totalWatchedSeconds / totalDurationSeconds) * 100 
          : 0;

      setPlaylistsProgress(progressData);
      setOverallProgress(overallProgressPercentage);
      setTotalWatchTime(totalWatchedSeconds);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading progress data:', error);
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Prepare chart data
  const prepareBarChartData = () => {
    return {
      labels: playlistsProgress.map(p => p.title),
      datasets: [
        {
          label: 'Progress (%)',
          data: playlistsProgress.map(p => p.overallProgress),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareDoughnutData = () => {
    const completedVideos = playlistsProgress.reduce((sum, p) => sum + p.completedVideos, 0);
    const totalVideos = playlistsProgress.reduce((sum, p) => sum + p.totalVideos, 0);
    const inProgressVideos = totalVideos - completedVideos;
    
    return {
      labels: ['Completed', 'In Progress'],
      datasets: [
        {
          data: [completedVideos, inProgressVideos],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareLineChartData = () => {
    // For simplicity, we'll use video indices as x-axis
    // In a real app, you might want to use timestamps
    const allVideos = playlistsProgress.flatMap(p => p.videos);
    
    return {
      labels: allVideos.map((_, index) => `Video ${index + 1}`),
      datasets: [
        {
          label: 'Watch Progress (%)',
          data: allVideos.map(v => v.progress),
          fill: false,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          tension: 0.1,
        },
      ],
    };
  };

  const prepareRadarData = () => {
    return {
      labels: ['JS Basics', 'Functions', 'Advanced', 'Async', 'Frameworks', 'React'],
      datasets: [
        {
          label: 'Your Skills',
          data: playlistsProgress.flatMap(p => 
            p.videos.map(v => v.progress)
          ),
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
    };
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
        <h1 className="text-3xl font-bold">Learning Analytics</h1>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="text-2xl font-bold">
                  {overallProgress.toFixed(1)}%
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Watch Time
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {formatTime(totalWatchTime)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Videos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {playlistsProgress.reduce((sum, p) => sum + p.completedVideos, 0)} / {playlistsProgress.reduce((sum, p) => sum + p.totalVideos, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Playlists
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {playlistsProgress.length}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs for different chart views */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Progress by Playlist</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <Bar 
                    data={prepareBarChartData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          title: {
                            display: true,
                            text: 'Completion (%)'
                          }
                        }
                      }
                    }}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Video Completion Status</CardTitle>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="w-64 h-64">
                    <Doughnut 
                      data={prepareDoughnutData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="playlists" className="space-y-6">
            {playlistsProgress.map(playlist => (
              <Card key={playlist.id}>
                <CardHeader>
                  <CardTitle>{playlist.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="text-xl font-bold">{playlist.overallProgress.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Watch Time</p>
                      <p className="text-xl font-bold">{formatTime(playlist.watchedDuration)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-xl font-bold">{playlist.completedVideos} / {playlist.totalVideos}</p>
                    </div>
                  </div>
                  <Progress value={playlist.overallProgress} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="videos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Video Progress Timeline</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <Line 
                  data={prepareLineChartData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Completion (%)'
                        }
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              {playlistsProgress.map(playlist => (
                <div key={playlist.id} className="space-y-2">
                  <h3 className="text-lg font-semibold">{playlist.title}</h3>
                  <div className="space-y-2">
                    {playlist.videos.map(video => (
                      <Card key={video.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-medium">{video.title}</p>
                            <p className="text-sm font-semibold">{video.progress.toFixed(1)}%</p>
                          </div>
                          <Progress value={video.progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Watched: {formatTime(video.watchedSeconds)}</span>
                            <span>Total: {formatTime(video.duration)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="skills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>JavaScript Skills Radar</CardTitle>
              </CardHeader>
              <CardContent className="h-96 flex items-center justify-center">
                <div className="w-96 h-96">
                  <Radar 
                    data={prepareRadarData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          min: 0,
                          max: 100,
                          ticks: {
                            stepSize: 20
                          }
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}