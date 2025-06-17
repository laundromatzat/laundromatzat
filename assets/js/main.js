
// assets/js/main.js

function initializePageContent() {
    const videoGrid = document.getElementById('video-grid-container');
    const cinemagraphGrid = document.getElementById('cinemagraph-grid-container');
    const videoPopup = document.getElementById('video-popup');
    const btlPopup = document.getElementById('btl-popup');
    const videoPlayer = videoPopup ? videoPopup.querySelector('.video-popup__player') : null;
    const videoCloseButton = videoPopup ? videoPopup.querySelector('.video-popup__close') : null;
    const btlCloseButton = btlPopup ? btlPopup.querySelector('.btl-popup__close') : null;

    function openVideoPopup(videoUrl) {
        if (!videoPopup || !videoPlayer) return;
        videoPlayer.src = videoUrl;
        videoPopup.classList.add('show');
        videoPlayer.play();
    }

    function closeVideoPopup() {
        if (!videoPopup || !videoPlayer) return;
        videoPopup.classList.remove('show');
        videoPlayer.pause();
        videoPlayer.src = '';
    }

    function openBtlPopup(content) {
        if (!btlPopup) return;
        const btlContent = btlPopup.querySelector('.btl-popup__content');
        if(btlContent) {
            btlContent.innerHTML = content;
            btlPopup.classList.add('show');
        }
    }

    function closeBtlPopup() {
        if (!btlPopup) return;
        btlPopup.classList.remove('show');
    }

    if (videoGrid) {
        videoGrid.addEventListener('click', (event) => {
            const item = event.target.closest('.video-grid__item');
            if (!item) return;

            if (event.target.classList.contains('behind-the-lens__icon')) {
                event.stopPropagation(); // Prevent the video player from opening
                const content = item.querySelector('.behind-the-lens__content');
                if (content) {
                    openBtlPopup(content.innerHTML);
                }
                return;
            }
            
            const videoUrl = item.dataset.videoUrl;
            if (videoUrl) {
                openVideoPopup(videoUrl);
            }
        });
    }

    if (cinemagraphGrid) {
        cinemagraphGrid.addEventListener('click', (event) => {
            const item = event.target.closest('.cinemagraph-item');
            if (item && item.dataset.videoUrl) {
                openVideoPopup(item.dataset.videoUrl);
            }
        });
    }

    if (videoCloseButton) {
        videoCloseButton.addEventListener('click', closeVideoPopup);
    }
    
    if(btlCloseButton) {
        btlCloseButton.addEventListener('click', closeBtlPopup);
    }

    if (videoPopup) {
        videoPopup.addEventListener('click', (event) => {
            if (event.target === videoPopup) {
                closeVideoPopup();
            }
        });
    }
    
    if (btlPopup) {
        btlPopup.addEventListener('click', (event) => {
            if (event.target === btlPopup) {
                closeBtlPopup();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initializePageContent);
document.addEventListener('htmx:afterSwap', initializePageContent);
