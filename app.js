/**
 * lyfestyle - Storefront Core Script
 * Coordinates interactive UI elements, the text vanish slider,
 * category filtering, cart drawer workflows, checkout, and SweetAlert2 toasts.
 */

// ==========================================================================
// 1. SYSTEM CONFIGURATION & STATE
// ==========================================================================
const CONFIG = {
    sliderSpeed: 4000, // Duration in milliseconds for each hero text slide
};

// Global Store State
const STATE = {
    cart: [], // Stores added items: { id, title, price, image, qty }
    activeCategory: 'all items',
};

// ==========================================================================
// 2. DOM SELECTORS
// ==========================================================================
const DOM = {
    // Structural elements
    slides: document.querySelectorAll('.slide-text'),
    productCards: document.querySelectorAll('.dynamic-card'),
    categoryButtons: document.querySelectorAll('.category-item'),
    searchInput: document.getElementById('search-input'),
    profileBtn: document.querySelector('.profile-btn'),
    
    // Cart elements
    cartBtn: document.getElementById('cart-btn'),
    cartBadge: document.querySelector('.cart-badge'),
    cartDrawer: document.getElementById('cart-drawer'),
    closeDrawerBtn: document.getElementById('close-drawer-btn'),
    drawerOverlay: document.getElementById('drawer-overlay'),
    emptyCartState: document.getElementById('empty-cart-state'),
    cartItemsContainer: document.getElementById('cart-items-container'),
    drawerFooter: document.getElementById('drawer-footer'),
    cartSubtotalPrice: document.getElementById('cart-subtotal-price'),
    drawerShopNowBtn: document.getElementById('drawer-shop-now-btn'),
    
    // Checkout elements
    checkoutBtn: document.getElementById('checkout-btn'),
    checkoutPanel: document.getElementById('checkout-panel'),
    closePanelBtn: document.getElementById('close-panel-btn'),
    checkoutForm: document.getElementById('checkout-form'),
    checkoutTotalPrice: document.getElementById('checkout-total-price'),
    orderLoader: document.getElementById('order-loader'),
    orderBtnText: document.querySelector('.btn-text-content'),
    placeOrderBtn: document.getElementById('place-order-btn')
};

// ==========================================================================
// 3. SWEETALERT2 TOAST DEFINITION
// ==========================================================================
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

// ==========================================================================
// 4. TEXT VANISH SLIDER LOGIC
// ==========================================================================
function initTextSlider() {
    if (DOM.slides.length === 0) return;
    
    let currentSlideIndex = 0;
    
    setInterval(() => {
        DOM.slides[currentSlideIndex].classList.remove('active');
        currentSlideIndex = (currentSlideIndex + 1) % DOM.slides.length;
        DOM.slides[currentSlideIndex].classList.add('active');
    }, CONFIG.sliderSpeed);
}

// ==========================================================================
// 5. INTERACTIVE E-COMMERCE LOGIC (Cart & State Actions)
// ==========================================================================

/**
 * Recalculates subtotals, updates badges, and handles empty state toggles
 */
function updateCartUI() {
    // 1. Update Cart Badge Count
    const totalItems = STATE.cart.reduce((total, item) => total + item.qty, 0);
    if (DOM.cartBadge) {
        DOM.cartBadge.textContent = totalItems;
    }

    // 2. If Cart is empty, toggle display panels
    if (STATE.cart.length === 0) {
        if (DOM.emptyCartState) DOM.emptyCartState.style.display = 'flex';
        if (DOM.cartItemsContainer) DOM.cartItemsContainer.style.display = 'none';
        if (DOM.drawerFooter) DOM.drawerFooter.style.display = 'none';
        return;
    }

    // 3. Populate populated states
    if (DOM.emptyCartState) DOM.emptyCartState.style.display = 'none';
    if (DOM.cartItemsContainer) DOM.cartItemsContainer.style.display = 'flex';
    if (DOM.drawerFooter) DOM.drawerFooter.style.display = 'block';

    // 4. Render Cart items
    if (DOM.cartItemsContainer) {
        DOM.cartItemsContainer.innerHTML = '';
        
        STATE.cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                <div class="cart-item-details">
                    <span class="cart-item-title">${item.title}</span>
                    <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
                    <div class="cart-qty-controls">
                        <button class="qty-btn dec-qty" data-id="${item.id}">-</button>
                        <span class="qty-val">${item.qty}</span>
                        <button class="qty-btn inc-qty" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="remove-item-btn" data-id="${item.id}" aria-label="Remove item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            `;
            DOM.cartItemsContainer.appendChild(itemElement);
        });

        // Attach listeners dynamically to quantity adjusters inside container
        attachCartModifierEvents();
    }

    // 5. Calculate subtotal summary metrics
    const subtotal = STATE.cart.reduce((total, item) => total + (item.price * item.qty), 0);
    const subtotalFormatted = `$${subtotal.toFixed(2)}`;
    
    if (DOM.cartSubtotalPrice) DOM.cartSubtotalPrice.textContent = subtotalFormatted;
    if (DOM.checkoutTotalPrice) DOM.checkoutTotalPrice.textContent = subtotalFormatted;
}

/**
 * Binds active event listeners to items generated on demand inside the cart view
 */
function attachCartModifierEvents() {
    // Quantity increment handlers
    document.querySelectorAll('.inc-qty').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const cartItem = STATE.cart.find(item => item.id === id);
            if (cartItem) {
                cartItem.qty++;
                updateCartUI();
            }
        });
    });

    // Quantity decrement handlers
    document.querySelectorAll('.dec-qty').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const cartItem = STATE.cart.find(item => item.id === id);
            if (cartItem && cartItem.qty > 1) {
                cartItem.qty--;
                updateCartUI();
            } else if (cartItem) {
                // If value goes below 1, remove completely
                STATE.cart = STATE.cart.filter(item => item.id !== id);
                updateCartUI();
            }
        });
    });

    // Singular item deletion triggers
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            STATE.cart = STATE.cart.filter(item => item.id !== id);
            updateCartUI();
            
            Toast.fire({
                icon: 'info',
                title: 'item removed from cart'
            });
        });
    });
}

/**
 * Initializes and binds actions to interactive product card hooks
 */
function initProductCardInteractions() {
    DOM.productCards.forEach((card, index) => {
        const title = card.querySelector('.product-title')?.textContent.trim() || 'essential item';
        const priceText = card.querySelector('.product-price')?.textContent.trim() || '$0.00';
        const priceVal = parseFloat(priceText.replace('$', '')) || 0;
        
        // Dynamic identification key logic
        const itemId = `prod-${index + 1}`;

        // Get item image URL from styling declaration
        const imagePlaceholderEl = card.querySelector('.image-placeholder');
        let imageUrl = '';
        if (imagePlaceholderEl) {
            const style = window.getComputedStyle(imagePlaceholderEl);
            const bgImage = style.backgroundImage;
            imageUrl = bgImage.replace(/url\(['"]?(.*?)['"]?\)/, '$1');
        }

        // Toggles local favoriting changes
        const wishlistBtn = card.querySelector('.wishlist-btn');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                
                const heartIcon = wishlistBtn.querySelector('.heart-icon');
                wishlistBtn.classList.toggle('wishlisted');

                if (wishlistBtn.classList.contains('wishlisted')) {
                    heartIcon.setAttribute('fill', '#e06381');
                    heartIcon.setAttribute('stroke', '#e06381');
                    Toast.fire({
                        icon: 'success',
                        title: 'added to wishlist'
                    });
                } else {
                    heartIcon.setAttribute('fill', 'none');
                    heartIcon.setAttribute('stroke', 'currentColor');
                }
            });
        }

        // Add to Cart workflow
        const selectBtn = card.querySelector('.select-options-btn');
        if (selectBtn) {
            selectBtn.addEventListener('click', (event) => {
                event.stopPropagation();

                // Look for existing elements inside current store stack
                const existingItem = STATE.cart.find(item => item.id === itemId);

                if (existingItem) {
                    existingItem.qty++;
                } else {
                    STATE.cart.push({
                        id: itemId,
                        title: title,
                        price: priceVal,
                        image: imageUrl,
                        qty: 1
                    });
                }

                updateCartUI();

                Toast.fire({
                    icon: 'success',
                    title: `${title} added to cart`
                });
            });
        }

        // General Card Details logging click path
        card.addEventListener('click', () => {
            console.log(`Analyzing details for: ${title} | ${priceText}`);
        });
    });
}

// ==========================================================================
// 6. UI MODAL DRAWER PORTALS (Cart Drawer & Checkout Sheet)
// ==========================================================================
function initCartDrawerTransitions() {
    // Open Cart Drawer
    if (DOM.cartBtn) {
        DOM.cartBtn.addEventListener('click', () => {
            if (DOM.cartDrawer) DOM.cartDrawer.classList.add('active');
            if (DOM.drawerOverlay) DOM.drawerOverlay.classList.add('active');
        });
    }

    // Close Cart Drawer via close button
    if (DOM.closeDrawerBtn) {
        DOM.closeDrawerBtn.addEventListener('click', () => {
            if (DOM.cartDrawer) DOM.cartDrawer.classList.remove('active');
            if (DOM.drawerOverlay) DOM.drawerOverlay.classList.remove('active');
        });
    }

    // Close via overlay click path
    if (DOM.drawerOverlay) {
        DOM.drawerOverlay.addEventListener('click', () => {
            if (DOM.cartDrawer) DOM.cartDrawer.classList.remove('active');
            if (DOM.checkoutPanel) DOM.checkoutPanel.classList.remove('active');
            if (DOM.drawerOverlay) DOM.drawerOverlay.classList.remove('active');
        });
    }

    // Shop now triggers inside drawer empty states
    if (DOM.drawerShopNowBtn) {
        DOM.drawerShopNowBtn.addEventListener('click', () => {
            if (DOM.cartDrawer) DOM.cartDrawer.classList.remove('active');
            if (DOM.drawerOverlay) DOM.drawerOverlay.classList.remove('active');
            
            const target = document.getElementById('products-grid');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Proceed to Checkout Bottom Sheet Slide-Up trigger
    if (DOM.checkoutBtn) {
        DOM.checkoutBtn.addEventListener('click', () => {
            if (STATE.cart.length === 0) return;
            
            // Close Cart drawer side-frame, and activate vertical Slide-up details form
            if (DOM.cartDrawer) DOM.cartDrawer.classList.remove('active');
            if (DOM.checkoutPanel) DOM.checkoutPanel.classList.add('active');
        });
    }

    // Close Bottom Sheet Checkout Panel
    if (DOM.closePanelBtn) {
        DOM.closePanelBtn.addEventListener('click', () => {
            if (DOM.checkoutPanel) DOM.checkoutPanel.classList.remove('active');
            if (DOM.drawerOverlay) DOM.drawerOverlay.classList.remove('active');
        });
    }
}

// ==========================================================================
// 7. ORDER PLACEMENT AND FORM VALIDATION (Mock Database submission)
// ==========================================================================
function initOrderSubmission() {
    if (!DOM.checkoutForm) return;

    DOM.checkoutForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Stop default browser page reloads

        // Toggle button load transitions
        if (DOM.orderLoader) DOM.orderLoader.style.display = 'block';
        if (DOM.orderBtnText) DOM.orderBtnText.style.display = 'none';
        if (DOM.placeOrderBtn) DOM.placeOrderBtn.disabled = true;

        // Simulated asynchronous delivery timeout (2-second loader lag)
        setTimeout(() => {
            // Restore button trigger interfaces
            if (DOM.orderLoader) DOM.orderLoader.style.display = 'none';
            if (DOM.orderBtnText) DOM.orderBtnText.style.display = 'block';
            if (DOM.placeOrderBtn) DOM.placeOrderBtn.disabled = false;

            // Clear platform Cart state variables
            STATE.cart = [];
            updateCartUI();

            // Clear modal visual overlays
            if (DOM.checkoutPanel) DOM.checkoutPanel.classList.remove('active');
            if (DOM.drawerOverlay) DOM.drawerOverlay.classList.remove('active');

            // Reset input values across input groups
            DOM.checkoutForm.reset();

            // Professional completion alert
            Swal.fire({
                title: 'order placed!',
                text: 'your delivery schedule has been finalized. thank you for choosing lyfestyle.',
                icon: 'success',
                confirmButtonColor: '#2b2523',
                customClass: {
                    popup: 'custom-swal-font-class'
                }
            });

        }, 2000);
    });
}

// ==========================================================================
// 8. REAL-TIME SEARCH & CATEGORIES FILTERING
// ==========================================================================
function initFiltersAndSearch() {
    // 1. Dynamic Search matching
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', (event) => {
            const query = event.target.value.toLowerCase().trim();

            DOM.productCards.forEach(card => {
                const titleText = card.querySelector('.product-title').textContent.toLowerCase();
                
                if (titleText.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // 2. Active Category filtration logic
    if (DOM.categoryButtons.length > 0) {
        DOM.categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                DOM.categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const selectedCategory = button.textContent.trim().toLowerCase();
                STATE.activeCategory = selectedCategory;

                DOM.productCards.forEach(card => {
                    const badge = card.querySelector('.product-category-badge');
                    const productCategory = badge ? badge.textContent.trim().toLowerCase() : '';

                    if (selectedCategory === 'all items' || productCategory === selectedCategory) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }
}

// ==========================================================================
// 9. APPLICATION INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initTextSlider();
    initProductCardInteractions();
    initCartDrawerTransitions();
    initOrderSubmission();
    initFiltersAndSearch();
});
