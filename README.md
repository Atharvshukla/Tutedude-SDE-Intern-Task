# 📺 Smart Video Learning Platform
This project is a submission for the **SDE Intern Assignment TuteDude (Deadline: April 13, 2025)**. It provides an intelligent system that **accurately tracks unique video progress**, addressing real-world shortcomings of typical online learning platforms.

---

### 🧠 Problem It Solves

Traditional video players mark a lecture as “watched” just because it reaches the end. This doesn't reflect actual learning. Our solution ensures:

- ✅ Only **new, unique parts** of the video are considered as progress  
- ⛔ Skipping or re-watching doesn’t unfairly boost progress  
- 💾 Progress is saved and restored across sessions  

---
<h3>📋 ScreenShots</h3>

<table>
  <tr>
    <td><strong>Landing Page</strong></td>
    <td><strong>Login Page</strong></td>
  </tr>
  <tr>
    <td><img src="" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/16ca2d33-7ff9-4d83-9b1d-3a77765f8224" width="250"/></td>
  </tr>
  <tr>
    <td><strong>Courses</strong></td>
    <td><strong>Video-Lectures</strong></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/d9f57f4d-a3c6-4fca-8806-7d60ee3e220c" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/11ed077b-55e1-4831-aef6-9d7b7335b81a" width="250"/></td>
  </tr>
  <tr>
    <td><strong>VIdeoPlayer</strong></td>
     <td><strong>Add New Courses</strong></td>
    <td></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/ad4f6d62-a91f-4771-ba6e-4dac9a1536ea"
 width="250"/></td>
 <td><img src="![image](https://github.com/user-attachments/assets/0d9e00fe-4ad4-4da2-bb7f-6343d7bbb7b1)
"
 width="250"/></td>
  </tr>
</table>
---
<h3>📋 Progress Analysis Page</h3>
<table>
  <tr>
    <td><strong>Analytics Dashboard</strong></td>
    <td><strong>Courses</strong></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/3484e84c-bcf8-4fb3-8360-14ec4c1b7574" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/3484e84c-bcf8-4fb3-8360-14ec4c1b7574" width="250"/></td>
  </tr>
  <tr>
    <td><strong>Video Basis</strong></td>
    <td><strong>Skill Basis</strong></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/514161f5-ffbc-4092-9e93-6b4e243f54fe" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/36eb0311-9d49-4bf4-bd20-4aab1a0c8d17" width="250"/></td>
  </tr>
  <tr>
    <td><strong>VIdeoPlayer</strong></td>
     <td><strong>Add New Courses</strong></td>
    <td></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/ad4f6d62-a91f-4771-ba6e-4dac9a1536ea"
 width="250"/></td>
 <td><img src="![image](https://github.com/user-attachments/assets/0d9e00fe-4ad4-4da2-bb7f-6343d7bbb7b1)
"
 width="250"/></td>
  </tr>
</table>






---
## 🚀 Features

### 🔹 Core Pages
- **HomePage**: Landing page with platform overview and call-to-actions.
- **VideoLibraryPage**: Displays hardcoded JavaScript playlists with thumbnails and descriptions.
- **PlaylistPage**: Displays videos of a selected playlist with title, duration, and watch links.
- **VideoPage**: Plays a selected video using EnhancedVideoPlayer with detailed tracking.
- **AnalyticsPage**: Shows progress across all playlists using visual charts and stats.
- - **Add New Courses **: User's personalized dashboard with YouTube search, playlist addition, and navigation.(beta as its my own input in the assignment(not part of assingment))

### 🔹 EnhancedVideoPlayer
- Tracks progress with intervals and watched duration.
- Saves and resumes playback from last watched point.
- Syncs progress to Supabase if user is logged in, otherwise uses localStorage.
- Handles buffering, playing, pausing, and seeking with intelligent tracking.
- Merges intervals and calculates progress dynamically.

---

## 🧠 Architecture

### 📦 Frontend (Next + Supabase)
- **State Management**: useState, useEffect
- **Routing**: Next Router
- **Video Player Logic**: Custom hooks for progress and playback
- **UI Components**: Interactive dashboard, charts, loading spinners

### 🗃️ Backend API Design
| Endpoint                      | Method | Description |
|------------------------------|--------|-------------|
| `/api/video-library`         | GET    | Return all available playlists |
| `/api/playlists/:playlistId`| GET    | Return playlist details |
| `/api/videos/:videoId`      | GET    | Return video details |
| `/api/progress`             | GET    | Return all video progress for user |
| `/api/progress/:videoId`    | GET    | Return progress for specific video |
| `/api/progress/:videoId`    | POST   | Update progress |
| `/api/analytics`            | GET    | Return analytics for user |

### 🧾 Supabase Tables
- **users**: Auth table managed by Supabase
- **profiles**: Stores name, email, user ID
- **playlists**: Contains playlist metadata
- **videos**: Stores video info, URL, duration
- **progress**: Stores progress intervals, watched seconds, percentage

### 🔐 Supabase RLS Policies
- Profiles: Read/update own
- Courses: Public read
- Videos: Public read
- Progress: Own insert/update/read only

---

## 🧑‍💻 Project Structure

```bash
📁 client/
 ┣ 📂 pages/
 ┃ ┣ HomePage.jsx
 ┃ ┣ DashboardPage.jsx
 ┃ ┣ VideoLibraryPage.jsx
 ┃ ┣ PlaylistPage.jsx
 ┃ ┣ VideoPage.jsx
 ┃ ┗ AnalyticsPage.jsx
 ┣ 📂 components/
 ┃ ┗ EnhancedVideoPlayer.jsx
 ┣ 📂 utils/
 ┃ ┗ supabaseClient.js
 ┣ 📂 services/
 ┃ ┗ api.js
 ┗ App.jsx
📁 server/
 ┗ 📂 routes/
   ┣ playlists.js
   ┣ videos.js
   ┣ progress.js
   ┣ analytics.js
   ┗ youtube.js
📁 supabase/
 ┗ init.sql (RLS + Tables setup)
```
---

## 📦 **Installation & Setup**
1️⃣ **Clone the repository:**
```sh
git clone https://github.com/your-username/react-native-todo-list-app.git
cd react-native-todo-list-app
```

2️⃣ **Install dependencies:**
```sh
npm install
# OR
yarn install
```

3️⃣ **Start the Expo development server:**
```sh
npm run dev
```
---
# 📈 Analytics Breakdown

## Metrics Tracked

- **Overall Watch Time**:  
  Total seconds watched across all videos.

- **Progress Per Playlist**:  
  Visualized using a progress bar based on total video duration watched.

- **Completed Videos**:  
  Videos marked as complete when `>= 90%` of their duration has been watched.

##  Progress Tracking:
- For each video, we track how much of it the user has watched using either:
- Supabase for authenticated users (stores total_watched_seconds and progress_percentage)
- localStorage as a fallback for unauthenticated users
## Per-Video and Per-Playlist Analytics:
## Videos are marked completed when watched up to 90% or more.
- Each playlist contains metadata like:
  -- completedVideos
  -- watchedDuration
  -- overallProgress percentage
## Dashboard Overview:
- Displays individual playlist progress with progress bars
- Calculates and shows total watch time and overall completion percentage
- Offers visual insights using Chart.js components like Bar, Line, Radar, and Doughnut charts

## Charts for Visualization

- **Bar Chart**: Playlist progress.
- **Doughnut Chart**: Completed vs In-progress videos.
- **Line Chart**: Watch progress over time.
- **Radar Chart**: Skill coverage (conceptual/topic-wise).

---

# 🧪 Video Progress Handling

## Progress Tracking Logic

- **watchedIntervals**:  
  Stores video watched time segments.
  ```js
  watchedIntervals = [
    { start: 10, end: 50 },
    { start: 45, end: 90 },
    
  ]


- progressPercentage:
Calculated based on unique time covered (after merging intervals) over total video duration.
- totalWatchedSeconds:
Sum of all unique watched durations (after merging).
---
# Merging Algorithm (Simplified)
```
const mergeIntervals = (intervals) => {
  intervals.sort((a, b) => a.start - b.start);
  const result = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    if (last.end >= intervals[i].start) {
      last.end = Math.max(last.end, intervals[i].end);
    } else {
      result.push(intervals[i]);
    }
  }
  return result;
}

```
# 📦 YouTube API Integration

Features

- Search Playlists
Use query strings to search for YouTube playlists.
- Fetch Playlist Details
Retrieve metadata like title, channel name, total videos, etc.
- Fetch Video Items from Playlist
Get list of video IDs, titles, durations, thumbnails, etc.
- Store in Supabase
Save as course objects including playlist info and associated videos.
```
// Example: Storing fetched data into Supabase
const storePlaylistToSupabase = async (playlistData, videos) => {
  await supabase.from('courses').insert([
    {
      title: playlistData.title,
      channel: playlistData.channelTitle,
      totalVideos: videos.length,
      videoItems: videos,
    }
  ]);
}

```


## 🐙💻 **Source Control Graph (Wednesday 5th March)**
![image](https://github.com/user-attachments/assets/6e4bdfd6-fbf3-45b0-9faf-3118bd3d46ff)


---
