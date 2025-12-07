// Cambiar entre pantallas
function showScreen(id) {
  const screens = document.querySelectorAll(".screen");
  screens.forEach((s) => s.classList.remove("active"));

  const target = document.getElementById(id);
  if (target) {
    target.classList.add("active");
    target.scrollTop = 0;
  }
}

// --------- MASCOTAS (MODELO SIMPLE EN MEMORIA) ---------
// Lista de mascotas: empieza vacía
const pets = [];

const petsContainer = document.getElementById("pets-container");

function renderPets() {
  if (!petsContainer) return;

  petsContainer.innerHTML = "";

  pets.forEach(pet => {
    const row = document.createElement("div");
    row.className = "pet-row";

    row.innerHTML = `
      <span class="pet-icon">🐶</span>
      <button class="pet-chip">${pet.name}</button>
      <button class="icon-round">⚙️</button>
    `;

    petsContainer.appendChild(row);
  });
}

// --------- MASCOTAS PARA AGENDAR PASEO ---------

const petsScheduleContainer = document.getElementById("pets-schedule-container");
const petsVipContainer = document.getElementById("pets-vip-container");

function renderPetsSchedule() {
  if (!petsScheduleContainer) return;

  petsScheduleContainer.innerHTML = "";

  if (pets.length === 0) {
    petsScheduleContainer.innerHTML = `<p style="font-size:13px;color:#666;">No tienes mascotas registradas.</p>`;
    return;
  }

  pets.forEach(pet => {
    const row = document.createElement("div");
    row.className = "pet-row";

    row.innerHTML = `
      <span class="pet-icon">🐶</span>
      <button class="pet-chip">${pet.name}</button>
    `;

    petsScheduleContainer.appendChild(row);
  });
}

function renderPetsVip() {
  if (!petsVipContainer) return;

  petsVipContainer.innerHTML = "";

  if (pets.length === 0) {
    petsVipContainer.innerHTML = `<p style="font-size:13px;color:#666;">No tienes mascotas registradas.</p>`;
    return;
  }

  pets.forEach(pet => {
    const row = document.createElement("div");
    row.className = "pet-row";

    row.innerHTML = `
      <span class="pet-icon">🐶</span>
      <button class="pet-chip">${pet.name}</button>
    `;

    petsVipContainer.appendChild(row);
  });
}


// Llamamos una vez al cargar para que aparezcan Ostin y Kira
renderPets();

// Navegación con data-next (botones de continuar / back)
document.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-next]");
  if (!btn) return;

  const nextId = btn.getAttribute("data-next");
  if (nextId) {
    event.preventDefault();
    showScreen(nextId);

    // 👇 Cuando el usuario entra a "Agendar Paseo"
    if (nextId === "screen-schedule-walk") {
      renderPetsSchedule();
    }

    // 👇 Cuando el usuario entra a "VIP Pets"
    if (nextId === "screen-vip-pets") {
      renderPetsVip();
    }
  }
});


// ---------- FORMULARIOS ----------

// 1) Registro - datos de contacto
const formRegister2 = document.getElementById("form-register-2");
const btnRegister2 = document.getElementById("btn-register-2");

btnRegister2.addEventListener("click", () => {
  const calle = formRegister2.calle.value.trim();
  const cp = formRegister2.cp.value.trim();

  if (!calle) {
    alert("Por favor ingresa la calle.");
    formRegister2.calle.focus();
    return;
  }

  if (!cp) {
    alert("Por favor ingresa el código postal.");
    formRegister2.cp.focus();
    return;
  }

  // Aquí podrías mandar los datos al backend
  alert("Registro completado (ejemplo).");
  showScreen("screen-home");
});

// 2) Login (simulado)
const formLogin = document.getElementById("form-login");

formLogin.addEventListener("submit", (e) => {
  e.preventDefault();

  const correo = formLogin.correoLogin.value.trim();
  const password = formLogin.passwordLogin.value.trim();

  if (!correo || !password) {
    alert("Ingresa correo y contraseña.");
    return;
  }

  // Aquí iría la llamada real al backend
  alert("Inicio de sesión exitoso (ejemplo).");
  showScreen("screen-home");
});

// 3) Registrar mascota
// 3) Registrar mascota
const formPetRegister = document.getElementById("form-pet-register");

formPetRegister.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombreMascota = formPetRegister.nombreMascota.value.trim();
  
  if (!nombreMascota) {
    alert("Ingresa el nombre de la mascota.");
    formPetRegister.nombreMascota.focus();
    return;
  }

  // Agregar mascota a la lista
  pets.push({
    id: Date.now(),
    name: nombreMascota
  });

  formPetRegister.reset();

  // Volver al home y redibujar la lista de mascotas
  showScreen("screen-home");
  renderPets();
});
