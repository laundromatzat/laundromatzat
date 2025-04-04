// assets/js/main.js

// --- Core Initializer ---
// Runs on initial load and after HTMX swaps to setup dynamic elements
function initializePageContent() {
  console.log("Initializing page content from main.js..."); // Debug log
  updateActiveNavButton(); // Always update nav highlight
  initImageGridMasonry(); // Setup Masonry layout IF an image grid exists
  initCinemagraphInteractions(); // Setup hover/click IF cinemagraphs exist
}

// --- Navigation ---
// Updates the visual highlight on the current navigation button
function updateActiveNavButton() {
  const navButtons = document.querySelectorAll('.nav-button');
  navButtons.forEach(button => button.classList.remove('active'));

  const currentPath = window.location.pathname;
  let targetButton = null;

  // Handle trailing slash consistency
  const normalizedPath = currentPath.endsWith('/') ? currentPath : currentPath + '/';
  const homePaths = ['/', '/index.html', '']; // Add empty string for root case

  if (homePaths.includes(currentPath) || normalizedPath === '/') {
      targetButton = document.querySelector('.nav-button[data-nav-section="/"]');
  } else {
     // Match base paths like /videos/, /cinemagraphs/, /images/
     navButtons.forEach(button => {
         const section = button.getAttribute('data-nav-section');
         // Ensure section has trailing slash for comparison if it's not root
         const normalizedSection = (section && section !== '/') ? (section.endsWith('/') ? section : section + '/') : section;

         if (section && section !== '/' && normalizedPath.startsWith(normalizedSection)) {
             targetButton = button;
         } else if (section === currentPath) { // Exact match for paths without trailing slash like /about
             targetButton = button;
         }
     });
  }

  if (targetButton) {
    targetButton.classList.add('active');
    console.log("Active nav set to:", targetButton.textContent); // Debug log
  } else {
    console.log("No active nav button found for path:", currentPath); // Debug log
  }
}

// --- Masonry for Image Grid ---
// Initializes Masonry layout for elements with the 'image-grid' class
function initImageGridMasonry() {
  const imageGrids = document.querySelectorAll('.image-grid');
  if (!imageGrids.length) {
      // console.log("No image grid found for Masonry."); // Optional debug log
      return;
  }

  // Check if Masonry and imagesLoaded are available
  if (typeof Masonry === 'undefined' || typeof imagesLoaded === 'undefined') {
      console.warn('Masonry or imagesLoaded script not found. Cannot initialize image grid layout. Make sure they are included in baseof.html for the relevant pages.');
      return;
  }

  console.log("Initializing Masonry for", imageGrids.length, "grid(s)."); // Debug log
  imageGrids.forEach(grid => {
    // Use imagesLoaded to ensure images are loaded before calculating layout
    imagesLoaded(grid, function() {
      // Initialize Masonry after images are loaded
      const msnry = new Masonry(grid, {
        itemSelector: '.image-item', // Selector for grid items
        percentPosition: true,
        // columnWidth might need adjustment based on your grid structure/CSS
        // columnWidth: '.image-item', // Example: if items have consistent width
        // gutter: 10 // Example: space between items
      });
       console.log("Masonry layout applied to grid:", grid); // Debug log
    });
  });
}

// --- Cinemagraph Interactions ---
// Adds hover-to-play and click-to-fullscreen for cinemagraphs
function initCinemagraphInteractions() {
  const cinemagraphItems = document.querySelectorAll('.cinemagraph-item');
  if (!cinemagraphItems.length) {
      // console.log("No cinemagraph items found."); // Optional debug log
      return;
  }
  console.log("Initializing interactions for", cinemagraphItems.length, "cinemagraph(s)."); // Debug log

  cinemagraphItems.forEach(item => {
    const video = item.querySelector('video');
    if (!video) return;

    // Play on Hover (Mouse Enter)
    item.addEventListener('mouseenter', () => {
       const playPromise = video.play();
       if (playPromise !== undefined) {
           playPromise.catch(error => {
               // Autoplay was prevented - common browser policy
               console.log("Video play prevented on hover:", error);
           });
       }
    });

    // Pause on Hover (Mouse Leave)
    item.addEventListener('mouseleave', () => {
      video.pause();
      // video.currentTime = 0; // Optional: Reset video to start on mouse leave
    });

    // Fullscreen on Click (Consider accessibility alternatives for non-mouse users)
    item.addEventListener('click', () => {
      console.log("Attempting fullscreen for:", video.src); // Debug log
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.webkitRequestFullscreen) { /* Safari */
        video.webkitRequestFullscreen();
      } else if (video.msRequestFullscreen) { /* IE11 */
        video.msRequestFullscreen();
      } else {
          console.log("Fullscreen API not supported on this video element.");
      }
    });

    // Add loadedmetadata listener if you need to dynamically set classes (e.g., portrait/landscape)
    // video.addEventListener('loadedmetadata', () => {
    //     // Example: Set aspect ratio class (adjust if needed)
    //     if (video.videoWidth && video.videoHeight) {
    //         item.classList.remove('portrait', 'landscape');
    //         item.classList.add(video.videoHeight > video.videoWidth ? 'portrait' : 'landscape');
    //     }
    // });
  });
}