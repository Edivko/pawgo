// caregiver.js

// -------- helpers visuales de edición --------
function setProfileEditing(isEditing) {
  const form = document.getElementById("form-caregiver-profile");
  const btnEdit = document.getElementById("btn-edit-profile");
  const btnSave = document.getElementById("btn-save-profile");
  if (!form) return;

  form.dataset.editing = isEditing ? "true" : "false";

  const fields = form.querySelectorAll("input, textarea");
  fields.forEach((el) => {
    el.disabled = !isEditing;
  });

  if (btnSave) btnSave.disabled = !isEditing;
  if (btnEdit) btnEdit.textContent = isEditing ? "Cancelar" : "Editar";
}

function setTarifasEditing(isEditing) {
  const form = document.getElementById("form-caregiver-tarifas");
  const btnEdit = document.getElementById("btn-edit-tarifas");
  const btnSave = document.getElementById("btn-save-tarifas");
  if (!form) return;

  form.dataset.editing = isEditing ? "true" : "false";

  const fields = form.querySelectorAll("input");
  fields.forEach((el) => {
    el.disabled = !isEditing;
  });

  if (btnSave) btnSave.disabled = !isEditing;
  if (btnEdit) btnEdit.textContent = isEditing ? "Cancelar" : "Editar";
}

// -------- tarjetas de reservas --------
function buildReservaCard(r) {
  const fecha = (r.fecha || "").slice(0, 10);
  const horaInicio = (r.hora_inicio || "").slice(0, 5);
  const horaFin = (r.hora_fin || "").slice(0, 5);
  const nombreCliente = `${r.nombre_cliente || ""} ${
    r.apellidos_cliente || ""
  }`.trim();

  return `
    <div class="card reserva-card">
      <p><strong>${fecha}</strong> ${horaInicio} - ${horaFin}</p>
      <p>Mascota: ${r.nombre_mascota} (${r.tamano})</p>
      <p>Cliente: ${nombreCliente}</p>
      <p>Estado: ${r.estado}</p>
    </div>
  `;
}

// -------- cargar datos al entrar al home cuidador --------
async function loadCaregiverHome() {
  const id = localStorage.getItem("pawgoUserId");
  if (!id) return;

  const nameSpan = document.getElementById("caregiver-name");
  if (nameSpan) {
    nameSpan.textContent = currentUserName || "Cuidador";
  }

  try {
    const [perfilResp, reservasResp, tarifasResp] = await Promise.all([
      apiGetCaregiverProfile(id),
      apiGetCaregiverReservas(id),
      apiGetCaregiverTarifas(id),
    ]);

    // ---- Perfil ----
    if (perfilResp.ok && perfilResp.perfil) {
      const p = perfilResp.perfil;
      const desc = document.getElementById("caregiver-descripcion");
      const exp = document.getElementById("caregiver-experiencia");
      const tel = document.getElementById("caregiver-telefono");
      const ratingEl = document.getElementById("caregiver-rating");
      const servEl = document.getElementById("caregiver-services");

      if (desc) desc.value = p.descripcion || "";
      if (exp)
        exp.value =
          p.experiencia_anios !== null && p.experiencia_anios !== undefined
            ? p.experiencia_anios
            : "";
      if (tel) tel.value = p.telefono || "";

      if (ratingEl) {
        const rating =
          p.rating_promedio !== null && p.rating_promedio !== undefined
            ? Number(p.rating_promedio).toFixed(2)
            : "0.00";
        ratingEl.textContent = `Rating promedio: ${rating} ⭐`;
      }
      if (servEl) {
        const total = p.total_servicios || 0;
        servEl.textContent = `Servicios completados: ${total}`;
      }
    }

    // ---- Tarifas ----
    if (tarifasResp.ok && Array.isArray(tarifasResp.tarifas)) {
      const tMap = { chico: null, mediano: null, grande: null };
      tarifasResp.tarifas.forEach((t) => {
        if (t.tamano_perro === "chico") tMap.chico = t.precio;
        if (t.tamano_perro === "mediano") tMap.mediano = t.precio;
        if (t.tamano_perro === "grande") tMap.grande = t.precio;
      });

      const inChico = document.getElementById("tarifa-chico");
      const inMediano = document.getElementById("tarifa-mediano");
      const inGrande = document.getElementById("tarifa-grande");

      if (inChico) inChico.value = tMap.chico != null ? tMap.chico : "";
      if (inMediano) inMediano.value = tMap.mediano != null ? tMap.mediano : "";
      if (inGrande) inGrande.value = tMap.grande != null ? tMap.grande : "";
    }

    // ---- Reservas ----
    const cont = document.getElementById("caregiver-reservas");
    if (cont) {
      cont.innerHTML = "";
      if (reservasResp.ok && reservasResp.reservas.length > 0) {
        cont.innerHTML = reservasResp.reservas
          .map((r) => buildReservaCard(r))
          .join("");
      } else {
        cont.innerHTML = "<p>No tienes paseos aún.</p>";
      }
    }

    // Después de cargar datos, dejamos todo en modo solo lectura
    setProfileEditing(false);
    setTarifasEditing(false);
  } catch (err) {
    console.error(err);
  }
}

// -------- listeners de DOM --------
document.addEventListener("DOMContentLoaded", () => {
  // Botón editar perfil
  const btnEditProfile = document.getElementById("btn-edit-profile");
  if (btnEditProfile) {
    btnEditProfile.addEventListener("click", () => {
      const form = document.getElementById("form-caregiver-profile");
      const editing = form && form.dataset.editing === "true";
      if (editing) {
        // cancelar -> recargamos datos del servidor y bloqueamos
        loadCaregiverHome();
      } else {
        setProfileEditing(true);
      }
    });
  }

  // Guardar perfil
  const formPerfil = document.getElementById("form-caregiver-profile");
  if (formPerfil) {
    formPerfil.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (formPerfil.dataset.editing !== "true") {
        // si no está en modo edición, ignoramos
        return;
      }

      const id = localStorage.getItem("pawgoUserId");
      if (!id) return;

      const descripcion = formPerfil.descripcion.value.trim();
      const experiencia_anios = parseInt(
        formPerfil.experiencia_anios.value || "0",
        10
      );
      const telefono = formPerfil.telefono.value.trim();

      try {
        const resp = await apiUpdateCaregiverProfile(id, {
          descripcion,
          experiencia_anios: isNaN(experiencia_anios) ? 0 : experiencia_anios,
          telefono,
        });

        if (!resp.ok) {
          alert(resp.message || "Error al guardar perfil.");
          return;
        }

        alert("Perfil actualizado.");
        // Volvemos a cargar datos y salimos de modo edición
        await loadCaregiverHome();
      } catch (err) {
        console.error(err);
        alert("Error de conexión al guardar perfil.");
      }
    });
  }

  // Botón editar tarifas
  const btnEditTarifas = document.getElementById("btn-edit-tarifas");
  if (btnEditTarifas) {
    btnEditTarifas.addEventListener("click", () => {
      const form = document.getElementById("form-caregiver-tarifas");
      const editing = form && form.dataset.editing === "true";
      if (editing) {
        // cancelar -> recargamos datos
        loadCaregiverHome();
      } else {
        setTarifasEditing(true);
      }
    });
  }

  // Guardar tarifas
  const formTarifas = document.getElementById("form-caregiver-tarifas");
  if (formTarifas) {
    formTarifas.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (formTarifas.dataset.editing !== "true") {
        return;
      }

      const id = localStorage.getItem("pawgoUserId");
      if (!id) return;

      const chico = formTarifas.chico.value;
      const mediano = formTarifas.mediano.value;
      const grande = formTarifas.grande.value;

      const data = {
        id_servicio: 1, // Paseo estándar
        chico,
        mediano,
        grande,
        moneda: "MXN",
      };

      try {
        const resp = await apiSaveCaregiverTarifas(id, data);
        if (!resp.ok) {
          alert(resp.message || "Error al guardar tarifas.");
          return;
        }
        alert("Tarifas guardadas correctamente.");
        await loadCaregiverHome();
      } catch (err) {
        console.error(err);
        alert("Error de conexión al guardar tarifas.");
      }
    });
  }
});
