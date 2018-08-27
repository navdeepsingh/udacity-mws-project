let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {    
  fetchRestaurantFromURL();
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = () => {
  if (self.restaurant) { // restaurant already fetched!
    console.log('Already Fetched');    
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    console.error(error);
  } else {
    DBHelper.fetchRestaurantById(id)
      .then(restaurant => {
        
        self.restaurant = restaurant;
        
        // Init Map
        self.map = new google.maps.Map(document.getElementById('map'), {
          zoom: 16,
          center: self.restaurant.latlng,
          scrollwheel: false
        });
        fillBreadcrumb();
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);

        if (!restaurant) {
          console.error(error);
          return;
        }
        fillRestaurantHTML();
        bindFavoriteRestaurant();
        bindReviewForm();
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  let [imageName, imageExtension] = image.src.split('.', 2);

  const imageSource = document.getElementById('restaurant-img-source');
  imageSource.setAttribute('srcset', `${imageName}-small.${imageExtension}`);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach((review, i) => {
    ul.appendChild(createReviewHTML(review, i));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review, index) => {
  const li = document.createElement('li');
  li.setAttribute('tabIndex', 0);
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  const timestamp = new Date(review.createdAt);
  const todate = new Date(timestamp).getDate();
  const tomonth = new Date(timestamp).getMonth() + 1;
  const toyear = new Date(timestamp).getFullYear();
  const original_date = tomonth + '/' + todate + '/' + toyear;
  date.innerHTML = original_date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


/**
 * Bind favorite toggle feature here.
 */
bindFavoriteRestaurant = (restaurant = self.restaurant) => {
  const favToggleElem = document.querySelector('.restaurant-fav-toggle');
  let isFav;
  
  if (restaurant.is_favorite == 'true') {
    favToggleElem.classList.add('fav');
    favToggleElem.setAttribute('title', 'Mark this Unfavorite.');
    isFav = false;
  } else {
    favToggleElem.classList.remove('fav');
    favToggleElem.setAttribute('title', 'Mark this Favorite.');
    isFav = true;
  }
  
  favToggleElem.addEventListener('click', function(e) {
    e.preventDefault();  
    DBHelper.toggleFavoriteRestaurant(restaurant, isFav, favToggleElem)
    .then(response => {
      isFav = response;      
      if (!isFav) {
        favToggleElem.setAttribute('title', 'Mark this Unfavorite.');
      } else {
        favToggleElem.setAttribute('title', 'Mark this Favorite.');
      }
    });
  });
}

/**
 * Bind review form
 */
bindReviewForm = (restaurant = self.restaurant) => {
  const formElement = document.querySelector('form#reviewForm');
  const buttonElement = formElement.querySelector('button');
  const successMsg = formElement.querySelector('.success');
  formElement.addEventListener('submit', function (e) {
    e.preventDefault();
    successMsg.style.visibility = 'hidden';
    buttonElement.innerHTML = 'SUBMITTING...'
    buttonElement.setAttribute('disabled', true);
    
    const formData = new FormData(formElement);
    
    DBHelper.postRestaurantReview(restaurant, formData)
    .then(result => {
      if (result) {
        successMsg.innerHTML = '🕺 Form is submitted successfully.';
        resetForm(formElement, buttonElement, successMsg);
      } 
    })
    .catch(err => {
      successMsg.innerHTML = 'Form Saved Offline.';
      resetForm(formElement, buttonElement, successMsg);
    });
  });
}

resetForm = (formElement, buttonElement, successMsg) => {
  formElement.reset();
  buttonElement.innerHTML = 'SUBMIT';
  buttonElement.removeAttribute('disabled');
  successMsg.style.visibility = 'visible';
}
