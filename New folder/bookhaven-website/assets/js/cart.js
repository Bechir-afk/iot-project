/**
 * BookHaven Cart Functionality
 * Manages the shopping cart across the website using localStorage
 */

// Cart class to handle all cart operations
class ShoppingCart {
    constructor() {
      this.cartItems = [];
      this.init();
    }
    
    // Initialize cart from localStorage
    init() {
      const savedCart = localStorage.getItem('bookhavenCart');
      if (savedCart) {
        try {
          this.cartItems = JSON.parse(savedCart);
        } catch (e) {
          console.error('Error parsing cart data:', e);
          this.cartItems = [];
        }
      }
      this.updateCartCounter();
    }
    
    // Save cart to localStorage
    saveCart() {
      try {
        localStorage.setItem('bookhavenCart', JSON.stringify(this.cartItems));
      } catch (e) {
        console.error('Error saving cart data:', e);
      }
      this.updateCartCounter();
    }
    
    // Add item to cart
    addItem(id, title, author, price, imageUrl) {
      // Check if item already exists in cart
      const existingItem = this.cartItems.find(item => item.id === id);
      
      if (existingItem) {
        // Increase quantity if already in cart
        if (existingItem.quantity < 10) {
          existingItem.quantity++;
        }
      } else {
        // Add new item
        this.cartItems.push({
          id: id,
          title: title,
          author: author,
          price: parseFloat(price),
          imageUrl: imageUrl,
          quantity: 1
        });
      }
      
      this.saveCart();
      return this.cartItems.length;
    }
    
    // Remove item from cart
    removeItem(id) {
      this.cartItems = this.cartItems.filter(item => item.id !== id);
      this.saveCart();
    }
    
    // Update item quantity
    updateQuantity(id, quantity) {
      const itemIndex = this.cartItems.findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        // Ensure quantity is within valid range
        quantity = Math.min(Math.max(1, quantity), 10);
        
        this.cartItems[itemIndex].quantity = quantity;
        this.saveCart();
      }
      return this.getSubtotal();
    }
    
    // Clear all items from cart
    clearCart() {
      this.cartItems = [];
      this.saveCart();
    }
    
    // Calculate subtotal
    getSubtotal() {
      return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    // Calculate tax
    getTax(taxRate = 0.05) {
      return this.getSubtotal() * taxRate;
    }
    
    // Calculate total
    getTotal(shippingCost = 5) {
      return this.getSubtotal() + this.getTax() + shippingCost;
    }
    
    // Get number of items in cart
    getItemCount() {
      return this.cartItems.length;
    }
    
    // Update cart counter badges
    updateCartCounter() {
      const cartCountElements = document.querySelectorAll('.cart-count');
      const itemCount = this.getItemCount();
      
      cartCountElements.forEach(element => {
        element.textContent = itemCount;
        // Only hide if zero and element has d-none class
        if (itemCount > 0) {
          element.classList.remove('d-none');
        } else if (element.classList.contains('d-none')) {
          element.classList.add('d-none');
        }
      });
    }
    
    // Render cart items in the cart page
    renderCartPage() {
      // Fixed selector to target the correct card body
      const cartItemsContainer = document.querySelector('.card-body');
      const emptyCartMessage = document.getElementById('empty-cart');
      const subtotalElement = document.getElementById('subtotal');
      const taxElement = document.getElementById('tax');
      const totalElement = document.getElementById('total');
      const cartCountDisplay = document.getElementById('cart-items-count');
      
      if (!cartItemsContainer) return; // Not on cart page
      
      // Clear existing cart items
      const existingItems = cartItemsContainer.querySelectorAll('.cart-item');
      existingItems.forEach(item => item.remove());
      
      // Clear existing hr elements too
      const existingHrs = cartItemsContainer.querySelectorAll('hr');
      existingHrs.forEach(hr => hr.remove());
      
      // Show empty cart message if needed
      if (this.cartItems.length === 0) {
        if (emptyCartMessage) emptyCartMessage.classList.remove('d-none');
        return;
      } else {
        if (emptyCartMessage) emptyCartMessage.classList.add('d-none');
      }
      
      // Create HTML for each cart item - use BEFOREEND to preserve order
      this.cartItems.forEach((item, index) => {
        const cartItemHTML = `
          <div class="row mb-4 cart-item" data-id="${item.id}">
            <div class="col-md-2 col-4">
              <img src="${item.imageUrl}" class="img-fluid rounded" alt="${item.title}">
            </div>
            <div class="col-md-10 col-8">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="mb-0">${item.title}</h5>
                <button class="btn btn-sm text-danger remove-item">
                  <i class="bi bi-x-circle"></i> Remove
                </button>
              </div>
              <p class="text-muted mb-2">${item.author}</p>
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                  <span class="me-3 fw-bold">${item.price.toFixed(2)} D</span>
                  <div class="input-group input-group-sm" style="width: 120px;">
                    <button class="btn btn-outline-secondary decrease-qty" type="button">-</button>
                    <input type="number" class="form-control text-center item-qty" value="${item.quantity}" min="1" max="10">
                    <button class="btn btn-outline-secondary increase-qty" type="button">+</button>
                  </div>
                </div>
                <div class="fw-bold item-total">${(item.price * item.quantity).toFixed(2)} D</div>
              </div>
            </div>
          </div>
        `;
        
        // Add the item to the container - changed to beforeend to maintain order
        cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML);
        
        // Add separator if not the last item - also at the end
        if (index < this.cartItems.length - 1) {
          cartItemsContainer.insertAdjacentHTML('beforeend', '<hr>');
        }
      });
      
      // Update totals
      if (subtotalElement) subtotalElement.textContent = this.getSubtotal().toFixed(2) + ' D';
      if (taxElement) taxElement.textContent = this.getTax().toFixed(2) + ' D';
      if (totalElement) totalElement.textContent = this.getTotal().toFixed(2) + ' D';
      if (cartCountDisplay) cartCountDisplay.textContent = this.getItemCount();
      
      // Add event listeners
      this.addCartEventListeners();
    }
    
    // Set up event listeners for cart page
    addCartEventListeners() {
      // Item quantity buttons
      document.querySelectorAll('.increase-qty').forEach(button => {
        button.addEventListener('click', () => {
          const cartItem = button.closest('.cart-item');
          const id = cartItem.dataset.id;
          const input = cartItem.querySelector('.item-qty');
          const currentValue = parseInt(input.value);
          
          if (currentValue < 10) {
            input.value = currentValue + 1;
            this.updateQuantity(id, currentValue + 1);
            this.updateItemDisplay(cartItem);
          }
        });
      });
      
      document.querySelectorAll('.decrease-qty').forEach(button => {
        button.addEventListener('click', () => {
          const cartItem = button.closest('.cart-item');
          const id = cartItem.dataset.id;
          const input = cartItem.querySelector('.item-qty');
          const currentValue = parseInt(input.value);
          
          if (currentValue > 1) {
            input.value = currentValue - 1;
            this.updateQuantity(id, currentValue - 1);
            this.updateItemDisplay(cartItem);
          }
        });
      });
      
      document.querySelectorAll('.item-qty').forEach(input => {
        input.addEventListener('change', () => {
          const cartItem = input.closest('.cart-item');
          const id = cartItem.dataset.id;
          let value = parseInt(input.value);
          
          // Validate input
          if (isNaN(value) || value < 1) value = 1;
          if (value > 10) value = 10;
          
          // Update display
          input.value = value;
          this.updateQuantity(id, value);
          this.updateItemDisplay(cartItem);
        });
      });
      
      // Remove item buttons
      document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', () => {
          const cartItem = button.closest('.cart-item');
          const id = cartItem.dataset.id;
          
          cartItem.classList.add('fade-out');
          setTimeout(() => {
            this.removeItem(id);
            this.renderCartPage();
          }, 300);
        });
      });
      
      // Clear cart button
      const clearCartBtn = document.getElementById('clear-cart');
      if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to clear your cart?')) {
            this.clearCart();
            this.renderCartPage();
          }
        });
      }
    }
    
    // Update a single cart item display
    updateItemDisplay(cartItem) {
      const id = cartItem.dataset.id;
      const item = this.cartItems.find(item => item.id === id);
      if (!item) return;
      
      const totalElement = cartItem.querySelector('.item-total');
      if (totalElement) {
        totalElement.textContent = (item.price * item.quantity).toFixed(2) + ' D';
      }
      
      // Update order summary
      const subtotalElement = document.getElementById('subtotal');
      const taxElement = document.getElementById('tax');
      const orderTotalElement = document.getElementById('total'); // Renamed from 'totalElement'
      
      if (subtotalElement) subtotalElement.textContent = this.getSubtotal().toFixed(2) + ' D';
      if (taxElement) taxElement.textContent = this.getTax().toFixed(2) + ' D';
      if (orderTotalElement) orderTotalElement.textContent = this.getTotal().toFixed(2) + ' D';
    }
  }
  
  // Initialize cart
  const cart = new ShoppingCart();
  
  // Setup add-to-cart buttons on product pages
  document.addEventListener('DOMContentLoaded', function() {
    // Add to cart buttons on shop and product pages
    document.querySelectorAll('.add-to-cart').forEach(button => {
      button.addEventListener('click', function() {
        // Get product info from parent card or container
        const productCard = this.closest('.card') || this.closest('.product-container');
        if (!productCard) return;
        
        const id = this.dataset.id;
        const title = productCard.querySelector('.card-title').textContent;
        
        // Fixed author selector
        const authorEl = productCard.querySelector('.text-muted');
        const author = authorEl ? authorEl.textContent.trim() : 'Unknown Author';
        
        // Improved price extraction
        const priceEl = productCard.querySelector('.fw-bold');
        let price = 0;
        
        if (priceEl) {
          // Handle different price formats, remove all non-numeric characters except period
          const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
          price = parseFloat(priceText);
        }
        
        // Get image URL
        const imageEl = productCard.querySelector('img');
        const imageUrl = imageEl ? imageEl.src : '';
        
        // Add to cart
        cart.addItem(id, title, author, price, imageUrl);
        
        // Show confirmation
        const confirmDiv = document.createElement('div');
        confirmDiv.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x p-3 mt-3';
        confirmDiv.style.zIndex = '1050';
        confirmDiv.innerHTML = `
          <div class="d-flex align-items-center">
            <i class="bi bi-check-circle-fill me-2"></i>
            <span>${title} added to cart!</span>
            <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
          </div>
        `;
        document.body.appendChild(confirmDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
          confirmDiv.classList.add('fade-out');
          setTimeout(() => confirmDiv.remove(), 300);
        }, 3000);
      });
    });
    
    // Handle "Continue Shopping" button - replace the existing handler with this code
    const continueShoppingBtns = document.querySelectorAll('a[href="shop.html"]');
    
    continueShoppingBtns.forEach(btn => {
      // Add a specific class to identify it
      if (btn.textContent.trim().includes('Continue Shopping')) {
        btn.classList.add('continue-shopping-btn');
        // Remove any existing href to prevent default navigation
        btn.removeAttribute('href');
        btn.setAttribute('data-href', 'shop.html');
      }
    });
    
    // Use event delegation to handle all clicks on the page
    document.body.addEventListener('click', function(e) {
      const target = e.target.closest('.continue-shopping-btn');
      if (target) {
        e.preventDefault();
        e.stopPropagation(); // Stop event from triggering other handlers
        
        // Show the custom message
        const confirmDiv = document.createElement('div');
        confirmDiv.className = 'alert alert-info position-fixed top-0 start-50 translate-middle-x p-3 mt-3';
        confirmDiv.style.zIndex = '1050';
        confirmDiv.innerHTML = `
          <div class="d-flex align-items-center">
            <i class="bi bi-shop me-2"></i>
            <span>Feel free to shop more!</span>
            <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
          </div>
        `;
        document.body.appendChild(confirmDiv);
        
        // Navigate after a short delay
        setTimeout(() => {
          window.location.href = target.getAttribute('data-href') || 'shop.html';
        }, 1000);
      }
    });
    
    // Render cart page if on cart.html
    if (window.location.pathname.includes('cart.html')) {
      cart.renderCartPage();
    }
  });
  
  // Export cart for use in other scripts
  window.bookhavenCart = cart;