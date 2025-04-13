import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }
  
  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['playlist'],
      maxResults: 10,
    });
    
    return NextResponse.json({ data: response.data.items || [] });
  } catch (error) {
    console.error('YouTube API error:', error);
    return NextResponse.json({ error: 'Failed to search YouTube playlists' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('Starting process to add YouTube playlist as course');
    const supabase = createRouteHandlerClient({ cookies });
    const { playlistId } = await request.json();
    
    if (!playlistId) {
      console.log('Error: Missing playlist ID');
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Authentication error:', authError);
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Fetch playlist details from YouTube
    console.log(`Fetching playlist details for ID: ${playlistId}`);
    const playlist = await youtube.playlists.list({
      part: ['snippet'],
      id: [playlistId],
    });

    if (!playlist?.data?.items?.[0]) {
      console.log('Playlist not found');
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const playlistSnippet = playlist.data.items[0].snippet;
    console.log(`Found playlist: "${playlistSnippet.title}"`);
    
    // Fetch playlist items (videos)
    console.log('Fetching videos from playlist');
    const playlistItems = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: playlistId,
      maxResults: 50,
    });

    if (!playlistItems?.data?.items?.length) {
      console.log('Playlist has no videos');
      return NextResponse.json({ error: 'Playlist has no videos' }, { status: 404 });
    }
    console.log(`Found ${playlistItems.data.items.length} videos in playlist`);

    // Create course in Supabase
    console.log('Creating course in database');
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: playlistSnippet.title,
        description: playlistSnippet.description,
        thumbnail_url: playlistSnippet.thumbnails?.high?.url || 
                      playlistSnippet.thumbnails?.medium?.url || 
                      playlistSnippet.thumbnails?.default?.url,
      })
      .select()
      .single();

    if (courseError) {
      console.log('Error creating course:', courseError);
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }
    console.log(`Course created with ID: ${course.id}`);

    // Add videos to the course
    console.log('Processing videos for the course');
    const videos = await Promise.all(playlistItems.data.items.map(async (item, index) => {
      const videoId = item.contentDetails?.videoId;
      if (!videoId) {
        console.log(`Video at index ${index} has no ID, skipping`);
        return null;
      }

      // Get video duration
      console.log(`Fetching details for video ID: ${videoId}`);
      const videoDetails = await youtube.videos.list({
        part: ['contentDetails'],
        id: [videoId],
      });

      const duration = videoDetails.data.items?.[0]?.contentDetails?.duration || 'PT0S';
      const durationInSeconds = parseDuration(duration);

      return {
        course_id: course.id,
        title: item.snippet?.title || 'Untitled Video',
        description: item.snippet?.description || '',
        video_url: `https://www.youtube.com/watch?v=${videoId}`,
        duration: durationInSeconds,
      };
    }));

    const validVideos = videos.filter(Boolean);
    console.log(`Processed ${validVideos.length} valid videos out of ${videos.length} total`);

    if (validVideos.length > 0) {
      console.log('Adding videos to database');
      const { error: videosError } = await supabase
        .from('videos')
        .insert(validVideos);

      if (videosError) {
        console.log('Error adding videos to database:', videosError);
        return NextResponse.json({ error: videosError.message }, { status: 500 });
      }
      console.log('Videos successfully added to database');
    }

    console.log('Course and videos successfully added to library');
    return NextResponse.json({ 
      data: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnail_url,
        videos: validVideos,
      }
    });
  } catch (error) {
    console.error('Error adding course:', error);
    return NextResponse.json({ error: 'Failed to add course' }, { status: 500 });
  }
}

// Helper function to parse YouTube duration format to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  
  const hours = (match?.[1] || '').replace('H', '') || '0';
  const minutes = (match?.[2] || '').replace('M', '') || '0';
  const seconds = (match?.[3] || '').replace('S', '') || '0';
  
  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(seconds)
  );
}