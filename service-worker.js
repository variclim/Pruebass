// Service Worker para funcionamiento offline
const CACHE_NAME = 'predios-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './libs/leaflet/leaflet.css',
    './libs/leaflet/leaflet.js',
    './libs/leaflet/leaflet.draw.css',
    './libs/leaflet/leaflet.draw.js',
    './libs/xlsx/xlsx.full.min.js'
];

// Instalación - cachear archivos
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('📦 Cache abierto');
                return cache.addAll(urlsToCache);
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});

// Activación - limpiar caches viejos
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(function() {
            return self.clients.claim();
        })
    );
});

// Interceptar peticiones - servir desde cache
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Cache hit - devolver respuesta del cache
                if (response) {
                    return response;
                }
                
                // Clonar la petición para hacer fetch
                var fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then(
                    function(response) {
                        // Verificar si la respuesta es válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clonar la respuesta para guardar en cache
                        var responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });
                            
                        return response;
                    }
                );
            })
    );
});