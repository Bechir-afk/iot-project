/**
 * BookHaven - Main JavaScript
 * Handles general website functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  // Add any JavaScript functionality needed for the website here

  // Example: Smooth scrolling for anchor links
  const links = document.querySelectorAll('a[href^="#"]');
  for (const link of links) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Example: Update cart count
  const cartCountElement = document.querySelector('.cart-count');
  let cartCount = parseInt(cartCountElement.textContent) || 0;

  // Function to update cart count
  function updateCartCount(count) {
    cartCount += count;
    cartCountElement.textContent = cartCount;
  }

  // Setup horizontal scrolling for new arrivals
  const scrollLeftBtn = document.querySelector('.scroll-left');
  const scrollRightBtn = document.querySelector('.scroll-right');
  const newArrivalsSlider = document.querySelector('.new-arrivals-slider');
  
  if (scrollLeftBtn && scrollRightBtn && newArrivalsSlider) {
    const scrollAmount = 200;
    
    scrollLeftBtn.addEventListener('click', () => {
      newArrivalsSlider.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    });
    
    scrollRightBtn.addEventListener('click', () => {
      newArrivalsSlider.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    });
  }
  
  // Add to cart buttons functionality
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function() {
      const id = this.dataset.id;
      // Get parent card
      const card = this.closest('.product-card');
      if (!card) return;
      
      // Get product details from card
      const title = card.querySelector('.card-title').textContent;
      const authorElement = card.querySelector('.text-muted');
      const author = authorElement ? authorElement.textContent : 'Unknown Author';
      
      // Extract price
      const priceElement = card.querySelector('.fw-bold');
      const priceText = priceElement ? priceElement.textContent.replace(/[^0-9.]/g, '') : '0';
      const price = parseFloat(priceText);
      
      // Get image URL
      const imageElement = card.querySelector('img');
      const imageUrl = imageElement ? imageElement.src : '';
      
      // Add to cart if it exists in the global scope
      if (typeof window.bookhavenCart !== 'undefined') {
        window.bookhavenCart.addItem(id, title, author, price, imageUrl);
        
        // Show feedback
        this.innerHTML = '<i class="bi bi-check"></i>';
        this.classList.remove('btn-primary');
        this.classList.add('btn-success');
        
        setTimeout(() => {
          this.innerHTML = '<i class="bi bi-cart-plus"></i>';
          this.classList.remove('btn-success');
          this.classList.add('btn-primary');
        }, 1500);
      }
    });
  });
  
  // Newsletter form validation
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const emailInput = this.querySelector('input[type="email"]');
      
      if (!emailInput.value || !emailInput.value.includes('@')) {
        // Show error
        if (!document.querySelector('.newsletter-error')) {
          const errorDiv = document.createElement('div');
          errorDiv.classList.add('alert', 'alert-danger', 'mt-2', 'newsletter-error');
          errorDiv.textContent = 'Please enter a valid email address';
          this.appendChild(errorDiv);
        }
      } else {
        // Success - would normally send to server
        this.innerHTML = `
          <div class="alert alert-success">
            <i class="bi bi-check-circle-fill me-2"></i>
            Thank you for subscribing! Please check your email to confirm.
          </div>
        `;
      }
    });
  }
});