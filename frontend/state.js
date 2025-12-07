// state.js
// Estado global y navegación básica de pantallas

// -------- NAVEGACIÓN ENTRE PANTALLAS --------
function showScreen(id) {
  const screens = document.querySelectorAll(".screen");
  screens.forEach((s) => s.classList.remove("active"));

  const target = document.getElementById(id);
  if (target) {
    target.classList.add("active");
    target.scrollTop = 0;
  }
}

// Cambiar de pantalla con botones que tengan data-next="id"
document.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-next]");
  if (!btn) return;

  const nextId = btn.getAttribute("data-next");
  if (nextId) {
    event.preventDefault();
    showScreen(nextId);

    // Cuando el usuario entra a "Agendar Paseo"
    if (nextId === "screen-schedule-walk" && typeof renderPetsSchedule === "function") {
      renderPetsSchedule();
    }

    // Cuando el usuario entra a "VIP Pets"
    if (nextId === "screen-vip-pets" && typeof renderPetsVip === "function") {
      renderPetsVip();
    }
  }
});

// -------- ESTADO GLOBAL --------

// Lista de mascotas (se llenará desde el formulario y en un futuro desde la BD)
let pets = [];

// Mascota seleccionada para paseo
let selectedPetId = null;

// Nombre del usuario actual
let currentUserName = localStorage.getItem("pawgoUserName") || "Usuario";

// Inicialización al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  if (typeof renderWelcomeName === "function") {
    renderWelcomeName();
  }

  if (typeof renderPets === "function") {
    renderPets();
  }

  if (typeof initMap === "function") {
    initMap();
  }
});
