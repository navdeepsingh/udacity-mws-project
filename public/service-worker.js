(function() {
  'use strict';

  self.importScripts('public/js/dbhelper.js');

  const staticCacheName = 'cacheFile-mws-stage1-v2.3';
  const imageCacheName = 'images';
  const pagesCacheName = 'pages';

  const cacheList = [
    staticCacheName,
    imageCacheName,
    pagesCacheName
  ];
  const cacheFiles = [
    '/',
    '/restaurant.html?id=',
    'public/css/styles.css',
    'public/js/dbhelper.js',
    'public/js/main.js',
    'public/js/restaurant_info.js'
  ]

  self.addEventListener('install', installEvent => {
    console.log('Service Worker Installing');

    skipWaiting();
    installEvent.waitUntil(
      caches.open(staticCacheName)
        .then( staticCache => {
          return staticCache.addAll(cacheFiles);
        })
    );
  });

  self.addEventListener('activate', activateEvent => {
    console.log('Service Worker Activating');

    activateEvent.waitUntil(
      caches.keys()
        .then( cacheNames => {
          return Promise.all(
            cacheNames.map( cacheName => {
              if (!cacheList.includes(cacheName)) {
                return caches.delete(cacheName);
              }
            })
          )
        })
        .then( () => {
          return clients.claim();
        })
    );
  });

  self.addEventListener('fetch', fetchEvent => {
    console.log('Service Worker is Listening');
    const request = fetchEvent.request;

    // When the user requests an HTML file
    // if (request.headers.get('Accept').includes('text/html')) {
    //   fetchEvent.respondWith(
    //     // Fetch that page from the network
    //     fetch(request)
    //   ); // end respondWith
    //   return; // Go no further
    // }

    // When the user requests an image
    if (request.url.match(/\.(jpe?g|png|gif|svg)$/)) {
      fetchEvent.respondWith(
        caches.match(request)
          .then(responseFromCache => {
            if (responseFromCache) {
              return responseFromCache;
            }

            // Otherwise fetch from network         
            return fetch(request)
              .then(responseFromFetch => {
                // Special cache for images
                const copy = responseFromFetch.clone();
                fetchEvent.waitUntil(
                  caches.open(imageCacheName)
                    .then(imageCache => {
                      return imageCache.put(request, copy);
                    })
                );
                return responseFromFetch;
              });
          })
      ); // end respondWith
      return; // Go no further
    } 

    // For everything else...
    fetchEvent.respondWith(
      // Look for a cached version of the file
      caches.match(request)
        .then(responseFromCache => {
          if (responseFromCache) {
            return responseFromCache;
          } // end if

          return fetch(request);      
        })        
    ); // end respondWith
  });

  self.addEventListener('sync', syncEvent => {  

    if (syncEvent.tag == 'reviews') {

      syncEvent.waitUntil(
        DBHelper.saveRestaurantReview()
        .then(res => {
          console.log('Result of Promise in SW: ' + res);          
          return res;
        })
        .catch(err => {
          console.log('Failed Promise in SW');          
        })        
      );
    }
     
    
  });

  
})();
