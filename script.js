console.log("connected")

// script.js - handles both index (store) and cart pages
// Uses localStorage key: 'berserk_cart_v1'

/* -------------------------
   PRODUCTS (placeholder data)
   ------------------------- */
const PRODUCTS = [
  { id: 1, title: 'Berserk Vol. 1', price: 18.99, img: 'https://cdn2.penguin.com.au/covers/original/9781593070205.jpg' },
  { id: 2, title: 'Berserk Vol. 2', price: 18.99, img: 'https://cdn2.penguin.com.au/covers/original/9781593070212.jpg' },
  { id: 3, title: 'Berserk Vol. 3', price: 20.50, img: 'https://cdn2.penguin.com.au/covers/original/9781593070229.jpg' },
  { id: 4, title: 'Deluxe Artbook', price: 39.99, img: 'https://www.u-buy.co.nz/productimg/?image=aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvOTFlUm9XU0FDQ0wuX1NMMTUwMF8uanBn.jpg' },
  { id: 5, title: 'Griffith & Guts Poster', price: 9.50, img: 'https://m.media-amazon.com/images/I/61yZGDZiypL._AC_SL1500_.jpg' }
];

const STORAGE_KEY = 'berserk_cart_v1';

/* -------------------------
   CART UTILITIES
   ------------------------- */
function loadCart() {
  const raw = localStorage.getItem(STORAGE_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Cart load error', e);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function findProduct(productId) {
  return PRODUCTS.find(p => p.id === productId);
}

/* -------------------------
   PAGE DETECTION
   ------------------------- */
const page = document.body.dataset.page || 'store';
let cart = loadCart(); // cart = [{id, qty}, ...]

/* update nav count if present */
function updateNavCount() {
  const el = document.getElementById('navCount');
  if (el) {
    const totalQty = cart.reduce((s, it) => s + it.qty, 0);
    el.innerText = totalQty;
  }
}

/* -------------------------
   STORE PAGE LOGIC ()
   ------------------------- */
function renderStoreProducts() {
  const container = document.getElementById('products');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < PRODUCTS.length; i++) { // loops
    const p = PRODUCTS[i];
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.img}" alt="${escapeHtml(p.title)}">
      <h3>${escapeHtml(p.title)}</h3>
      <p>Collector's fan copy — placeholder description to be replaced with real copy.</p>
      <div class="priceRow">
        <div class="price">$${p.price.toFixed(2)}</div>
        <div>
          <button class="btn add-btn" data-id="${p.id}">Add to Cart</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  }

  // attach handlers
  const addButtons = document.querySelectorAll('.add-btn'); // function example
  addButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      addToCart(id);
    });
  });
}

function addToCart(id) {
  const existing = cart.find(it => it.id === id);
  if (existing) {
    existing.qty += 1; // arithmetic operator used
  } else {
    cart.push({ id: id, qty: 1 });
  }
  saveCart(cart);
  updateNavCount();
  // small visual feedback
  flashMessage('Added to cart');
}

function flashMessage(message) {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.position = 'fixed';
  el.style.left = '50%';
  el.style.transform = 'translateX(-50%)';
  el.style.bottom = '20px';
  el.style.padding = '10px 16px';
  el.style.borderRadius = '8px';
  el.style.background = 'rgba(0,0,0,0.8)';
  el.style.color = '#ffdede';
  el.style.zIndex = 9999;
  document.body.appendChild(el);
  setTimeout(() => el.style.opacity = '0.01', 900);
  setTimeout(() => document.body.removeChild(el), 1200);
}

/* -------------------------
   CART PAGE LOGIC (render + events)
   ------------------------- */
function renderCartPage() {
  const listEl = document.getElementById('cartList');
  if (!listEl) return;

  listEl.innerHTML = '';
  if (cart.length === 0) {
    listEl.innerHTML = '<p>Your cart is empty. Visit the store to add items.</p>';
    updateTotals();
    return;
  }

  for (let i = 0; i < cart.length; i++) {
    const item = cart[i];
    const prod = findProduct(item.id);
    if (!prod) continue;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${prod.img}" alt="${escapeHtml(prod.title)}">
      <div class="meta">
        <div style="font-weight:700">${escapeHtml(prod.title)}</div>
        <div>$${prod.price.toFixed(2)} x ${item.qty} = <strong>$${(prod.price * item.qty).toFixed(2)}</strong></div>
      </div>
      <div class="qty-controls">
        <button class="smallBtn dec" data-id="${prod.id}">-</button>
        <div>${item.qty}</div>
        <button class="smallBtn inc" data-id="${prod.id}">+</button>
        <button class="smallBtn rm" data-id="${prod.id}" title="Remove">✕</button>
      </div>
    `;
    listEl.appendChild(row);
  }

  // attach events
  const incs = document.querySelectorAll('.inc');
  incs.forEach(b => b.addEventListener('click', (e) => {
    const id = parseInt(e.currentTarget.dataset.id);
    changeQty(id, +1);
  }));
  const decs = document.querySelectorAll('.dec');
  decs.forEach(b => b.addEventListener('click', (e) => {
    const id = parseInt(e.currentTarget.dataset.id);
    changeQty(id, -1);
  }));
  const rms = document.querySelectorAll('.rm');
  rms.forEach(b => b.addEventListener('click', (e) => {
    const id = parseInt(e.currentTarget.dataset.id);
    removeFromCart(id);
  }));

  updateTotals();
}

function changeQty(id, delta) {
  const item = cart.find(it => it.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty < 1) {
    // remove
    cart = cart.filter(it => it.id !== id);
  }
  saveCart(cart);
  renderCartPage();
  updateNavCount();
}

function removeFromCart(id) {
  cart = cart.filter(it => it.id !== id);
  saveCart(cart);
  renderCartPage();
  updateNavCount();
}

function updateTotals() {
  const subtotalEl = document.getElementById('subtotalText');
  const shippingEl = document.getElementById('shippingText');
  const totalEl = document.getElementById('totalText');

  const subtotal = cart.reduce((s, it) => {
    const p = findProduct(it.id);
    return s + (p ? p.price * it.qty : 0);
  }, 0);

  const shipping = subtotal >= 120 || subtotal === 0 ? 0 : 7.99;
  const total = subtotal + shipping;

  if (subtotalEl) subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
  if (shippingEl) shippingEl.innerText = `$${shipping.toFixed(2)}`;
  if (totalEl) totalEl.innerText = `$${total.toFixed(2)}`;
}

/* -------------------------
   COMMON / PAGE INIT
   ------------------------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]);
}

/* wire up UI available on both pages */
function wireCommon() {
  const clearBtn = document.getElementById('clearBtn') || document.getElementById('clearCart');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('Clear the entire cart?')) return;
      cart = [];
      saveCart(cart);
      // re-render depending on page
      if (page === 'cart') renderCartPage();
      else if (page === 'store') updateNavCount();
    });
  }

  // checkout if present
  const checkoutBtn = document.getElementById('checkoutBtn') || document.getElementById('checkout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
      }
      const subtotal = cart.reduce((s, it) => {
        const p = findProduct(it.id);
        return s + (p ? p.price * it.qty : 0);
      }, 0);
      const shipping = subtotal >= 120 ? 0 : 7.99;
      const total = (subtotal + shipping).toFixed(2);
      if (confirm(`Confirm purchase of $${total}? This is a demo checkout.`)) {
        alert('Thank you! Order placed (demo).');
        cart = [];
        saveCart(cart);
        if (page === 'cart') renderCartPage();
        updateNavCount();
      }
    });
  }
}

/* main init */
(function init() {
  updateNavCount();
  wireCommon();

  if (page === 'store') {
    renderStoreProducts();
  } else if (page === 'cart') {
    renderCartPage();
  }
})();

// === Animations on Scroll ===
const fadeElements = document.querySelectorAll('.fade-in');

function checkFadeIn() {
  fadeElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      el.classList.add('fade-in');
    }
  });
}

window.addEventListener('scroll', checkFadeIn);
checkFadeIn(); // Run on page load
