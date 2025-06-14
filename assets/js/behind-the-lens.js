document.addEventListener('DOMContentLoaded', function () {
    const icons = document.querySelectorAll('.behind-the-lens__icon');

    icons.forEach(icon => {
        icon.addEventListener('click', function () {
            // Adjust the parent selector based on the actual HTML structure
            // This assumes the icon and content are siblings or the content is a sibling of the icon's parent
            const contentWrapper = icon.closest('.video-grid__thumbnail-wrapper, .image-item, .cinemagraph-item');
            if (contentWrapper) {
                const content = contentWrapper.querySelector('.behind-the-lens__content');
                if (content) {
                    if (content.style.display === 'none' || content.style.display === '') {
                        content.style.display = 'block';
                    } else {
                        content.style.display = 'none';
                    }
                }
            }
        });
    });
});
