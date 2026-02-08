//* ===== GALLERY & METROPOLITAN MUSEUM API =====
const API_BASE_URL = "https://collectionapi.metmuseum.org/public/collection/v1";

// Category mappings to Met Museum department IDs with search queries
const CATEGORIES = {
  all: { query: "painting", name: "All Highlights" },
  ancient: { departmentId: 10, query: "sculpture", name: "Egyptian Art" },
  fantasy: {
    departmentId: 12,
    query: "gold",
    name: "European Decorative Arts",
  },
  legendary: {
    departmentId: 13,
    query: "statue",
    name: "Greek and Roman Art",
  },
  enchanted: { departmentId: 4, query: "sword", name: "Arms and Armor" },
};

let currentCategory = "all";
let currentObjectIds = [];
let displayedCount = 0;
const ITEMS_PER_PAGE = 12;
let favorites = JSON.parse(localStorage.getItem("museumFavorites")) || [];

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadGallery("all");
  setupFilterButtons();
});

// Setup filter buttons
function setupFilterButtons() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");
      currentCategory = filter;
      loadGallery(filter);
    });
  });
}

// Load gallery based on category
async function loadGallery(category) {
  const galleryGrid = document.getElementById("galleryGrid");
  galleryGrid.innerHTML = ""; // Clear grid first
  showLoading();
  displayedCount = 0;
  currentObjectIds = [];

  try {
    let url;
    const categoryInfo = CATEGORIES[category];

    if (category === "all") {
      // Get highlights with paintings
      url = `${API_BASE_URL}/search?hasImages=true&isHighlight=true&q=${categoryInfo.query}`;
    } else {
      // Use department ID with specific search query
      url = `${API_BASE_URL}/search?departmentId=${categoryInfo.departmentId}&hasImages=true&q=${categoryInfo.query}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.objectIDs && data.objectIDs.length > 0) {
      currentObjectIds = data.objectIDs;
      galleryGrid.innerHTML = ""; // Clear loading state
      loadMoreItems();
    } else {
      showEmptyState();
    }
  } catch (error) {
    console.error("Error loading gallery:", error);
    showError();
  }
}

// Load more items
async function loadMoreItems() {
  const galleryGrid = document.getElementById("galleryGrid");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const loadMoreContainer = document.getElementById("loadMoreContainer");

  // Reset grid styles
  galleryGrid.style.position = "static";
  galleryGrid.style.minHeight = "auto";

  loadMoreBtn.disabled = true;
  loadMoreBtn.textContent = "Loading...";

  const startIndex = displayedCount;
  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    currentObjectIds.length,
  );
  const idsToLoad = currentObjectIds.slice(startIndex, endIndex);

  for (const id of idsToLoad) {
    try {
      const response = await fetch(`${API_BASE_URL}/objects/${id}`);
      const artwork = await response.json();

      if (artwork.primaryImage) {
        const item = createGalleryItem(artwork);
        galleryGrid.appendChild(item);
        displayedCount++;
      }
    } catch (error) {
      console.error(`Error loading object ${id}:`, error);
    }
  }

  // Show/hide load more button
  if (displayedCount < currentObjectIds.length) {
    loadMoreContainer.style.display = "flex";
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = "Load More";
  } else {
    loadMoreContainer.style.display = "none";
  }
}

// Create gallery item element
function createGalleryItem(artwork) {
  const item = document.createElement("div");
  item.className = "gallery-item";

  const isFavorited = favorites.includes(artwork.objectID);

  item.innerHTML = `
          <img src="${artwork.primaryImageSmall || artwork.primaryImage}" alt="${artwork.title}" loading="lazy">
          <button class="favorite-btn ${isFavorited ? "favorited" : ""}" data-id="${artwork.objectID}">
            <span class="material-symbols-outlined heart-icon">favorite</span>
          </button>
          <div class="item-info">
            <div class="item-title">${artwork.title || "Untitled"}</div>
            <div class="item-artist">${artwork.artistDisplayName || "Unknown Artist"}</div>
          </div>
        `;

  // Click on item to show details
  item.querySelector("img").addEventListener("click", () => {
    showArtworkDetails(artwork);
  });

  // Favorite button
  const favoriteBtn = item.querySelector(".favorite-btn");
  favoriteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(artwork.objectID, favoriteBtn, artwork);
  });

  return item;
}

// Toggle favorite
function toggleFavorite(objectId, button, artwork) {
  const index = favorites.indexOf(objectId);

  if (index > -1) {
    // Remove from favorites
    favorites.splice(index, 1);
    button.classList.remove("favorited");
  } else {
    // Add to favorites with full artwork data
    favorites.push(objectId);
    button.classList.add("favorited");

    // Store artwork data for favorites page
    let favoritesData =
      JSON.parse(localStorage.getItem("museumFavoritesData")) || {};
    favoritesData[objectId] = {
      objectID: artwork.objectID,
      title: artwork.title,
      artistDisplayName: artwork.artistDisplayName,
      primaryImage: artwork.primaryImage,
      primaryImageSmall: artwork.primaryImageSmall,
      objectDate: artwork.objectDate,
      department: artwork.department,
      medium: artwork.medium,
    };
    localStorage.setItem("museumFavoritesData", JSON.stringify(favoritesData));
  }

  localStorage.setItem("museumFavorites", JSON.stringify(favorites));
}

// Show artwork details in modal
function showArtworkDetails(artwork) {
  const modal = document.getElementById("artworkModal");
  const modalImage = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalArtist = document.getElementById("modalArtist");
  const modalDetails = document.getElementById("modalDetails");

  modalImage.src = artwork.primaryImage || artwork.primaryImageSmall;
  modalTitle.textContent = artwork.title || "Untitled";
  modalArtist.textContent = artwork.artistDisplayName || "Unknown Artist";

  let detailsHTML = "";
  if (artwork.objectDate) {
    detailsHTML += `<div class="modal-detail"><strong>Date:</strong><span>${artwork.objectDate}</span></div>`;
  }
  if (artwork.medium) {
    detailsHTML += `<div class="modal-detail"><strong>Medium:</strong><span>${artwork.medium}</span></div>`;
  }
  if (artwork.department) {
    detailsHTML += `<div class="modal-detail"><strong>Department:</strong><span>${artwork.department}</span></div>`;
  }
  if (artwork.culture) {
    detailsHTML += `<div class="modal-detail"><strong>Culture:</strong><span>${artwork.culture}</span></div>`;
  }
  if (artwork.classification) {
    detailsHTML += `<div class="modal-detail"><strong>Type:</strong><span>${artwork.classification}</span></div>`;
  }

  modalDetails.innerHTML = detailsHTML;
  modal.classList.add("active");
}

// Close modal
function closeModal() {
  document.getElementById("artworkModal").classList.remove("active");
}

// Close modal on background click
document.getElementById("artworkModal").addEventListener("click", (e) => {
  if (e.target.id === "artworkModal") {
    closeModal();
  }
});

// Load more button
document.getElementById("loadMoreBtn").addEventListener("click", loadMoreItems);

// Show loading state
function showLoading() {
  const galleryGrid = document.getElementById("galleryGrid");
  galleryGrid.innerHTML = `
          <div class="loading-state" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; text-align: center;">
            <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
            <p>Loading amazing artworks...</p>
          </div>
        `;
  galleryGrid.style.position = "relative";
  galleryGrid.style.minHeight = "400px";
  document.getElementById("loadMoreContainer").style.display = "none";
}

// Show empty state
function showEmptyState() {
  const galleryGrid = document.getElementById("galleryGrid");
  galleryGrid.innerHTML = `
          <div class="empty-state" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; text-align: center;">
            <div class="empty-state-icon">🏛️</div>
            <h3>No artworks found</h3>
            <p>Try selecting a different category</p>
          </div>
        `;
  galleryGrid.style.position = "relative";
  galleryGrid.style.minHeight = "400px";
  document.getElementById("loadMoreContainer").style.display = "none";
}

// Show error state
function showError() {
  const galleryGrid = document.getElementById("galleryGrid");
  galleryGrid.innerHTML = `
          <div class="empty-state" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; text-align: center;">
            <div class="empty-state-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p>Please try again later</p>
          </div>
        `;
  galleryGrid.style.position = "relative";
  galleryGrid.style.minHeight = "400px";
  document.getElementById("loadMoreContainer").style.display = "none";
}
