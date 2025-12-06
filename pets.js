// pets.js
// Manejo de mascotas en Home, Agendar paseo y VIP Pets

// Contenedores de UI
const petsContainer = document.getElementById("pets-container");
const petsScheduleContainer = document.getElementById("pets-schedule-container");
const petsVipContainer = document.getElementById("pets-vip-container");

// ids de mascotas seleccionadas para paseo
let selectedPetIds = [];

// -------- HELPERS --------
function isPetSelected(petId) {
  return selectedPetIds.includes(petId);
}

function getPetId(pet) {
  return pet.id_mascota || pet.id;
}

function getPetName(pet) {
  return pet.nombre || pet.name;
}

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
      <button class="pet-chip">${getPetName(pet)}</button>
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
    const id = getPetId(pet);
    const selectedClass = isPetSelected(id) ? "selected" : "";

    const row = document.createElement("div");
    row.className = "pet-row";

    row.innerHTML = `
      <span class="pet-icon">🐶</span>
      <button class="pet-chip pet-chip-selectable ${selectedClass}"
              data-pet-id="${id}">
        ${getPetName(pet)}
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
    const id = getPetId(pet);
    const selectedClass = isPetSelected(id) ? "selected" : "";

    const row = document.createElement("div");
    row.className = "pet-row";

    row.innerHTML = `
      <span class="pet-icon">🐶</span>
      <button class="pet-chip pet-chip-selectable ${selectedClass}"
              data-pet-id="${id}">
        ${getPetName(pet)}
      </button>
    `;

    petsVipContainer.appendChild(row);
  });
}

// -------- SELECCIONAR / DESELECCIONAR MASCOTAS (chips clickeables) --------
document.addEventListener("click", (e) => {
  const chip = e.target.closest(".pet-chip-selectable");
  if (!chip) return;

  const petId = Number(chip.dataset.petId);
  if (!petId) return;

  const idx = selectedPetIds.indexOf(petId);
  if (idx === -1) {
    selectedPetIds.push(petId);      // agregar
  } else {
    selectedPetIds.splice(idx, 1);   // quitar
  }

  // Volvemos a dibujar listas donde aparece la selección
  renderPetsSchedule();
  renderPetsVip();
});

// -------- FORMULARIO: REGISTRAR MASCOTA --------
const formPetRegister = document.getElementById("form-pet-register");

if (formPetRegister) {
  formPetRegister.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombreMascota = formPetRegister.nombreMascota.value.trim();
    const raza = formPetRegister.raza.value.trim();
    const edad = formPetRegister.edad.value ? Number(formPetRegister.edad.value) : null;
    const peso = formPetRegister.peso.value ? Number(formPetRegister.peso.value) : null;
    const tamano = formPetRegister.tamano.value.trim(); // CH, M, G

    if (!nombreMascota) {
      alert("Ingresa el nombre de la mascota.");
      formPetRegister.nombreMascota.focus();
      return;
    }

    const userId =
      (currentUser && (currentUser.user_id || currentUser.id_usuario)) ||
      Number(localStorage.getItem("pawgoUserId"));

    if (!userId) {
      alert("No se encontró el usuario actual. Vuelve a iniciar sesión.");
      return;
    }

    const payload = {
      duenoId: userId,
      nombre: nombreMascota,
      raza,
      edad,
      peso,
      tamano,
    };

    try {
      const resp = await apiCreatePet(payload);

      if (!resp.ok) {
        alert(resp.message || "No se pudo guardar la mascota.");
        return;
      }

      const newPet = {
        id_mascota: resp.id,
        nombre: nombreMascota,
        raza,
        edad,
        peso,
        tamano,
      };

      pets.push(newPet);

      // La nueva mascota queda seleccionada por defecto para paseo
      selectedPetIds.push(newPet.id_mascota);

      formPetRegister.reset();

      showScreen("screen-home");
      renderPets();
      renderPetsSchedule();
      renderPetsVip();
    } catch (err) {
      console.error(err);
      alert("Error al registrar mascota.");
    }
  });
}

// -------- FORMULARIO: CONFIRMAR PASEO VIP --------
const formVipWalk = document.getElementById("form-vip-walk");

if (formVipWalk) {
  formVipWalk.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!selectedPetIds.length) {
      alert("Selecciona al menos una mascota para agendar el paseo.");
      return;
    }

    // Turno (mañana / tarde)
    const turno = formVipWalk.diaVip.value;
    if (!turno) {
      alert("Selecciona el turno del día.");
      return;
    }

    // Fecha desde el input de la pantalla de calendario (puede ser null)
    const dateInput = document.getElementById("walk-date");
    const dateValue = dateInput ? dateInput.value : null;

    const userId =
      (currentUser && (currentUser.user_id || currentUser.id_usuario)) ||
      Number(localStorage.getItem("pawgoUserId"));

    if (!userId) {
      alert("No se encontró el usuario actual. Vuelve a iniciar sesión.");
      return;
    }

    try {
      const body = {
        userId,
        petIds: selectedPetIds,
        date: dateValue,
        turno,
      };

      console.log("Body que se envía a /api/paseos:", body);

      const resp = await apiAgendarVip(body);

      if (!resp.ok) {
        alert(resp.message || "No se pudo agendar el paseo.");
        return;
      }

      const confirmedTextEl = document.getElementById("confirmed-text");
      if (confirmedTextEl) {
        let texto = "Paseo agendado correctamente.";
        if (dateValue) texto += ` Fecha: ${dateValue}.`;
        texto += ` Turno: ${turno}.`;
        confirmedTextEl.textContent = texto;
      }

      selectedPetIds = [];
      formVipWalk.reset();

      showScreen("screen-walk-confirmed");
    } catch (err) {
      console.error("Error al agendar paseo VIP:", err);
      alert("Error al agendar paseo VIP.");
    }
  });
}
