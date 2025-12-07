// client-reservas.js

function buildClientReservaCard(r) {
  const fecha = (r.fecha || "").slice(0, 10);
  const horaInicio = (r.hora_inicio || "").slice(0, 5);
  const horaFin = (r.hora_fin || "").slice(0, 5);
  const nombreCuidador = `${r.nombre_cuidador || ""} ${
    r.apellidos_cuidador || ""
  }`.trim();
  const estado = r.estado;

  // Solo se puede cancelar si está pendiente o confirmada
  const puedeCancelar =
    estado === "pendiente" || estado === "confirmada";

  return `
    <div class="card reserva-card">
      <p><strong>${fecha}</strong> ${horaInicio} - ${horaFin}</p>
      <p>Mascota: ${r.nombre_mascota} (${r.tamano})</p>
      <p>Cuidador: ${nombreCuidador}</p>
      <p>Estado: ${estado}</p>
      ${
        puedeCancelar
          ? `<button
               type="button"
               class="btn-outline-sm btn-cancel-reserva"
               data-reserva-id="${r.id_reserva}"
             >
               Cancelar paseo
             </button>`
          : ""
      }
    </div>
  `;
}

async function loadClientReservas() {
  const idCliente = localStorage.getItem("pawgoUserId");
  if (!idCliente) return;

  const cont = document.getElementById("client-reservas");
  if (!cont) return;

  try {
    const resp = await apiGetClientReservas(idCliente);
    if (!resp.ok) {
      cont.innerHTML =
        "<p>No se pudieron cargar tus paseos.</p>";
      return;
    }

    const reservas = resp.reservas || [];
    if (reservas.length === 0) {
      cont.innerHTML = "<p>No tienes paseos próximos.</p>";
      return;
    }

    cont.innerHTML = reservas
      .map((r) => buildClientReservaCard(r))
      .join("");
  } catch (err) {
    console.error(err);
    cont.innerHTML =
      "<p>Error al cargar tus paseos.</p>";
  }
}

// Delegamos el click para cancelar
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-cancel-reserva");
  if (!btn) return;

  const idReserva = btn.getAttribute("data-reserva-id");
  if (!idReserva) return;

  const confirmar = window.confirm(
    "¿Seguro que quieres cancelar este paseo?"
  );
  if (!confirmar) return;

  const idCliente = localStorage.getItem("pawgoUserId");
  if (!idCliente) return;

  try {
    const resp = await apiCancelReserva(
      idReserva,
      idCliente,
      "Cancelado por el cliente"
    );

    if (!resp.ok) {
      alert(resp.message || "No se pudo cancelar el paseo.");
      return;
    }

    alert("Paseo cancelado.");
    loadClientReservas();
  } catch (err) {
    console.error(err);
    alert("Error de conexión al cancelar paseo.");
  }
});
