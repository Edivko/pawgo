// pets.js (refactor sin estado global)

(function () {
  // Estado PRIVADO (ya no global)
  let pets = [];
  let selectedPetId = null;

  // Contenedores UI
  const petsContainer = document.getElementById("pets-container");
  const petsScheduleContainer = document.getElementById("pets-schedule-container");
  const petsVipContainer = document.getElementById("pets-vip-container");

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
  <button class="icon-round btn-pet-settings" data-pet-id="${pet.id}">⚙️</button>
`;


      petsContainer.appendChild(row);
    });
  }

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

  async function loadPetsFromBackend() {
    const userId = localStorage.getItem("pawgoUserId");
    if (!userId) {
      // sin sesión: limpiar UI
      pets = [];
      selectedPetId = null;
      renderPets(); renderPetsSchedule(); renderPetsVip();
      return;
    }

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

    // Si el selected ya no existe, lo limpiamos
    if (selectedPetId && !pets.some(p => p.id === selectedPetId)) {
      selectedPetId = null;
    }

    renderPets();
    renderPetsSchedule();
    renderPetsVip();
  }

  async function refresh() {
    try {
      await loadPetsFromBackend();
    } catch (err) {
      console.error("Error cargando mascotas:", err);
    }
  }

  function reset() {
    pets = [];
    selectedPetId = null;
    renderPets();
    renderPetsSchedule();
    renderPetsVip();
  }

  // Selección (usa estado interno)
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".pet-chip-selectable");
    if (!chip) return;

    selectedPetId = Number(chip.dataset.petId);
    renderPetsSchedule();
    renderPetsVip();
  });
  // Configuración: guardar mascota y navegar (en orden correcto)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-pet-settings");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const petId = Number(btn.dataset.petId);
  localStorage.setItem("pawgoSelectedPetId", String(petId));

  if (typeof showScreen === "function") showScreen("screen-pet-settings");
});


  // Form registrar mascota (usa estado interno)
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

        // Tras crear, refrescamos desde BD (evita inconsistencias)
        formPetRegister.reset();
        await refresh();

        if (typeof showScreen === "function") showScreen("screen-home");
      } catch (err) {
        console.error(err);
        alert("Error conectando con el servidor.");
      }
    });
  }

  // Form VIP (usa estado interno)
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

      const diaVip = formVipWalk.diaVip.value;

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
          let text = "Tu paseo fue solicitado. En cuanto un cuidador lo acepte, te aparecerá asignado en tus paseos.";
          if (pet || dateValue) {
            text = "Hemos registrado tu solicitud de paseo";
            if (pet) text += ` para ${pet.name}`;
            if (dateValue) text += ` el ${dateValue}`;
            if (diaVip === "manana") text += " por la mañana";
            else if (diaVip === "tarde") text += " por la tarde";
            text += ". En cuanto un cuidador lo acepte, te aparecerá asignado.";
          }
          confirmedTextEl.textContent = text;
        }

        formVipWalk.reset();
        if (typeof showScreen === "function") showScreen("screen-walk-confirmed");
      } catch (err) {
        console.error(err);
        alert("Error conectando con el servidor.");
      }
    });
  }


  // API pública (para auth.js / navegación)
  window.Pets = { refresh, reset };
})();