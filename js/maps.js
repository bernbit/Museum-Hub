// Wait for both DOM and Leaflet to be ready
window.addEventListener("load", initializeMaps);

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyAOMZuHS95VxBjcWnWBG8hYQTkqI-vtJaY";

// User's current location - Default to Bongabong, Oriental Mindoro
let userLocation = { lat: 12.4333, lng: 121.3667 };
let museums = [];
let markers = [];
let activeMuseumIndex = null;
let userMarker = null;
let map;
let customIcon;
let userIcon;
let currentView = "map";
let isDefaultLocation = true; // Track if we're using default location

function initializeMaps() {
  // Check if we're on the maps page
  if (!document.getElementById("map")) return;

  // Initialize map (default center on Bongabong, Oriental Mindoro)
  map = L.map("map").setView([12.4333, 121.3667], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  // Custom marker icons
  customIcon = L.divIcon({
    className: "custom-marker",
    html: '<div style="background: #8b4513; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); color: white; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 16px;">🏛️</div></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  userIcon = L.divIcon({
    className: "user-marker",
    html: '<div style="background: #d4af37; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="background: white; width: 8px; height: 8px; border-radius: 50%;"></div></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  // Setup view toggle
  setupViewToggle();

  // Add default location marker
  userMarker = L.marker([userLocation.lat, userLocation.lng], {
    icon: userIcon,
  })
    .addTo(map)
    .bindPopup(
      '<div style="text-align: center; padding: 0.5rem;"><strong>📍 Bongabong, Oriental Mindoro (Default)</strong></div>',
    );

  // Display default location info
  document.getElementById("locationDisplay").innerHTML = `
    <div class="location-info">
      <span class="material-symbols-outlined" style="vertical-align: middle;">location_on</span>
      Your Location: Bongabong, Oriental Mindoro (Default)
    </div>
    <button class="location-btn" onclick="getUserLocation()">
      <span class="material-symbols-outlined">my_location</span>
      Use Current Location
    </button>
    <button class="location-btn" onclick="manualLocationSelect()" style="margin-left: 0.5rem;">
      <span class="material-symbols-outlined">edit_location</span>
      Change Location
    </button>
  `;

  // Load museums for default location
  searchNearbyMuseums(userLocation.lat, userLocation.lng);
}

// Get user's current location
// Get user's current location
function getUserLocation() {
  if ("geolocation" in navigator) {
    // Show loading state
    document.getElementById("locationDisplay").innerHTML = `
      <div class="location-info">
        <span class="material-symbols-outlined rotating" style="vertical-align: middle;">sync</span>
        Detecting your location...
      </div>
    `;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedLat = position.coords.latitude;
        const detectedLng = position.coords.longitude;

        // Console log the raw location values
        console.log("Raw Location Data:", {
          latitude: detectedLat,
          longitude: detectedLng,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toLocaleString(),
        });

        // Check if the detected location is in Philippines
        const isInPhilippines =
          detectedLat >= 4.5 &&
          detectedLat <= 21.0 &&
          detectedLng >= 116.0 &&
          detectedLng <= 127.0;

        if (!isInPhilippines) {
          console.log(
            "Location outside Philippines detected, keeping Bongabong as default",
          );
          alert(
            "Your location appears to be outside the Philippines. Keeping Bongabong, Oriental Mindoro as your location.",
          );
          // Restore default location display
          document.getElementById("locationDisplay").innerHTML = `
            <div class="location-info">
              <span class="material-symbols-outlined" style="vertical-align: middle;">location_on</span>
              Your Location: Bongabong, Oriental Mindoro (Default)
            </div>
            <div class="location-btn-group">
              <button class="location-btn" onclick="getUserLocation()">
                <span class="material-symbols-outlined">my_location</span>
                Use Current Location
              </button>
              <button class="location-btn" onclick="manualLocationSelect()">
                <span class="material-symbols-outlined">edit_location</span>
                Change Location
              </button>
            </div>
          `;
          return; // Add return here to stop execution
        } else {
          console.log("Location in Philippines confirmed");
          userLocation = {
            lat: detectedLat,
            lng: detectedLng,
          };
          isDefaultLocation = false;

          // Update user location marker
          if (userMarker) {
            map.removeLayer(userMarker);
          }

          userMarker = L.marker([userLocation.lat, userLocation.lng], {
            icon: userIcon,
          })
            .addTo(map)
            .bindPopup(
              '<div style="text-align: center; padding: 0.5rem;"><strong>📍 You are here</strong></div>',
            );

          // Center map on user location
          map.setView([userLocation.lat, userLocation.lng], 13);

          // Get location name and search for museums
          getLocationName(userLocation.lat, userLocation.lng);
          searchNearbyMuseums(userLocation.lat, userLocation.lng);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(
          "Unable to detect your location. You can manually select a location instead.",
        );
        // Restore default location display
        document.getElementById("locationDisplay").innerHTML = `
          <div class="location-info">
            <span class="material-symbols-outlined" style="vertical-align: middle;">location_on</span>
            Your Location: Bongabong, Oriental Mindoro (Default)
          </div>
          <div class="location-btn-group">
            <button class="location-btn" onclick="getUserLocation()">
              <span class="material-symbols-outlined">my_location</span>
              Use Current Location
            </button>
            <button class="location-btn" onclick="manualLocationSelect()">
              <span class="material-symbols-outlined">edit_location</span>
              Change Location
            </button>
          </div>
        `;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  } else {
    console.log("Geolocation not supported by browser");
    alert(
      "Geolocation is not supported by your browser. Please select a location manually.",
    );
  }
}
// Get location name from coordinates
async function getLocationName(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    );
    const data = await response.json();

    // Extract location details
    const city =
      data.address.city ||
      data.address.town ||
      data.address.municipality ||
      data.address.county ||
      data.address.village ||
      "Unknown Location";

    const province =
      data.address.state || data.address.province || data.address.region || "";

    // Always show "Philippines" as country
    const displayLocation = province
      ? `${city}, ${province}, Philippines`
      : `${city}, Philippines`;

    document.getElementById("locationDisplay").innerHTML = `
      <div class="location-info">
        <span class="material-symbols-outlined" style="vertical-align: middle;">location_on</span>
        Your Location: ${displayLocation}
      </div>
      <button class="location-btn" onclick="getUserLocation()">
        <span class="material-symbols-outlined">my_location</span>
        Update Location
      </button>
      <button class="location-btn" onclick="manualLocationSelect()" style="margin-left: 0.5rem;">
        <span class="material-symbols-outlined">edit_location</span>
        Change Location
      </button>
    `;
  } catch (error) {
    console.error("Error getting location name:", error);
    document.getElementById("locationDisplay").innerHTML = `
      <div class="location-info">
        <span class="material-symbols-outlined" style="vertical-align: middle;">location_on</span>
        Your Location: Philippines
      </div>
      <button class="location-btn" onclick="getUserLocation()">
        <span class="material-symbols-outlined">my_location</span>
        Update Location
      </button>
      <button class="location-btn" onclick="manualLocationSelect()" style="margin-left: 0.5rem;">
        <span class="material-symbols-outlined">edit_location</span>
        Change Location
      </button>
    `;
  }
}

// Search for nearby museums using Google Places API
async function searchNearbyMuseums(lat, lng) {
  try {
    const radius = 50000; // 50km radius
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=museum&key=${GOOGLE_MAPS_API_KEY}`;

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      museums = data.results.map((place) => ({
        name: place.name,
        location: place.vicinity,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        rating: place.rating || 0,
        reviews: place.user_ratings_total || 0,
        isOpen: place.opening_hours?.open_now,
        placeId: place.place_id,
        types: place.types,
        distance: calculateDistance(
          lat,
          lng,
          place.geometry.location.lat,
          place.geometry.location.lng,
        ),
      }));

      // Sort by distance
      museums.sort((a, b) => a.distance - b.distance);

      // Limit to 20 closest museums
      museums = museums.slice(0, 20);

      buildMuseumList();

      // Auto-select closest museum
      setTimeout(() => {
        if (museums.length > 0) {
          selectMuseum(0);
        }
      }, 500);
    } else {
      document.getElementById("museumList").innerHTML = `
        <div class="loading">
          <span class="material-symbols-outlined" style="font-size: 48px; color: #999;">museum</span>
          <p>😔 No museums found within 50km</p>
          <p style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">
            Try searching a different location or increase the search radius.
          </p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error searching museums:", error);
    // Fallback to sample museums
    loadFallbackMuseums();
  }
}

// Fallback museums if API fails
function loadFallbackMuseums() {
  museums = [
    {
      name: "Oriental Mindoro Heritage Museum",
      location: "Calapan City, Oriental Mindoro",
      lat: 13.414906499999999,
      lng: 121.1801537,
      rating: 4.8,
      reviews: 54,
      distance: userLocation
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            13.414906499999999,
            121.1801537,
          )
        : 0,
    },
    {
      name: "Oriental Mindoro Heritage and Cultural Center",
      location: "Mansalay, Oriental Mindoro",
      lat: 12.526425099999999,
      lng: 121.4539615,
      rating: 4.9,
      reviews: 55,
      distance: userLocation
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            12.526425099999999,
            121.4539615,
          )
        : 0,
    },
    {
      name: "Sablayan Museum",
      location: "Sablayan, Occidental Mindoro",
      lat: 12.847399399999999,
      lng: 120.7794528,
      rating: 4.6,
      reviews: 9,
      distance: userLocation
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            12.847399399999999,
            120.7794528,
          )
        : 0,
    },
  ];

  museums.sort((a, b) => a.distance - b.distance);
  buildMuseumList();
}

// Calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Build museum list
function buildMuseumList() {
  const museumListEl = document.getElementById("museumList");
  museumListEl.innerHTML = "";

  // Clear existing markers
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];

  museums.forEach((museum, index) => {
    // Add marker
    const marker = L.marker([museum.lat, museum.lng], {
      icon: customIcon,
    }).addTo(map).bindPopup(`
        <div class="popup-content">
          <div class="popup-title">${museum.name}</div>
          <div class="popup-info">
            ${museum.rating > 0 ? `<strong>⭐ ${museum.rating}/5</strong> (${museum.reviews} reviews)<br>` : ""}
            📍 ${museum.location}<br>
            📏 ${museum.distance.toFixed(1)} km away
          </div>
          <a href="https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${museum.lat},${museum.lng}" 
             target="_blank" class="popup-btn">
            <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 18px;">directions</span>
            Get Directions
          </a>
        </div>
      `);

    marker.on("click", () => {
      showMuseumInfo(index);
    });

    markers.push(marker);

    // Create list item
    const card = document.createElement("div");
    card.className = "museum-card";
    card.innerHTML = `
      <div class="museum-name">${museum.name}</div>
      <div class="museum-location">
        <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">location_on</span>
        ${museum.location}
      </div>
      <div class="museum-location" style="color: #d4af37; font-weight: 600;">
        <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">straighten</span>
        ${museum.distance.toFixed(1)} km away
      </div>
      <div style="margin-top: 0.5rem;">
        ${museum.rating > 0 ? `<span class="museum-rating"><span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">star</span> ${museum.rating}/5</span>` : ""}
        ${museum.isOpen !== undefined ? `<span class="museum-status ${museum.isOpen ? "status-open" : "status-closed"}">${museum.isOpen ? "🟢 Open" : "🔴 Closed"}</span>` : ""}
      </div>
    `;
    card.onclick = () => {
      selectMuseum(index);
    };
    museumListEl.appendChild(card);
  });
}

function selectMuseum(index) {
  document.querySelectorAll(".museum-card").forEach((card, i) => {
    card.classList.toggle("active", i === index);
  });

  activeMuseumIndex = index;
  const museum = museums[index];

  map.setView([museum.lat, museum.lng], 15);
  markers[index].openPopup();

  showMuseumInfo(index);

  // Update Street View if currently in Street View mode
  if (currentView === "street") {
    updateStreetView(museum.lat, museum.lng);
  }
}

function showMuseumInfo(index) {
  const museum = museums[index];
  const infoContent = document.getElementById("infoContent");

  const directionsUrl = userLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${museum.lat},${museum.lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${museum.lat},${museum.lng}`;

  infoContent.innerHTML = `
    <h3>${museum.name}</h3>
    <p style="color: #666; margin-bottom: 1rem;">
      <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle;">location_on</span>
      ${museum.location}
    </p>
    
    <div class="info-meta">
      <div class="info-meta-item">
        <span class="info-meta-label">Distance</span>
        <span class="info-meta-value">
          <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle;">straighten</span>
          ${museum.distance.toFixed(1)} km away
        </span>
      </div>
      ${
        museum.rating > 0
          ? `
      <div class="info-meta-item">
        <span class="info-meta-label">Rating</span>
        <span class="info-meta-value">
          <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle;">star</span>
          ${museum.rating}/5 (${museum.reviews} reviews)
        </span>
      </div>
      `
          : ""
      }
      ${
        museum.isOpen !== undefined
          ? `
      <div class="info-meta-item">
        <span class="info-meta-label">Status</span>
        <span class="info-meta-value">${museum.isOpen ? "🟢 Open Now" : "🔴 Closed"}</span>
      </div>
      `
          : ""
      }
    </div>

    <div class="action-buttons">
      <a href="${directionsUrl}" 
         target="_blank" class="btn btn-primary">
        <span class="material-symbols-outlined">directions_car</span>
        Get Directions from My Location
      </a>
      <a href="https://www.google.com/maps/search/?api=1&query=${museum.lat},${museum.lng}&query_place_id=${museum.placeId || ""}" 
         target="_blank" class="btn btn-secondary">
        <span class="material-symbols-outlined">map</span>
        View on Google Maps
      </a>
    </div>
  `;

  document.getElementById("infoPanel").classList.add("visible");
}

function closeInfoPanel() {
  document.getElementById("infoPanel").classList.remove("visible");
}

// View toggle functionality
function setupViewToggle() {
  const mapEl = document.getElementById("map");
  const streetViewEl = document.getElementById("streetview");

  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;

      document
        .querySelectorAll(".toggle-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      if (view === "map") {
        mapEl.style.display = "block";
        streetViewEl.style.display = "none";
        currentView = "map";
        setTimeout(() => map.invalidateSize(), 100);
      } else {
        mapEl.style.display = "none";
        streetViewEl.style.display = "block";
        currentView = "street";

        const museum =
          activeMuseumIndex !== null
            ? museums[activeMuseumIndex]
            : museums[0] || { lat: 12.4333, lng: 121.3667 };
        updateStreetView(museum.lat, museum.lng);
      }
    });
  });
}

function updateStreetView(lat, lng) {
  const streetViewEl = document.getElementById("streetview");
  streetViewEl.innerHTML = `
    <iframe 
      width="100%" 
      height="100%" 
      style="border:0;" 
      loading="lazy" 
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps/embed/v1/streetview?key=${GOOGLE_MAPS_API_KEY}&location=${lat},${lng}&heading=0&pitch=0&fov=90">
    </iframe>
  `;
}

// Manual location selection
// Manual location selection
function manualLocationSelect() {
  const locations = [
    { name: "Bongabong (Oriental Mindoro)", lat: 12.4333, lng: 121.3667 },
    { name: "Manila (Metro Manila)", lat: 14.5995, lng: 120.9842 },
    { name: "Quezon City (Metro Manila)", lat: 14.676, lng: 121.0437 },
    { name: "Cebu City (Cebu)", lat: 10.3157, lng: 123.8854 },
    { name: "Davao City (Davao)", lat: 7.1907, lng: 125.4553 },
    { name: "Makati (Metro Manila)", lat: 14.5547, lng: 121.0244 },
    { name: "Taguig (Metro Manila)", lat: 14.5176, lng: 121.0509 },
    { name: "Pasig (Metro Manila)", lat: 14.5764, lng: 121.0851 },
    { name: "Caloocan (Metro Manila)", lat: 14.6488, lng: 120.983 },
    { name: "Baguio City (Benguet)", lat: 16.4023, lng: 120.596 },
    { name: "Iloilo City (Iloilo)", lat: 10.7202, lng: 122.5621 },
    { name: "Calapan City (Oriental Mindoro)", lat: 13.4119, lng: 121.1803 },
    { name: "Boracay (Aklan)", lat: 11.9674, lng: 121.9248 },
  ];

  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  const content = document.createElement("div");
  content.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
  `;

  content.innerHTML = `
    <h3 style="font-family: var(--font-display); color: var(--color-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
      <span class="material-symbols-outlined">edit_location</span>
      Select Your Location
    </h3>
    <div id="locationOptions" style="display: grid; gap: 0.5rem;">
      ${locations
        .map(
          (loc, index) => `
        <button class="location-option" data-index="${index}" style="
          padding: 1rem;
          border: 2px solid var(--color-border);
          border-radius: 8px;
          background: white;
          cursor: pointer;
          text-align: left;
          font-size: 1rem;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        " onmouseover="this.style.borderColor='var(--color-primary)'; this.style.background='var(--color-bg-secondary)';" 
           onmouseout="this.style.borderColor='var(--color-border)'; this.style.background='white';">
          <span class="material-symbols-outlined">location_on</span>
          ${loc.name}
        </button>
      `,
        )
        .join("")}
    </div>
    <button id="closeLocationModal" style="
      margin-top: 1rem;
      padding: 0.8rem 1.5rem;
      background: var(--color-border);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    ">
      <span class="material-symbols-outlined">close</span>
      Cancel
    </button>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Add event listeners for location options
  document.querySelectorAll(".location-option").forEach((btn, index) => {
    btn.addEventListener("click", () => {
      const selectedLoc = locations[index];
      userLocation = { lat: selectedLoc.lat, lng: selectedLoc.lng };
      isDefaultLocation = selectedLoc.name === "Bongabong (Oriental Mindoro)";

      // Update marker
      if (userMarker) {
        map.removeLayer(userMarker);
      }

      userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
      })
        .addTo(map)
        .bindPopup(
          `<div style="text-align: center; padding: 0.5rem;"><strong>📍 ${selectedLoc.name}</strong></div>`,
        );

      map.setView([userLocation.lat, userLocation.lng], 13);

      document.getElementById("locationDisplay").innerHTML = `
        <div class="location-info">
          <span class="material-symbols-outlined" style="vertical-align: middle;">location_on</span>
          Selected Location: ${selectedLoc.name}
        </div>
        <div class="location-btn-group">
          <button class="location-btn" onclick="getUserLocation()">
            <span class="material-symbols-outlined">my_location</span>
            Use Current Location
          </button>
          <button class="location-btn" onclick="manualLocationSelect()">
            <span class="material-symbols-outlined">edit_location</span>
            Change Location
          </button>
        </div>
      `;

      searchNearbyMuseums(userLocation.lat, userLocation.lng);
      modal.remove();
    });
  });

  // Add event listener for close button
  document
    .getElementById("closeLocationModal")
    .addEventListener("click", () => {
      modal.remove();
    });

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}
