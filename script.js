//* Sidebar Script
const ANIMATION_DURATION = 300;
const SIDEBAR_EL = document.getElementById("sidebar");

// Sidebar collapse handler
document.getElementById("btn-collapse").addEventListener("click", () => {
  SIDEBAR_EL.classList.toggle("collapsed");
});

// Sidebar toggle handler (mobile)
document.getElementById("btn-toggle").addEventListener("click", (e) => {
  e.preventDefault();
  SIDEBAR_EL.classList.toggle("toggled");
});

// Toggle sidebar on overlay click
document.getElementById("overlay").addEventListener("click", () => {
  SIDEBAR_EL.classList.toggle("toggled");
});

// Active menu item handling
const menuItems = document.querySelectorAll(".menu-item a");
menuItems.forEach((item) => {
  item.addEventListener("click", function (e) {
    e.preventDefault();
    document
      .querySelectorAll(".menu-item")
      .forEach((mi) => mi.classList.remove("active"));
    this.parentElement.classList.add("active");
  });
});
