import { ApiResponse, Course, Video, VideoProgress, WatchedInterval } from './types';
import { supabase } from './supabase';

// Course Management
export async function searchYouTubePlaylists(query: string): Promise<ApiResponse<any[]>> {
  try {
    const response = await fetch(`/api/youtube?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data;x
  } catch (error) {
    console.error('Error searching playlists:', error);
    return { error: 'Failed to fetch YouTube playlists' };
  }
}

export async function addCourseToLibrary(playlistId: string): Promise<ApiResponse<Course>> {
  try {
    // Get the current session token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      return { error: 'User not authenticated' };
    }
    
    const response = await fetch('/api/youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ playlistId }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding course:', error);
    return { error: 'Failed to add course to library' };
  }
}

// Video Progress API
export async function updateVideoProgress(
  videoId: string,
  interval: WatchedInterval
): Promise<ApiResponse<VideoProgress>> {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return { error: 'User not authenticated' };
    }

    const userId = data.user.id;

    const { data: existingProgress, error: fetchError } = await supabase
      .from('video_progress')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return { error: fetchError.message };
    }

    const watchedIntervals = existingProgress
      ? [...existingProgress.watched_intervals, interval]
      : [interval];

    const mergedIntervals = mergeIntervals(watchedIntervals);
    const totalWatchedSeconds = calculateTotalWatchedTime(mergedIntervals);

    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('duration')
      .eq('id', videoId)
      .single();

    if (videoError) {
      return { error: videoError.message };
    }

    // Handle case where video might be null or duration is 0
    const videoDuration = video?.duration || 1; // Default to 1 to avoid division by zero
    const progressPercentage = (totalWatchedSeconds / videoDuration) * 100;

    const { data: updatedProgress, error } = await supabase
      .from('video_progress')
      .upsert({
        user_id: userId,
        video_id: videoId,
        watched_intervals: mergedIntervals,
        total_watched_seconds: totalWatchedSeconds,
        progress_percentage: progressPercentage,
        last_position: interval.end,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: updatedProgress };
  } catch (error) {
    return { error: 'Failed to update video progress' };
  }
}

// Helper functions for interval management
function mergeIntervals(intervals: WatchedInterval[]): WatchedInterval[] {
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
}

function calculateTotalWatchedTime(intervals: WatchedInterval[]): number {
  return intervals.reduce((total, interval) => {
    return total + (interval.end - interval.start);
  }, 0);
}

// Course and Video API
export async function getCourses(): Promise<ApiResponse<Course[]>> {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return { error: 'User not authenticated' };
    }

    const userId = data.user.id;

    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        *,
        videos (*)
      `);

    if (coursesError) {
      return { error: coursesError.message };
    }

    // Get progress for each course
    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        // Add explicit type for videos to avoid 'any' type inference
        const videoIds = course.videos.map((v: Video) => v.id);
        
        const { data: progress, error: progressError } = await supabase
          .from('video_progress')
          .select('progress_percentage')
          .in('video_id', videoIds)
          .eq('user_id', userId);

        if (progressError) {
          return course;
        }

        const totalProgress = progress.reduce((sum, p) => sum + p.progress_percentage, 0);
        const averageProgress = progress.length > 0 ? totalProgress / progress.length : 0;

        return {
          ...course,
          progress: averageProgress
        };
      })
    );

    return { data: coursesWithProgress };
  } catch (error) {
    return { error: 'Failed to fetch courses' };
  }
}

export async function getCourseById(id: string): Promise<ApiResponse<Course>> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        videos (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    return { error: 'Failed to fetch course' };
  }
}

export async function getVideoProgress(videoId: string): Promise<ApiResponse<VideoProgress>> {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return { error: 'User not authenticated' };
    }

    const userId = data.user.id;

    const { data: progressData, error } = await supabase
      .from('video_progress')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { error: error.message };
    }

    return { data: progressData || null };
  } catch (error) {
    return { error: 'Failed to fetch video progress' };
  }
}