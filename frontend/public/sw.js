/**
 * InfoTest Service Worker
 * PWA Offline rejim — test topshirish, caching, background sync
 */

const CACHE_NAME = 'infotest-v3';
const API_CACHE = 'infotest-api-v3';
const OFFLINE_QUEUE = 'infotest-offline-queue';

// Keshlanadigan statik fayllar
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css',
];

// ─── INSTALL — statik fayllarni keshlash ─────────────────────
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 SW: Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ba'zi fayllar topilmasa ham davom etish
        console.log('⚠️ SW: Some assets failed to cache');
      });
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATE — eski keshlarni tozalash ──────────────────────
self.addEventListener('activate', (event) => {
  console.log('✅ SW: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('🗑️ SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ─── FETCH — so'rovlarni qayta ishlash ──────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API so'rovlar
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Statik fayllar — Cache First
  event.respondWith(handleStaticRequest(request));
});

// Statik fayllar: Cache First, Network Fallback
async function handleStaticRequest(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Muvaffaqiyatli javoblarni keshlash
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Offline — index.html qaytarish (SPA routing)
    if (request.mode === 'navigate') {
      const cached = await caches.match('/index.html');
      if (cached) return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

// API so'rovlar: Network First, Cache Fallback
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // GET so'rovlar — Network first, cache fallback
  if (request.method === 'GET') {
    try {
      const response = await fetch(request);
      if (response.ok) {
        // Muvaffaqiyatli API javoblarni keshlash
        const cache = await caches.open(API_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      // Offline — keshdan qaytarish
      const cached = await caches.match(request);
      if (cached) return cached;

      return new Response(JSON.stringify({
        error: 'Offline rejim. Internet qaytganda ma\'lumotlar yangilanadi.',
        offline: true
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // POST so'rovlar (test submit) — offline saqlash
  if (request.method === 'POST' && url.pathname.includes('/results/submit')) {
    try {
      const response = await fetch(request.clone());
      return response;
    } catch (error) {
      // Offline — javoblarni saqlash
      const body = await request.json();
      await saveOfflineSubmission(body);

      return new Response(JSON.stringify({
        message: 'Javoblar saqlandi. Internet qaytganda avtomatik yuboriladi.',
        offline: true,
        saved: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Boshqa POST/PUT so'rovlar — oddiy fetch
  try {
    return await fetch(request);
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Offline rejim. Bu amal uchun internet kerak.',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ─── IndexedDB — offline javoblarni saqlash ──────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('InfoTestOffline', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('submissions')) {
        db.createObjectStore('submissions', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveOfflineSubmission(data) {
  const db = await openDB();
  const tx = db.transaction('submissions', 'readwrite');
  const store = tx.objectStore('submissions');
  store.add({
    ...data,
    saved_at: new Date().toISOString(),
    synced: false
  });
  console.log('💾 SW: Submission saved offline');
}

async function getOfflineSubmissions() {
  const db = await openDB();
  const tx = db.transaction('submissions', 'readonly');
  const store = tx.objectStore('submissions');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve([]);
  });
}

async function clearSyncedSubmissions() {
  const db = await openDB();
  const tx = db.transaction('submissions', 'readwrite');
  const store = tx.objectStore('submissions');
  store.clear();
  console.log('🗑️ SW: Synced submissions cleared');
}

// ─── SYNC — internet qaytganda javoblarni yuborish ───────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-submissions') {
    console.log('🔄 SW: Syncing offline submissions...');
    event.waitUntil(syncOfflineSubmissions());
  }
});

async function syncOfflineSubmissions() {
  const submissions = await getOfflineSubmissions();

  if (submissions.length === 0) return;

  console.log(`📤 SW: Syncing ${submissions.length} offline submission(s)...`);

  for (const sub of submissions) {
    try {
      const { id, saved_at, synced, ...data } = sub;
      const token = await getToken();

      const response = await fetch('/api/results/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log(`✅ SW: Submission synced successfully`);
      }
    } catch (error) {
      console.error('❌ SW: Sync failed:', error);
      // Keyingi urinishda qayta sync qilinadi
      return;
    }
  }

  await clearSyncedSubmissions();

  // Clientlarga xabar berish
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      count: submissions.length
    });
  });
}

// Token olish (localStorage dan)
async function getToken() {
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => resolve(event.data.token);
      clients[0].postMessage({ type: 'GET_TOKEN' }, [channel.port2]);
    });
  }
  return null;
}

// ─── MESSAGE — client bilan aloqa ────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
