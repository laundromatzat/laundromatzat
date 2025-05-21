(function() {
    let searchData = [];
    let idx;

    async function initSearch() {
        try {
            const response = await fetch('/search-index.json');
            if (!response.ok) {
                console.error('Failed to load search index:', response.statusText);
                document.getElementById('searchResults').innerHTML = '<p>Error loading search index. Please try again later.</p>';
                return;
            }
            searchData = await response.json();

            // Create a map for quick lookup of full documents by ID
            const documentsMap = new Map(searchData.map(doc => [doc.id, doc]));

            idx = lunr(function () {
                this.ref('id');
                this.field('title', { boost: 10 });
                this.field('description');
                this.field('location');
                this.field('date');
                this.field('type');

                searchData.forEach(function (doc) {
                    this.add(doc);
                }, this);
            });

            const searchInput = document.getElementById('searchInput');
            const searchResultsContainer = document.getElementById('searchResults');

            if (!searchInput || !searchResultsContainer) {
                console.error('Search input or results container not found.');
                return;
            }
            
            // Initial message based on content/search.md
            if (searchResultsContainer.innerHTML.trim() === '<p>Search results will appear here.</p>') {
                 // Keep it, or clear it if you prefer an empty state until first search
            }

            // Function to perform search and display results
            function executeSearch(query) {
                searchResultsContainer.innerHTML = ''; // Clear previous results

                if (query.length === 0) {
                    searchResultsContainer.innerHTML = '<p>Search results will appear here.</p>';
                    return;
                }

                if (!idx) {
                    console.error("Lunr index not initialized yet.");
                    searchResultsContainer.innerHTML = '<p>Search is not ready yet. Please wait a moment and try again.</p>';
                    return;
                }

                const results = idx.search(query);

                if (results.length > 0) {
                    const ul = document.createElement('ul');
                    results.forEach(function (result) {
                        const doc = documentsMap.get(result.ref);
                        if (doc) {
                            const li = document.createElement('li');
                            let dateString = '';
                            if (doc.date) {
                                try {
                                    dateString = new Date(doc.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                                } catch (e) {
                                    console.warn("Could not parse date:", doc.date, e);
                                    dateString = doc.date; // show original if parsing fails
                                }
                            }
                            li.innerHTML = `
                                <h3><a href="${doc.url}">${doc.title} (${doc.type})</a></h3>
                                <p><strong>Location:</strong> ${doc.location || 'N/A'}</p>
                                <p><strong>Date:</strong> ${dateString || 'N/A'}</p>
                                <p>${doc.description || 'No description available.'}</p>
                            `;
                            ul.appendChild(li);
                        }
                    });
                    searchResultsContainer.appendChild(ul);
                } else {
                    searchResultsContainer.innerHTML = '<p>No results found for "' + escapeHTML(query) + '".</p>';
                }
            }

            searchInput.addEventListener('input', function (event) {
                const query = event.target.value.trim();
                executeSearch(query);
            });

            // Check for URL query parameter
            const urlParams = new URLSearchParams(window.location.search);
            const queryFromUrl = urlParams.get('q');

            if (queryFromUrl) {
                searchInput.value = queryFromUrl;
                executeSearch(queryFromUrl); // Ensure idx is available
            }

        } catch (error) {
            console.error('Error initializing search:', error);
            const searchResultsContainer = document.getElementById('searchResults');
            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = '<p>There was an error setting up the search functionality.</p>';
            }
        }
    }

    // Helper function to escape HTML to prevent XSS
    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, function (match) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    }

    // Initialize search when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch(); // DOMContentLoaded has already fired
    }

})();
