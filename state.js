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

// Nombre del usuario actual (lo usa auth.js también)
let currentUserName = localStorage.getItem("pawgoUserName") || "Usuario";

// Usuario logueado
let currentUser = null;

// Lista de mascotas del usuario logueado
let pets = [];

// Cargar mascotas del usuario logueado desde el backend
async function loadPetsForCurrentUser() {
  if (!currentUser) {
    // intentar recuperar de localStorage
    const storedId = Number(localStorage.getItem("pawgoUserId"));
    if (!storedId) return;
    currentUser = { user_id: storedId };
  }

  try {
    const userId = currentUser.user_id || currentUser.id_usuario;
    if (!userId) return;

    const data = await apiGetPets(userId);
    // data debe ser un arreglo de mascotas devuelto por el backend
    pets = Array.isArray(data) ? data : [];

    if (typeof renderPets === "function") renderPets();
    if (typeof renderPetsSchedule === "function") renderPetsSchedule();
    if (typeof renderPetsVip === "function") renderPetsVip();
  } catch (err) {
    console.error("Error al cargar mascotas:", err);
  }
}

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
