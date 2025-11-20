// pets.js
// Manejo de mascotas en Home, Agendar paseo y VIP Pets

// Contenedores de UI
const petsContainer = document.getElementById("pets-container");
const petsScheduleContainer = document.getElementById("pets-schedule-container");
const petsVipContainer = document.getElementById("pets-vip-container");

// -------- RENDER EN HOME --------
function renderPets() {
  if (!petsContainer) return;

  petsContainer.innerHTML = "";

  if (pets.length === 0) {
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

  if (pets.length === 0) {
    petsScheduleContainer.innerHTML =
      `<p style="font-size:13px;color:#666;">No tienes mascotas registradas.</p>`;
    return;
  }

  pets.forEach(pet => {
    const isSelected = pet.id === selectedPetId;

    const row = document.createElement("div");
    row.className = "pet-row";

    row.innerHTML = `
      <span class="pet-icon">🐶</span>
      <button class="pet-chip pet-chip-selectable ${isSelected ? 'selected' : ''}"
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

  if (pets.length === 0) {
    petsVipContainer.innerHTML =
      `<p style="font-size:13px;color:#666;">No tienes mascotas registradas.</p>`;
    return;
  }

  pets.forEach(pet => {
    const isSelected = pet.id === selectedPetId;

    const row = document.createElement("div");
    row.className = "pet-row";

    row.innerHTML = `
      <span class="pet-icon">🐶</span>
      <button class="pet-chip pet-chip-selectable ${isSelected ? 'selected' : ''}"
              data-pet-id="${pet.id}">
        ${pet.name}
      </button>
    `;

    petsVipContainer.appendChild(row);
  });
}


// -------- SELECCIONAR MASCOTA (chips clickeables) --------
document.addEventListener("click", (e) => {
  const chip = e.target.closest(".pet-chip-selectable");
  if (!chip) return;

  const petId = Number(chip.dataset.petId);
  selectedPetId = petId;

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

    if (!nombreMascota) {
      alert("Ingresa el nombre de la mascota.");
      formPetRegister.nombreMascota.focus();
      return;
    }

    // En un futuro, mandar al backend:
    let newPet = {
      name: nombreMascota,
      // aquí podrías agregar raza, edad, peso, etc.
    };

    try {
      const resp = await apiCreatePet(newPet);
      if (resp && resp.id) {
        newPet.id = resp.id;
      } else {
        // fallback si el backend no devuelve id
        newPet.id = Date.now();
      }
    } catch (err) {
      console.error(err);
      // fallback local
      newPet.id = Date.now();
    }

    pets.push(newPet);

    // Mascota recién agregada queda seleccionada por defecto
    selectedPetId = newPet.id;

    formPetRegister.reset();

    // Volver al home y redibujar
    showScreen("screen-home");
    renderPets();
  });
}
// -------- FORMULARIO: CONFIRMAR PASEO VIP --------
const formVipWalk = document.getElementById("form-vip-walk");

if (formVipWalk) {
  formVipWalk.addEventListener("submit", (e) => {
    e.preventDefault();

    // Debe haber una mascota seleccionada
    if (!selectedPetId) {
      alert("Selecciona una mascota para agendar el paseo.");
      return;
    }

    const pet = pets.find((p) => p.id === selectedPetId);

    // Tomar la fecha si existe el input de calendario
    const dateInput = document.getElementById("walk-date");
    const dateValue = dateInput ? dateInput.value : "";

    const confirmedTextEl = document.getElementById("confirmed-text");
    if (confirmedTextEl) {
      let text = "Tu paseo ha sido agendado correctamente.";
      if (pet || dateValue) {
        text = "Hemos agendado el paseo";
        if (pet) text += ` para ${pet.name}`;
        if (dateValue) text += ` el ${dateValue}`;
        text += ".";
      }
      confirmedTextEl.textContent = text;
    }

    // Opcional: limpiar formulario VIP
    formVipWalk.reset();

    // Ir a la pantalla de confirmación
    showScreen("screen-walk-confirmed");
  });
}
