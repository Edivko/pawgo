// caregiver.js

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

async function loadCaregiverHome() {
  const id = localStorage.getItem("pawgoUserId");
  if (!id) return;

  const nameSpan = document.getElementById("caregiver-name");
  if (nameSpan) {
    nameSpan.textContent = currentUserName || "Cuidador";
  }

  try {
    const [perfilResp, reservasResp] = await Promise.all([
      apiGetCaregiverProfile(id),
      apiGetCaregiverReservas(id),
    ]);

    if (perfilResp.ok && perfilResp.perfil) {
      const p = perfilResp.perfil;
      const desc = document.getElementById("caregiver-descripcion");
      const exp = document.getElementById("caregiver-experiencia");
      const tel = document.getElementById("caregiver-telefono");

      if (desc) desc.value = p.descripcion || "";
      if (exp)
        exp.value =
          p.experiencia_anios !== null && p.experiencia_anios !== undefined
            ? p.experiencia_anios
            : "";
      if (tel) tel.value = p.telefono || "";
    }

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
  } catch (err) {
    console.error(err);
  }
}

// Guardar perfil al enviar el formulario
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-caregiver-profile");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = localStorage.getItem("pawgoUserId");
    if (!id) return;

    const descripcion = form.descripcion.value.trim();
    const experiencia_anios = parseInt(
      form.experiencia_anios.value || "0",
      10
    );
    const telefono = form.telefono.value.trim();

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
    } catch (err) {
      console.error(err);
      alert("Error de conexión al guardar perfil.");
    }
  });
});
