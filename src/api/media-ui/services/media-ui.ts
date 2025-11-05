import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::scanned-file.scanned-file', ({ strapi }) => ({
  /**
   * Generate Photos HTML page
   */
  async generatePhotosHTML(): Promise<string> {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photo Library - Silver Media Library</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f7fa;
            color: #2c3e50;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
        }

        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .nav {
            background: white;
            padding: 1rem 2rem;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            gap: 1rem;
        }

        .nav a {
            padding: 0.5rem 1rem;
            text-decoration: none;
            color: #667eea;
            border-radius: 4px;
            transition: background 0.3s;
        }

        .nav a:hover {
            background: #f0f0f0;
        }

        .nav a.active {
            background: #667eea;
            color: white;
        }

        .controls {
            background: white;
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
        }

        .search-box {
            flex: 1;
            min-width: 250px;
        }

        .search-box input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 1rem;
        }

        .photo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .photo-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s, box-shadow 0.3s;
            cursor: pointer;
        }

        .photo-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .photo-img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            background: #f0f0f0;
        }

        .photo-info {
            padding: 1rem;
        }

        .photo-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .photo-meta {
            font-size: 0.875rem;
            color: #666;
        }

        .loading {
            text-align: center;
            padding: 3rem;
            color: #666;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            max-width: 90%;
            max-height: 90%;
            position: relative;
        }

        .modal-img {
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
        }

        .modal-close {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 2rem;
            color: white;
            cursor: pointer;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📷 Photo Library</h1>
        <p>Browse your photo collection</p>
    </div>

    <div class="nav">
        <a href="/api/media-ui/photos" class="active">Photos</a>
        <a href="/api/media-ui/music">Music</a>
        <a href="/api/media-ui/videos">Videos</a>
        <a href="/admin">Admin Panel</a>
    </div>

    <div class="controls">
        <div class="search-box">
            <input type="text" id="search" placeholder="Search photos...">
        </div>
    </div>

    <div class="photo-grid" id="photoGrid">
        <div class="loading">Loading photos...</div>
    </div>

    <div class="modal" id="photoModal">
        <div class="modal-close" onclick="closeModal()">×</div>
        <div class="modal-content">
            <img class="modal-img" id="modalImg" src="" alt="">
        </div>
    </div>

    <script>
        let photos = [];
        
        async function loadPhotos() {
            try {
                const response = await fetch('/api/media-ui/api/photos?limit=1000');
                const data = await response.json();
                photos = data.data;
                renderPhotos(photos);
            } catch (error) {
                document.getElementById('photoGrid').innerHTML = '<div class="loading">Error loading photos</div>';
                console.error('Error:', error);
            }
        }

        function renderPhotos(photosToRender) {
            const grid = document.getElementById('photoGrid');
            if (photosToRender.length === 0) {
                grid.innerHTML = '<div class="loading">No photos found</div>';
                return;
            }

            grid.innerHTML = photosToRender.map(photo => \`
                <div class="photo-card" onclick="viewPhoto(\${photo.id})">
                    <img class="photo-img" src="/api/media-ui/file/\${photo.id}" alt="\${photo.filename}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'200\\' height=\\'200\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' font-size=\\'20\\' fill=\\'%23999\\'%3ENo Preview%3C/text%3E%3C/svg%3E'">
                    <div class="photo-info">
                        <div class="photo-title">\${photo.filename}</div>
                        <div class="photo-meta">
                            \${photo.photoMetadata?.cameraMake || ''} \${photo.photoMetadata?.cameraModel || ''}
                            \${photo.photoMetadata?.width && photo.photoMetadata?.height ? '<br>' + photo.photoMetadata.width + 'x' + photo.photoMetadata.height : ''}
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        function viewPhoto(id) {
            const modal = document.getElementById('photoModal');
            const modalImg = document.getElementById('modalImg');
            modalImg.src = '/api/media-ui/file/' + id;
            modal.classList.add('active');
        }

        function closeModal() {
            const modal = document.getElementById('photoModal');
            modal.classList.remove('active');
        }

        document.getElementById('search').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = photos.filter(photo => 
                photo.filename.toLowerCase().includes(searchTerm) ||
                photo.path.toLowerCase().includes(searchTerm)
            );
            renderPhotos(filtered);
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });

        // Close modal on background click
        document.getElementById('photoModal').addEventListener('click', (e) => {
            if (e.target.id === 'photoModal') {
                closeModal();
            }
        });

        loadPhotos();
    </script>
</body>
</html>`;
  },

  /**
   * Generate Music HTML page
   */
  async generateMusicHTML(): Promise<string> {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Music Player - Silver Media Library</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
        }

        .header {
            padding: 2rem;
            text-align: center;
        }

        .header h1 {
            font-size: 3rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
        }

        .nav {
            background: rgba(0, 0, 0, 0.3);
            padding: 1rem 2rem;
            display: flex;
            gap: 1rem;
            justify-content: center;
        }

        .nav a {
            padding: 0.5rem 1rem;
            text-decoration: none;
            color: white;
            border-radius: 4px;
            transition: background 0.3s;
        }

        .nav a:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .nav a.active {
            background: rgba(255, 255, 255, 0.3);
        }

        .controls {
            padding: 1.5rem 2rem;
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
            max-width: 1400px;
            margin: 0 auto;
        }

        .search-box {
            flex: 1;
            min-width: 250px;
        }

        .search-box input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border-radius: 8px;
            font-size: 1rem;
        }

        .music-list {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 2rem 2rem;
        }

        .track-item {
            background: rgba(0, 0, 0, 0.3);
            padding: 1rem;
            margin-bottom: 0.5rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 1rem;
            cursor: pointer;
            transition: background 0.3s;
        }

        .track-item:hover {
            background: rgba(0, 0, 0, 0.5);
        }

        .track-number {
            font-weight: bold;
            min-width: 30px;
        }

        .track-info {
            flex: 1;
        }

        .track-title {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .track-meta {
            font-size: 0.875rem;
            opacity: 0.8;
        }

        .track-duration {
            min-width: 60px;
            text-align: right;
        }

        .player {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            padding: 1rem 2rem;
            display: none;
        }

        .player.active {
            display: block;
        }

        .player-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .player-info {
            flex: 1;
        }

        audio {
            width: 100%;
            max-width: 400px;
        }

        .loading {
            text-align: center;
            padding: 3rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎵 Music Player</h1>
        <p>Browse and play your music collection</p>
    </div>

    <div class="nav">
        <a href="/api/media-ui/photos">Photos</a>
        <a href="/api/media-ui/music" class="active">Music</a>
        <a href="/api/media-ui/videos">Videos</a>
        <a href="/admin">Admin Panel</a>
    </div>

    <div class="controls">
        <div class="search-box">
            <input type="text" id="search" placeholder="Search music...">
        </div>
    </div>

    <div class="music-list" id="musicList">
        <div class="loading">Loading music...</div>
    </div>

    <div class="player" id="player">
        <div class="player-controls">
            <div class="player-info" id="playerInfo">No track selected</div>
            <audio id="audioPlayer" controls></audio>
        </div>
    </div>

    <script>
        let tracks = [];
        let currentTrack = null;

        async function loadMusic() {
            try {
                const response = await fetch('/api/media-ui/api/music?limit=1000');
                const data = await response.json();
                tracks = data.data;
                renderTracks(tracks);
            } catch (error) {
                document.getElementById('musicList').innerHTML = '<div class="loading">Error loading music</div>';
                console.error('Error:', error);
            }
        }

        function renderTracks(tracksToRender) {
            const list = document.getElementById('musicList');
            if (tracksToRender.length === 0) {
                list.innerHTML = '<div class="loading">No tracks found</div>';
                return;
            }

            list.innerHTML = tracksToRender.map((track, index) => \`
                <div class="track-item" onclick="playTrack(\${track.id})">
                    <div class="track-number">\${index + 1}</div>
                    <div class="track-info">
                        <div class="track-title">\${track.musicMetadata?.title || track.filename}</div>
                        <div class="track-meta">
                            \${track.musicMetadata?.artist || 'Unknown Artist'} - \${track.musicMetadata?.album || 'Unknown Album'}
                        </div>
                    </div>
                    <div class="track-duration">
                        \${track.musicMetadata?.duration ? formatDuration(track.musicMetadata.duration) : ''}
                    </div>
                </div>
            \`).join('');
        }

        function playTrack(id) {
            currentTrack = tracks.find(t => t.id === id);
            if (!currentTrack) return;

            const player = document.getElementById('player');
            const audio = document.getElementById('audioPlayer');
            const info = document.getElementById('playerInfo');

            audio.src = '/api/media-ui/file/' + id;
            info.textContent = \`\${currentTrack.musicMetadata?.title || currentTrack.filename} - \${currentTrack.musicMetadata?.artist || 'Unknown Artist'}\`;
            player.classList.add('active');
            audio.play();
        }

        function formatDuration(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return \`\${mins}:\${secs.toString().padStart(2, '0')}\`;
        }

        document.getElementById('search').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = tracks.filter(track => 
                track.filename.toLowerCase().includes(searchTerm) ||
                (track.musicMetadata?.title && track.musicMetadata.title.toLowerCase().includes(searchTerm)) ||
                (track.musicMetadata?.artist && track.musicMetadata.artist.toLowerCase().includes(searchTerm)) ||
                (track.musicMetadata?.album && track.musicMetadata.album.toLowerCase().includes(searchTerm))
            );
            renderTracks(filtered);
        });

        loadMusic();
    </script>
</body>
</html>`;
  },

  /**
   * Generate Videos HTML page
   */
  async generateVideosHTML(): Promise<string> {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Player - Silver Media Library</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #0f0f0f;
            color: #e0e0e0;
        }

        .header {
            background: linear-gradient(135deg, #141e30 0%, #243b55 100%);
            padding: 2rem;
            text-align: center;
        }

        .header h1 {
            font-size: 3rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
        }

        .nav {
            background: #1a1a1a;
            padding: 1rem 2rem;
            display: flex;
            gap: 1rem;
            justify-content: center;
        }

        .nav a {
            padding: 0.5rem 1rem;
            text-decoration: none;
            color: #e0e0e0;
            border-radius: 4px;
            transition: background 0.3s;
        }

        .nav a:hover {
            background: #2a2a2a;
        }

        .nav a.active {
            background: #4a90e2;
            color: white;
        }

        .controls {
            background: #1a1a1a;
            padding: 1.5rem 2rem;
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
        }

        .search-box {
            flex: 1;
            min-width: 250px;
        }

        .search-box input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid #2a2a2a;
            background: #252525;
            color: #e0e0e0;
            border-radius: 8px;
            font-size: 1rem;
        }

        .video-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.5rem;
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .video-card {
            background: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            transition: transform 0.3s;
            cursor: pointer;
        }

        .video-card:hover {
            transform: translateY(-5px);
        }

        .video-thumbnail {
            width: 100%;
            height: 180px;
            background: #252525;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
        }

        .video-info {
            padding: 1rem;
        }

        .video-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .video-meta {
            font-size: 0.875rem;
            opacity: 0.7;
        }

        .loading {
            text-align: center;
            padding: 3rem;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            max-width: 90%;
            max-height: 90%;
            position: relative;
        }

        .modal-video {
            max-width: 100%;
            max-height: 90vh;
        }

        .modal-close {
            position: absolute;
            top: -40px;
            right: 0;
            font-size: 2rem;
            color: white;
            cursor: pointer;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎬 Video Player</h1>
        <p>Browse and watch your video collection</p>
    </div>

    <div class="nav">
        <a href="/api/media-ui/photos">Photos</a>
        <a href="/api/media-ui/music">Music</a>
        <a href="/api/media-ui/videos" class="active">Videos</a>
        <a href="/admin">Admin Panel</a>
    </div>

    <div class="controls">
        <div class="search-box">
            <input type="text" id="search" placeholder="Search videos...">
        </div>
    </div>

    <div class="video-grid" id="videoGrid">
        <div class="loading">Loading videos...</div>
    </div>

    <div class="modal" id="videoModal">
        <div class="modal-content">
            <div class="modal-close" onclick="closeModal()">×</div>
            <video class="modal-video" id="modalVideo" controls></video>
        </div>
    </div>

    <script>
        let videos = [];

        async function loadVideos() {
            try {
                const response = await fetch('/api/media-ui/api/videos?limit=1000');
                const data = await response.json();
                videos = data.data;
                renderVideos(videos);
            } catch (error) {
                document.getElementById('videoGrid').innerHTML = '<div class="loading">Error loading videos</div>';
                console.error('Error:', error);
            }
        }

        function renderVideos(videosToRender) {
            const grid = document.getElementById('videoGrid');
            if (videosToRender.length === 0) {
                grid.innerHTML = '<div class="loading">No videos found</div>';
                return;
            }

            grid.innerHTML = videosToRender.map(video => \`
                <div class="video-card" onclick="playVideo(\${video.id})">
                    <div class="video-thumbnail">🎬</div>
                    <div class="video-info">
                        <div class="video-title">\${video.filename}</div>
                        <div class="video-meta">
                            \${video.videoMetadata?.width && video.videoMetadata?.height ? video.videoMetadata.width + 'x' + video.videoMetadata.height : ''}
                            \${video.videoMetadata?.duration ? ' • ' + formatDuration(video.videoMetadata.duration) : ''}
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        function playVideo(id) {
            const modal = document.getElementById('videoModal');
            const video = document.getElementById('modalVideo');
            video.src = '/api/media-ui/file/' + id;
            modal.classList.add('active');
            video.play();
        }

        function closeModal() {
            const modal = document.getElementById('videoModal');
            const video = document.getElementById('modalVideo');
            video.pause();
            modal.classList.remove('active');
        }

        function formatDuration(seconds) {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            if (hours > 0) {
                return \`\${hours}:\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
            }
            return \`\${mins}:\${secs.toString().padStart(2, '0')}\`;
        }

        document.getElementById('search').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = videos.filter(video => 
                video.filename.toLowerCase().includes(searchTerm) ||
                video.path.toLowerCase().includes(searchTerm)
            );
            renderVideos(filtered);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });

        document.getElementById('videoModal').addEventListener('click', (e) => {
            if (e.target.id === 'videoModal') {
                closeModal();
            }
        });

        loadVideos();
    </script>
</body>
</html>`;
  },
}));
