async function renderPetSettings() {
  const container = document.getElementById("pet-settings-container");
  if (!container) return;

  const userId = localStorage.getItem("pawgoUserId");
  const petId = localStorage.getItem("pawgoSelectedPetId");

  if (!userId) {
    container.innerHTML = "Primero inicia sesión.";
    return;
  }
  if (!petId) {
    container.innerHTML = "Mascota no seleccionada.";
    return;
  }

  container.innerHTML = "Cargando mascota...";

  try {
    const resp = await apiGetMascotaById(petId, userId);
    if (!resp.ok) {
      container.innerHTML = resp.message || "No se pudo cargar la mascota.";
      return;
    }

    const p = resp.mascota;

    container.innerHTML = `
      <div class="card">
        <h3 class="section-title">Datos de la mascota</h3>

        <label class="field">
          <span class="field-label">Nombre</span>
          <input class="input-line" name="nombre" value="${p.nombre || ""}" />
        </label>

        <div class="field-row">
          <label class="field">
            <span class="field-label">Raza</span>
            <input class="input-line" name="raza" value="${p.raza || ""}" />
          </label>
          <label class="field small">
            <span class="field-label">Tamaño</span>
            <input class="input-line" name="tamano" value="${p.tamano || ""}" />
          </label>
        </div>

        <div class="field-row">
          <label class="field small">
            <span class="field-label">Edad</span>
            <input class="input-line" type="number" min="0" name="edad" value="${p.edad ?? ""}" />
          </label>
          <label class="field small">
            <span class="field-label">Peso (kg)</span>
            <input class="input-line" type="number" step="0.1" min="0" name="peso" value="${p.peso ?? ""}" />
          </label>
        </div>

        <label class="field">
          <span class="field-label">Notas médicas</span>
          <textarea class="input-line" name="notas_medicas" rows="3">${p.notas_medicas || ""}</textarea>
        </label>

        <button id="btn-save-pet" class="btn btn-primary" type="button">
          Guardar
        </button>
      </div>
    `;

    container.querySelector("#btn-save-pet")?.addEventListener("click", async () => {
      const nombre = container.querySelector('input[name="nombre"]')?.value?.trim() || "";
      if (!nombre) {
        alert("El nombre es obligatorio.");
        return;
      }

      const payload = {
        id_dueno: userId,
        nombre,
        raza: container.querySelector('input[name="raza"]')?.value?.trim() || "",
        tamano: container.querySelector('input[name="tamano"]')?.value?.trim() || "",
        edad: container.querySelector('input[name="edad"]')?.value || null,
        peso: container.querySelector('input[name="peso"]')?.value || null,
        notas_medicas: container.querySelector('textarea[name="notas_medicas"]')?.value?.trim() || "",
      };

      const saveResp = await apiUpdateMascota(petId, payload);
      if (!saveResp.ok) {
        alert(saveResp.message || "Error al guardar.");
        return;
      }

      // Refrescar lista en Home (tu Pets.refresh ya existe)
      if (window.Pets) await window.Pets.refresh();

      alert("Mascota actualizada.");
      showScreen("screen-home");
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "Error conectando con el servidor.";
  }
}

window.renderPetSettings = renderPetSettings;
