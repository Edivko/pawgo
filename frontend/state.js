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

  // Efectos al entrar a ciertas pantallas
  if (
    id === "screen-schedule-walk" &&
    typeof renderPetsSchedule === "function"
  ) {
    renderPetsSchedule();
  }

  if (id === "screen-vip-pets" && typeof renderPetsVip === "function") {
    renderPetsVip();
  }

  if (
    id === "screen-caregiver-home" &&
    typeof loadCaregiverHome === "function"
  ) {
    loadCaregiverHome();
  }

  if (
    id === "screen-home" &&
    typeof esCliente === "function" &&
    esCliente() &&
    typeof loadClientReservas === "function"
  ) {
    loadClientReservas();
  }
  if (
  id === "screen-notifications" &&
  typeof renderNotificationsScreen === "function"
) {
  renderNotificationsScreen();
}
if (id === "screen-profile" && typeof renderProfile === "function") {
  renderProfile();
}
if (id === "screen-home" && window.Pets) {
  window.Pets.refresh();
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
    if (
      nextId === "screen-schedule-walk" &&
      typeof renderPetsSchedule === "function"
    ) {
      renderPetsSchedule();
    }

    // Cuando el usuario entra a "VIP Pets"
    if (
      nextId === "screen-vip-pets" &&
      typeof renderPetsVip === "function"
    ) {
      renderPetsVip();
    }
        // Cuando el usuario entra al Home de cuidador
    if (
      nextId === "screen-caregiver-home" &&
      typeof loadCaregiverHome === "function"
    ) {
      loadCaregiverHome();
    }

  }
});

// Nombre del usuario actual
let currentUserName = localStorage.getItem("pawgoUserName") || "Usuario";

// Rol del usuario actual (cliente / cuidador / admin)
let currentUserRole = localStorage.getItem("pawgoUserRole") || "cliente";

// Helpers por si quieres usarlos en otros archivos
function esCliente() {
  return currentUserRole === "cliente";
}

function esCuidador() {
  return currentUserRole === "cuidador";
}

// Inicialización al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  if (typeof renderWelcomeName === "function") {
    renderWelcomeName();
  }
  if (typeof initMap === "function") {
    initMap();
  }
});

