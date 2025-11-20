// Estado global
let pets = ["Ostin", "Kira"];
let selectedPetForWalk = null;
let selectedDay = null;
let currentUserName = "José";

let userTempData = {}; // datos de registro antes de contacto

const screens = {};
let petListHome, petListSchedule, petListDetails;

// Inicializar cuando carga el DOM
window.addEventListener("DOMContentLoaded", () => {
  screens.welcome = document.getElementById("screen-welcome");
  screens.registerUser = document.getElementById("screen-register-user");
  screens.contact = document.getElementById("screen-contact");
  screens.home = document.getElementById("screen-home");
  screens.registerPet = document.getElementById("screen-register-pet");
  screens.schedule = document.getElementById("screen-schedule");
  screens.walkDetails = document.getElementById("screen-walk-details");

  petListHome = document.getElementById("petListHome");
  petListSchedule = document.getElementById("petListSchedule");
  petListDetails = document.getElementById("petListDetails");

  initNavigation();
  initWelcome();
  initHome();
  initRegisterUser();
  initContact();
  initRegisterPet();
  initSchedule();
  initWalkDetails();

  renderPetListHome();
  renderCalendar();
  updateWelcomeName();
});

// Cambiar de pantalla
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

/* ========= BIENVENIDA ========= */
function initWelcome() {
  const btnLogin = document.getElementById("btnStartLogin");
  const btnRegister = document.getElementById("btnStartRegister");

  btnLogin.addEventListener("click", () => {
    // Login de demo: entra directo al home con nombre por defecto
    currentUserName = "José";
    updateWelcomeName();
    showScreen("home");
  });

  btnRegister.addEventListener("click", () => {
    showScreen("registerUser");
  });
}

/* ========= NAVEGACIÓN COMÚN ========= */
function initNavigation() {
  document.getElementById("btnLogout").addEventListener("click", () => {
    showScreen("welcome");
  });

  document.querySelectorAll(".back-link").forEach(link => {
    link.addEventListener("click", () => {
      showScreen(link.dataset.target);
    });
  });

  document.getElementById("btnGoSchedule").addEventListener("click", () => {
    showScreen("schedule");
    renderPetListSchedule();
  });

  document.getElementById("btnGoRegisterPet").addEventListener("click", () => {
    showScreen("registerPet");
  });
}

/* ========= HOME ========= */
function initHome() {
  document.getElementById("btnAddPet").addEventListener("click", () => {
    const input = document.getElementById("newPetName");
    const name = input.value.trim();
    if (!name) return;
    pets.push(name);
    input.value = "";
    renderPetListHome();
  });
}

function renderPetListHome() {
  petListHome.innerHTML = "";
  pets.forEach(name => {
    const row = document.createElement("div");
    row.className = "pet-row";

    const left = document.createElement("button");
    left.className = "pet-chip";
    left.innerHTML = `<span class="pet-ears">🐶</span><span>${name}</span>`;

    const gear = document.createElement("button");
    gear.className = "gear-btn";
    gear.textContent = "⚙";

    row.appendChild(left);
    row.appendChild(gear);
    petListHome.appendChild(row);
  });
}

function updateWelcomeName() {
  const span = document.getElementById("welcomeName");
  if (span) span.textContent = currentUserName;
}

/* ========= REGISTRO DE USUARIO ========= */
function initRegisterUser() {
  document.getElementById("btnContinueUser").addEventListener("click", () => {
    const name = document.getElementById("uName").value.trim();
    const last1 = document.getElementById("uLast1").value.trim();
    const last2 = document.getElementById("uLast2").value.trim();
    const email = document.getElementById("uEmail").value.trim();
    const pass1 = document.getElementById("uPass").value;
    const pass2 = document.getElementById("uPass2").value;

    if (!name || !email || !pass1 || !pass2) {
      alert("Llena al menos nombre, correo y contraseñas.");
      return;
    }
    if (pass1 !== pass2) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    userTempData = { name, last1, last2, email };
    showScreen("contact");
  });
}

/* ========= DATOS DE CONTACTO ========= */
function initContact() {
  document.getElementById("btnContinueContact").addEventListener("click", () => {
    const street = document.getElementById("cStreet").value.trim();
    const zip = document.getElementById("cZip").value.trim();
    const alcaldia = document.getElementById("cAlcaldia").value.trim();
    const colonia = document.getElementById("cColonia").value.trim();
    const phone = document.getElementById("cPhone").value.trim();

    // Guardamos solo para demo
    const addressText = document.getElementById("addressText");
    if (street || alcaldia || colonia || zip) {
      addressText.textContent =
        (street || "") +
        (colonia ? ", " + colonia : "") +
        (alcaldia ? ", " + alcaldia : "") +
        (zip ? ", CP " + zip : "");
    }

    currentUserName = userTempData.name || "Usuario";
    updateWelcomeName();

    console.log("Datos de contacto:", { street, zip, alcaldia, colonia, phone });

    showScreen("home");
  });
}

/* ========= REGISTRO DE MASCOTA ========= */
function initRegisterPet() {
  const genderSelect = document.getElementById("genderSelectPet");
  const sterSelect = document.getElementById("sterilizedSelectPet");

  genderSelect.querySelectorAll(".chip-option").forEach(chip => {
    chip.addEventListener("click", () => {
      genderSelect.querySelectorAll(".chip-option").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
    });
  });

  sterSelect.querySelectorAll(".chip-option").forEach(chip => {
    chip.addEventListener("click", () => {
      sterSelect.querySelectorAll(".chip-option").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
    });
  });

  document.getElementById("btnSavePetForm").addEventListener("click", () => {
    const name = document.getElementById("pName").value.trim();
    if (!name) {
      alert("Escribe el nombre de la mascota.");
      return;
    }
    pets.push(name);
    renderPetListHome();
    alert("Mascota registrada.");
    showScreen("home");
  });
}

/* ========= AGENDAR PASEO – PASO 1 ========= */
function initSchedule() {
  document.getElementById("btnContinueSchedule").addEventListener("click", () => {
    if (!selectedPetForWalk) {
      alert("Selecciona una mascota.");
      return;
    }
    if (!selectedDay) {
      alert("Selecciona un día.");
      return;
    }
    renderPetListDetails();
    showScreen("walkDetails");
  });
}

function renderPetListSchedule() {
  petListSchedule.innerHTML = "";
  pets.forEach(name => {
    const row = document.createElement("div");
    row.className = "pet-select-row";

    const btn = document.createElement("button");
    btn.className = "pet-select-btn inactive";
    btn.innerHTML = `<span class="pet-ears">🐶</span><span>${name}</span>`;

    btn.addEventListener("click", () => {
      selectedPetForWalk = name;
      Array.from(petListSchedule.querySelectorAll(".pet-select-btn"))
        .forEach(b => b.classList.add("inactive"));
      btn.classList.remove("inactive");
    });

    const check = document.createElement("span");
    check.className = "check-icon";
    check.textContent = "✔";

    row.appendChild(btn);
    row.appendChild(check);
    petListSchedule.appendChild(row);
  });
}

/* ========= CALENDARIO SIMPLE (NOVIEMBRE 2025) ========= */
function renderCalendar() {
  const calendarGrid = document.getElementById("calendarGrid");
  const dayNames = ["D", "L", "M", "M", "J", "V", "S"];
  calendarGrid.innerHTML = "";

  dayNames.forEach(d => {
    const cell = document.createElement("div");
    cell.className = "calendar-day-name";
    cell.textContent = d;
    calendarGrid.appendChild(cell);
  });

  const firstDayWeekIndex = 6; // sábado
  const daysInMonth = 30;

  for (let i = 0; i < firstDayWeekIndex; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-day inactive";
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.textContent = day;

    cell.addEventListener("click", () => {
      selectedDay = day;
      calendarGrid.querySelectorAll(".calendar-day").forEach(c => c.classList.remove("selected"));
      cell.classList.add("selected");
    });

    calendarGrid.appendChild(cell);
  }
}

/* ========= AGENDAR PASEO – PASO 2 ========= */
function initWalkDetails() {
  document.getElementById("btnConfirmWalk").addEventListener("click", () => {
    const age = document.getElementById("wAge").value;
    const weight = document.getElementById("wWeight").value;
    const size = document.getElementById("wSize").value;

    alert(
      `Paseo confirmado:\n\nMascota: ${selectedPetForWalk}\nDía: ${selectedDay} de noviembre 2025\nEdad: ${age || "s/d"}\nPeso: ${weight || "s/d"} kg\nTamaño: ${size || "s/d"}`
    );
    showScreen("home");
  });
}

function renderPetListDetails() {
  petListDetails.innerHTML = "";
  pets.forEach(name => {
    const row = document.createElement("div");
    row.className = "pet-row";

    const btn = document.createElement("button");
    btn.className = "pet-chip";
    btn.innerHTML = `<span class="pet-ears">🐶</span><span>${name}</span>`;

    if (name !== selectedPetForWalk) {
      btn.style.opacity = "0.4";
    }

    row.appendChild(btn);
    petListDetails.appendChild(row);
  });
}
