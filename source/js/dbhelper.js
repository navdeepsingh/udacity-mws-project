/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants/`;
  }

  static get REVIEWS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews/`;
  }

  static get DB_VERSION() {
    const version = 6;
    return version;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(from = 'indexeddb', action = 'create') {
    let db;
    let openRequest = indexedDB.open('mws-restaurant-db', this.DB_VERSION);
    openRequest.onupgradeneeded = function (e) {
      console.log('UpgradeNeeded Running..');
      db = e.target.result;
      if (!db.objectStoreNames.contains('restaurants')) {
        db.createObjectStore('restaurants');
      }
      if (!db.objectStoreNames.contains('reviews')) {
        var objectStore = db.createObjectStore("reviews", { keyPath: "Key", autoIncrement: true });
        objectStore.createIndex("Key", "Key", { unique: false })
      }
    }

    return new Promise(function(resolve, reject) {

      
      openRequest.onsuccess = function (e) {
        db = e.target.result;
        // Get from DB
        let transactionGet = db.transaction(['restaurants'], "readonly");
        let storeGet = transactionGet.objectStore("restaurants");
        let requestGet = storeGet.get(1);

        requestGet.onsuccess = function (e) {
          let result = e.target.result;          
          if (result !== undefined && from == 'indexeddb') {          
            // If its in cache
            console.log('Getting JSON from: IndexedDB');            
            resolve(result);
          } else {
            //else request from network
            resolve(fetch(DBHelper.DATABASE_URL)
              .then(response => {
                return response;
              })
              .then(result => {
                let resultJson = result.json();
                // Create DB
                if (action == 'create') {
                  DBHelper.createRestaurantsDB(db, resultJson);
                } else {
                  DBHelper.updateRestaurantsDB(db, resultJson);
                }
                console.log('Getting JSON from: Network');
                return resultJson;
              })
              .catch(error => {
                console.log(`Error: ${error}`);
              }));
          }
        }

        requestGet.onerror = function(e) {
          console.log('On Error');
          // reject can be here
        }
      }   
    });
  }

  static createRestaurantsDB(db, restaurantsPromise) {
    restaurantsPromise
      .then(restaurants => {
        //Add to DB
        let transaction = db.transaction(['restaurants'], "readwrite");
        let store = transaction.objectStore("restaurants");
        let request = store.add(restaurants, 1);
        request.onerror = function (e) {
          console.log("Error", e.target.error.name);
        }
        request.onsuccess = function (e) {
          console.log('Added Successfully');
        }
      })
  }

  static updateRestaurantsDB(db, restaurantsPromise) {
    restaurantsPromise
      .then(restaurants => {
        //Add to DB
        let transaction = db.transaction(['restaurants'], "readwrite");
        let store = transaction.objectStore("restaurants");
        let request = store.put(restaurants, 1);
        request.onerror = function (e) {
          console.log("Error", e.target.error.name);
        }
        request.onsuccess = function (e) {
          console.log('Updated Successfully');
        }
      })
  }

  static createReviewsDB(data) {
    let db;
    let openRequest = indexedDB.open('mws-restaurant-db', this.DB_VERSION);
    openRequest.onsuccess = function (e) {
      db = e.target.result;
      // Get from DB
      let transaction = db.transaction(['reviews'], "readwrite");
      let store = transaction.objectStore("reviews");
      let request = store.add(data);
      request.onerror = function (e) {
        console.log("Error", e.target.error.name);
      }
      request.onsuccess = function (e) {
        console.log('Reviews Added Successfully');
      }
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          // Get and merge reviews too
          return fetch(DBHelper.REVIEWS_URL +`?restaurant_id=${restaurant.id}`)
          .then(results => {
            return results.json();         
          })
          .then(reviews => {
            restaurant['reviews'] = reviews;              
            return restaurant;   
          });       
          //console.log(restaurant);                  
          
          
        } else { // Restaurant does not exist inthe database
         console.log('Restaurant does not exist');
        }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return DBHelper.fetchRestaurants()
    .then(restaurants => {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        return results;
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
    .then(restaurants => {      
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        return results;
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        return results;
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
    .then(restaurants => {
      console.log(restaurants);
      
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        //callback(null, uniqueNeighborhoods);
        return uniqueNeighborhoods;
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        
        return uniqueCuisines;
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  /**
   * Toggle Favorite for a restaurant.
   */
  static toggleFavoriteRestaurant(restaurant, isFav, favToggleElem) {
    return new Promise(function (resolve, reject) {
      // Saving on server
      fetch(DBHelper.DATABASE_URL + `${restaurant.id}/?is_favorite=${isFav}`, {
        method: 'put'
      })
      .then(response => {
        if (!response.ok) {
          console.log('Something goes wrong..');
          reject('Failed');
        }
        isFav = !isFav;
        favToggleElem.classList.toggle('fav');

        return DBHelper.fetchRestaurants('network', 'upadate')
          .then(restaurants => {            
              resolve(isFav);            
          });    
      });
    });
  }

  /**
  * Save retaurant review
  */
  static postRestaurantReview(restaurant, data) {
    let newData = {};
    for (var entry of data.entries()) {
      newData[entry[0]] = entry[1];
    }
    newData['restaurant_id'] = restaurant.id;
    return new Promise(function (resolve, reject) {
      // Saving on server
      const newDataJson = JSON.stringify(newData);
      return fetch(DBHelper.REVIEWS_URL, {
        method: 'POST',
        body: newDataJson,
        headers: {
          "Accept": "application/json"
        }
      })
      .then(response => {
        // Save on IndexedDB Also
        console.log(response);               
        resolve(response.ok);
        return;
      })
      .catch(err => {        
        console.log('Network Error');                
        reject(DBHelper.createReviewsDB(newData));
      }); 
    });
  }

  static dummyPromise() {
    return new Promise(function(resolve, reject) {
      resolve('Test');
    });
  }

  /**
  * Save retaurant review from IndexedDB
  */
  static saveRestaurantReview(data) {
    let db;
    let openRequest = indexedDB.open('mws-restaurant-db', DBHelper.DB_VERSION);
    return new Promise(function(resolve, reject){
      openRequest.onupgradeneeded = function (e) {
        console.log('UpgradeNeeded Running..');
        db = e.target.result;
        if (!db.objectStoreNames.contains('restaurants')) {
          db.createObjectStore('restaurants');
        }
        if (!db.objectStoreNames.contains('reviews')) {
          var objectStore = db.createObjectStore("reviews", { keyPath: "Key", autoIncrement: true });
          objectStore.createIndex("Key", "Key", { unique: false })
        }
      }
      openRequest.onsuccess = function (e) {
        db = e.target.result;
        // Get from DB
        if (!db.objectStoreNames.contains('restaurants') || !db.objectStoreNames.contains('reviews')) {
          reject(false);
          return;
        }
        let transactionGet = db.transaction(['reviews'], "readwrite");
        let storeGet = transactionGet.objectStore("reviews");        
        let requestGet = storeGet.getAll();
        
        requestGet.onsuccess = function (e) {
          let result = e.target.result;
          if (result.length > 0) {
            result.map((review, i) => {
              return fetch(DBHelper.REVIEWS_URL, {
                method: 'POST',
                body: JSON.stringify(review),
                headers: {
                  "Accept": "application/json"
                }
              })
              .then(response => {              
                return response;
              })
              .catch(err => {
                console.log(err);                
              });
            });
            let clearRequest = storeGet.clear();
            clearRequest.onsuccess = function (event) {
              console.log(`#${storeGet} is Cleared`);
              resolve(true);
            }
            clearRequest.onerror = function (event) {
              reject(false);
            } 
          }                   
        }
      }

    });
    
    
  }

}
