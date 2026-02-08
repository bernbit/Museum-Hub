//* ===== FAVORITES PAGE =====
let favorites = JSON.parse(localStorage.getItem("museumFavorites")) || [];
let favoritesData =
  JSON.parse(localStorage.getItem("museumFavoritesData")) || {};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadFavorites();
});

// Load favorites
function loadFavorites() {
  const favoritesGrid = document.getElementById("favoritesGrid");
  const favoritesStats = document.getElementById("favoritesStats");
  const favoritesCount = document.getElementById("favoritesCount");

  // Clear grid
  favoritesGrid.innerHTML = "";

  if (favorites.length === 0) {
    showEmptyState();
    favoritesStats.style.display = "none";
    return;
  }

  // Show stats
  favoritesStats.style.display = "flex";
  favoritesCount.textContent = favorites.length;

  // Display favorites
  favorites.forEach((objectId) => {
    const artwork = favoritesData[objectId];
    if (artwork) {
      const item = createFavoriteItem(artwork);
      favoritesGrid.appendChild(item);
    }
  });
}

// Create favorite item element
function createFavoriteItem(artwork) {
  const item = document.createElement("div");
  item.className = "gallery-item";
  item.dataset.objectId = artwork.objectID;

  item.innerHTML = `
          <img src="${artwork.primaryImageSmall || artwork.primaryImage}" alt="${artwork.title}" loading="lazy">
          <button class="remove-btn" data-id="${artwork.objectID}">
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

  // Remove button
  const removeBtn = item.querySelector(".remove-btn");
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    removeFavorite(artwork.objectID, item);
  });

  return item;
}

// Remove favorite
function removeFavorite(objectId, itemElement) {
  // Remove from favorites array
  const index = favorites.indexOf(objectId);
  if (index > -1) {
    favorites.splice(index, 1);
  }

  // Remove from favorites data
  delete favoritesData[objectId];

  // Update localStorage
  localStorage.setItem("museumFavorites", JSON.stringify(favorites));
  localStorage.setItem("museumFavoritesData", JSON.stringify(favoritesData));

  // Animate removal
  itemElement.style.transition = "all 0.3s ease";
  itemElement.style.opacity = "0";
  itemElement.style.transform = "scale(0.8)";

  setTimeout(() => {
    itemElement.remove();

    // Update count
    document.getElementById("favoritesCount").textContent = favorites.length;

    // Show empty state if no favorites left
    if (favorites.length === 0) {
      showEmptyState();
      document.getElementById("favoritesStats").style.display = "none";
    }
  }, 300);
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

// Show confirmation modal
function confirmClearAll() {
  document.getElementById("confirmModal").classList.add("active");
}

// Close confirmation modal
function closeConfirmModal() {
  document.getElementById("confirmModal").classList.remove("active");
}

// Clear all favorites
function clearAllFavorites() {
  // Clear localStorage
  localStorage.removeItem("museumFavorites");
  localStorage.removeItem("museumFavoritesData");

  // Clear arrays
  favorites = [];
  favoritesData = {};

  // Close confirmation modal
  closeConfirmModal();

  // Reload favorites (will show empty state)
  loadFavorites();
}

// Show empty state
function showEmptyState() {
  const favoritesGrid = document.getElementById("favoritesGrid");
  favoritesGrid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <span class="material-symbols-outlined empty-state-icon">heart_broken</span>
            <h3>No Favorites Yet</h3>
            <p>Start building your personal collection by adding artworks from the gallery!</p>
            <a href="./" class="browse-btn">Browse Gallery</a>
          </div>
        `;
}
