async function loadVideos() {
    const container = document.getElementById('videos-container');
    if (!container) {
        console.error("Could not find element videos-container")
        return
    }
    try {
        const response = await fetch('data/videos.json');
        if (!response.ok) throw new Error('Failed to fetch data/videos.json');

        const videos = await response.json();

        videos.sort((a, b) => new Date(b.date) - new Date(a.date));

        videos.forEach(video => {
            try {

            
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';

            videoItem.innerHTML = `
            <div class="video-item">
                <a href="watch.html?video=${encodeURIComponent(video.url)}&title=${encodeURIComponent(video.title)}&location=${encodeURIComponent(video.location)}" class="video-link">
                <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
                <div class="video-content">
                    <h3 class="video-title">${video.title}</h3>
                    <p class="video-location">${video.location} (${video.date})</p>
                    </div>
                </a>
            </div>
                `;

            try {
                container.appendChild(videoItem);
            } catch (error) {
                console.error('Error appending video item:', error);
            }
            } catch (error) {
                console.error('Error inside video loop:', error);
            }
        });
    } catch (error) {
        console.error('Error loading videos:', error);
        container.innerHTML = '<p class="text-center text-gray-400">Failed to load videos. Please try again later.</p>';
    }
}


