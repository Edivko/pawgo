// pets.js
// Manejo de mascotas en Home, Agendar paseo y VIP Pets

// Se asume que existen variables globales en otro archivo:
//   let pets = [];           // lista de mascotas
//   let selectedPetId = null;

// Contenedores de UI
const petsContainer = document.getElementById("pets-container");
const petsScheduleContainer = document.getElementById("pets-schedule-container");
const petsVipContainer = document.getElementById("pets-vip-container");

// -------- RENDER EN HOME --------
function renderPets() {
  if (!petsContainer) return;

  petsContainer.innerHTML = "";

  if (!pets || pets.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.textContent = "Aún no tienes mascotas registradas.";
    emptyMsg.style.fontSize = "13px";
    emptyMsg.style.color = "#666";
    emptyMsg.style.marginBottom = "8px";
    petsContainer.appendChild(emptyMsg);
    return;
  }

  pets.forEach((pet) => {
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

// -------- RENDER EN AGENDAR PASEO --------
function renderPetsSchedule() {
  if (!petsScheduleContainer) return;

  petsScheduleContainer.innerHTML = "";

  if (!pets || pets.length === 0) {
    petsScheduleContainer.innerHTML =
      `<p style="font-size:13px;color:#666;">No tienes mascotas registradas.</p>`;
    return;
  }

  pets.forEach((pet) => {
    const isSelected = pet.id === selectedPetId;

    const row = document.createElement("div");
    row.className = "pet-row";

    row.innerHTML = `
      <span class="pet-icon">🐶</span>
      <button class="pet-chip pet-chip-selectable ${isSelected ? "selected" : ""}"
              data-pet-id="${pet.id}">
        ${pet.name}
      </button>
    `;

    petsScheduleContainer.appendChild(row);
  });
}

// -------- RENDER EN VIP PETS --------
function renderPetsVip() {
  if (!petsVipContainer) return;

  petsVipContainer.innerHTML = "";

  if (!pets || pets.length === 0) {
    petsVipContainer.innerHTML =
      `<p style="font-size:13px;color:#666;">No tienes mascotas registradas.</p>`;
    return;
  }

  pets.forEach((pet) => {
    const isSelected = pet.id === selectedPetId;

    const row = document.createElement("div");
    row.className = "pet-row";

    row.innerHTML = `
      <span class="pet-icon">🐶</span>
      <button class="pet-chip pet-chip-selectable ${isSelected ? "selected" : ""}"
              data-pet-id="${pet.id}">
        ${pet.name}
      </button>
    `;

    petsVipContainer.appendChild(row);
  });
}

// -------- CARGAR MASCOTAS DESDE EL BACKEND --------
async function loadPetsFromBackend() {
  const userId = localStorage.getItem("pawgoUserId");
  if (!userId) return;

  try {
    const resp = await apiGetMascotas(userId);
    if (!resp.ok) {
      console.warn(resp.message || "No se pudieron cargar mascotas");
      return;
    }

    pets = (resp.mascotas || []).map((row) => ({
      id: row.id_mascota,
      name: row.nombre,
      size: row.tamano,
      raw: row,
    }));

    renderPets();
    renderPetsSchedule();
    renderPetsVip();
  } catch (err) {
    console.error("Error cargando mascotas:", err);
  }
}

async function refreshPetsUI() {
  await loadPetsFromBackend();
}

// -------- SELECCIONAR MASCOTA (chips clickeables) --------
document.addEventListener("click", (e) => {
  const chip = e.target.closest(".pet-chip-selectable");
  if (!chip) return;

  const petId = Number(chip.dataset.petId);
  selectedPetId = petId;

  renderPetsSchedule();
  renderPetsVip();
});

// -------- FORMULARIO: REGISTRAR MASCOTA --------
const formPetRegister = document.getElementById("form-pet-register");

if (formPetRegister) {
  formPetRegister.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("pawgoUserId");
    if (!userId) {
      alert("Primero inicia sesión o regístrate.");
      return;
    }

    const nombreMascota = formPetRegister.nombreMascota.value.trim();
    const raza = formPetRegister.raza.value.trim();
    const edad = formPetRegister.edad.value.trim();
    const peso = formPetRegister.peso.value.trim();
    const tamano = formPetRegister.tamano.value.trim();

    if (!nombreMascota) {
      alert("Ingresa el nombre de la mascota.");
      formPetRegister.nombreMascota.focus();
      return;
    }

    try {
      const resp = await apiCreatePet({
        id_dueno: userId,
        nombreMascota,
        raza,
        edad,
        peso,
        tamano,
      });

      if (!resp.ok) {
        alert(resp.message || "Error al registrar mascota.");
        return;
      }

      const newPet = {
        id: resp.id_mascota || Date.now(),
        name: nombreMascota,
        size: tamano,
      };

      pets.push(newPet);
      selectedPetId = newPet.id;

      formPetRegister.reset();

      renderPets();
      renderPetsSchedule();
      renderPetsVip();

      if (typeof showScreen === "function") {
        showScreen("screen-home");
      } else {
        document
          .querySelectorAll(".screen")
          .forEach((s) => s.classList.remove("active"));
        document.getElementById("screen-home")?.classList.add("active");
      }
    } catch (err) {
      console.error(err);
      alert("Error conectando con el servidor.");
    }
  });
}

// -------- FORMULARIO: CONFIRMAR PASEO VIP --------
const formVipWalk = document.getElementById("form-vip-walk");

if (formVipWalk) {
  formVipWalk.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("pawgoUserId");
    if (!userId) {
      alert("Primero inicia sesión o regístrate.");
      return;
    }

    if (!selectedPetId) {
      alert("Selecciona una mascota para agendar el paseo.");
      return;
    }

    const pet = pets.find((p) => p.id === selectedPetId);

    const dateInput = document.getElementById("walk-date");
    const dateValue = dateInput ? dateInput.value : "";
    if (!dateValue) {
      alert("Selecciona la fecha del paseo.");
      return;
    }

    const diaVip = formVipWalk.diaVip.value; // mañana / tarde / ""

    try {
      const resp = await apiCreateReserva({
        id_cliente: userId,
        id_mascota: selectedPetId,
        fecha: dateValue,
        diaVip,
      });

      if (!resp.ok) {
        alert(resp.message || "Error al agendar paseo.");
        return;
      }

      const confirmedTextEl = document.getElementById("confirmed-text");
      if (confirmedTextEl) {
        let text = "Tu paseo ha sido agendado correctamente.";
        if (pet || dateValue) {
          text = "Hemos agendado el paseo";
          if (pet) text += ` para ${pet.name}`;
          if (dateValue) text += ` el ${dateValue}`;
          if (diaVip === "manana") text += " por la mañana";
          else if (diaVip === "tarde") text += " por la tarde";
          text += ".";
        }
        confirmedTextEl.textContent = text;
      }

      formVipWalk.reset();

      if (typeof showScreen === "function") {
        showScreen("screen-walk-confirmed");
      } else {
        document
          .querySelectorAll(".screen")
          .forEach((s) => s.classList.remove("active"));
        document
          .getElementById("screen-walk-confirmed")
          ?.classList.add("active");
      }
    } catch (err) {
      console.error(err);
      alert("Error conectando con el servidor.");
    }
  });
}

// -------- Al cargar la página, traer mascotas de la BD --------
document.addEventListener("DOMContentLoaded", () => {
  refreshPetsUI();
});
