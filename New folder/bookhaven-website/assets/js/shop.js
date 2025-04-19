/**
 * BookHaven Shop Page Functionality
 * Handles all sorting and filtering for the shop page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get key elements
    const sortSelect = document.getElementById('sort');
    const productsContainer = document.getElementById('products-container');
    const priceRangeInput = document.getElementById('priceRange');
    const priceValueDisplay = document.getElementById('priceValue');
    const categoryCheckboxes = document.querySelectorAll('.form-check-input[type="checkbox"][id^="fiction"], .form-check-input[type="checkbox"][id^="non-fiction"], .form-check-input[type="checkbox"][id^="mystery"], .form-check-input[type="checkbox"][id^="scifi"], .form-check-input[type="checkbox"][id^="romance"], .form-check-input[type="checkbox"][id^="poetry"]');
    const authorCheckboxes = document.querySelectorAll('.form-check-input[type="checkbox"][id^="author"]');
    const ratingRadios = document.querySelectorAll('.form-check-input[type="radio"][id^="rating"]');
    const products = Array.from(productsContainer.querySelectorAll('.col-6.col-md-4'));

    // Cache initial product order for reset
    const initialProductOrder = products.slice();
    
    // Initialize variables to track current filters
    let currentPriceRange = priceRangeInput ? parseInt(priceRangeInput.value) : 50;
    let selectedCategories = Array.from(categoryCheckboxes)
                                .filter(cb => cb.checked)
                                .map(cb => cb.id);
    let selectedAuthors = [];
    let minimumRating = 3.0; // Default to 3-star minimum
    
    // Setup event listeners
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFiltersAndSort);
    }
    
    if (priceRangeInput) {
        priceRangeInput.addEventListener('input', function() {
            currentPriceRange = parseInt(this.value);
            if (priceValueDisplay) {
                priceValueDisplay.textContent = currentPriceRange + ' D';
            }
            applyFiltersAndSort();
        });
    }
    
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            selectedCategories = Array.from(categoryCheckboxes)
                                    .filter(cb => cb.checked)
                                    .map(cb => cb.id);
            applyFiltersAndSort();
        });
    });
    
    authorCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            selectedAuthors = Array.from(authorCheckboxes)
                                .filter(cb => cb.checked)
                                .map(cb => cb.id.replace('author', ''));
            applyFiltersAndSort();
        });
    });
    
    ratingRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                minimumRating = parseFloat(this.id.replace('rating', ''));
                applyFiltersAndSort();
            }
        });
    });
    
    // Main function to apply all filters and sorting
    function applyFiltersAndSort() {
        // First filter products
        const filteredProducts = products.filter(product => {
            // Get product data
            const price = parseFloat(product.dataset.price);
            const category = product.dataset.category;
            const rating = parseFloat(product.dataset.rating);
            const authorElement = product.querySelector('.text-muted.mb-1');
            const author = authorElement ? authorElement.textContent.trim() : '';
            
            // Apply price filter
            if (price > currentPriceRange) return false;
            
            // Apply category filter
            if (selectedCategories.length > 0 && !selectedCategories.includes(category)) return false;
            
            // Apply author filter (if any selected)
            if (selectedAuthors.length > 0) {
                const authorMatch = selectedAuthors.some(authorId => {
                    const authorName = document.querySelector(`label[for="author${authorId}"]`).textContent.trim();
                    return author.includes(authorName.split(' (')[0]);
                });
                if (!authorMatch) return false;
            }
            
            // Apply rating filter
            if (rating < minimumRating) return false;
            
            // Product passed all filters
            return true;
        });
        
        // Then sort filtered products
        const sortOption = sortSelect ? sortSelect.value : 'Popularity';
        filteredProducts.sort((a, b) => {
            switch(sortOption) {
                case 'Price: Low to High':
                    return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
                
                case 'Price: High to Low':
                    return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
                
                case 'Rating':
                    return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
                    
                case 'Newest Arrivals':
                    return new Date(b.dataset.date) - new Date(a.dataset.date);
                    
                default: // Popularity - use rating as proxy
                    return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
            }
        });
        
        // Remove all products from display
        products.forEach(product => {
            product.style.display = 'none';
        });
        
        // Add filtered and sorted products back
        filteredProducts.forEach(product => {
            product.style.display = '';
            productsContainer.appendChild(product);
        });
        
        // Update product count display
        const countDisplay = document.querySelector('.d-flex .me-2');
        if (countDisplay) {
            countDisplay.textContent = `Showing ${filteredProducts.length} of ${products.length} books`;
        }
    }
    
    // Add functionality to grid/list view buttons
    const gridViewBtn = document.querySelector('.btn-group .btn:first-child');
    const listViewBtn = document.querySelector('.btn-group .btn:last-child');
    
    if (gridViewBtn && listViewBtn) {
        gridViewBtn.addEventListener('click', function() {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            products.forEach(product => {
                product.classList.remove('list-view');
                product.classList.remove('col-12');
                product.classList.add('col-6');
                product.classList.add('col-md-4');
            });
        });
        
        listViewBtn.addEventListener('click', function() {
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            products.forEach(product => {
                product.classList.add('list-view');
                product.classList.add('col-12');
                product.classList.remove('col-6');
                product.classList.remove('col-md-4');
                
                // Add list view styling to product cards
                const card = product.querySelector('.card');
                if (card && !card.classList.contains('list-view-card')) {
                    card.classList.add('list-view-card');
                    card.classList.add('flex-row');
                    
                    const img = card.querySelector('.card-img-top');
                    if (img) {
                        img.style.maxWidth = '200px';
                        img.style.height = 'auto';
                        img.style.objectFit = 'cover';
                    }
                }
            });
        });
    }
    
    // Add CSS styles for list view
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .list-view-card {
            display: flex !important;
            flex-direction: row !important;
        }
        
        .list-view-card .card-img-top {
            max-width: 150px;
            height: 100%;
            object-fit: cover;
        }
        
        .list-view-card .card-body {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        
        @media (max-width: 768px) {
            .list-view-card {
                flex-direction: column !important;
            }
            .list-view-card .card-img-top {
                max-width: 100%;
            }
        }
    `;
    document.head.appendChild(styleElement);
    
    // Initialize filters and sorting on page load
    applyFiltersAndSort();
    
    // Price range value display initialization
    if (priceRangeInput && priceValueDisplay) {
        priceValueDisplay.textContent = priceRangeInput.value + ' D';
    }
});