// Sanwar PWA Service Worker - v5
const CACHE_VERSION = 'sanwar-v5';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Core shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/favicon.svg',
];

// ─── Install: pre-cache shell ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: clean old caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const keepCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !keepCaches.includes(k)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch strategy ──────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests (analytics, Clerk, etc.)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // API calls → Network first, fallback to cache (never serve stale data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE, 5000));
    return;
  }

  // Navigation requests → Network first with offline fallback to cached /
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/') || caches.match(request))
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) → Cache first, update in background
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstWithBackgroundUpdate(request, STATIC_CACHE));
    return;
  }

  // Everything else → Network first, cache response for next time
  event.respondWith(networkFirstWithCache(request, DYNAMIC_CACHE, 8000));
});

function isStaticAsset(pathname) {
  return /\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|svg|ico|webp|avif)$/i.test(pathname);
}

async function cacheFirstWithBackgroundUpdate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.status === 200) {
      const clone = response.clone();
      caches.open(cacheName).then((cache) => cache.put(request, clone));
    }
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}

async function networkFirstWithCache(request, cacheName, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response && response.status === 200) {
      const clone = response.clone();
      caches.open(cacheName).then((cache) => cache.put(request, clone));
    }
    return response;
  } catch {
    clearTimeout(timer);
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ─── Push notifications ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'sanwar-notification',
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
      vibrate: [200, 100, 200],
    };
    // Add action buttons if provided
    if (data.actions && data.actions.length > 0) {
      options.actions = data.actions;
    }
    event.waitUntil(self.registration.showNotification(data.title || 'Sanwar', options));
  } catch {
    event.waitUntil(
      self.registration.showNotification('Sanwar', {
        body: 'You have a new notification',
        icon: '/icon-192.png',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const bookingId = event.notification.data?.bookingId;
  const action = event.action;

  // Handle action button clicks
  if (action === 'accept' && bookingId) {
    // Accept: navigate to bookings with accept query
    const url = `/customer/bookings?accept=${bookingId}`;
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const c of clients) { if ('focus' in c) { c.focus(); c.postMessage({ action: 'accept-booking', bookingId }); return; } }
        return self.clients.openWindow(url);
      })
    );
    return;
  }

  if (action === 'reject' && bookingId) {
    const url = `/owner/bookings`;
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const c of clients) { if ('focus' in c) { c.focus(); c.postMessage({ action: 'reject-booking', bookingId }); return; } }
        return self.clients.openWindow(url);
      })
    );
    return;
  }

  // Default: open the target URL
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
