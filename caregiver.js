// ------------------------------
// PawGo CUIDADOR - JS COMPLETO
// ------------------------------

const API = "http://localhost:3000/api";

const caregiverId = localStorage.getItem("pawgoUserId");
if (!caregiverId) {
  alert("No hay sesión activa.");
  window.location.href = "index.html";
}

// ----------------------------------
// TABS
// ----------------------------------
document.querySelectorAll(".cg-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cg-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;

    document.querySelectorAll(".cg-section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(`tab-${tab}`).classList.add("active");

    if (tab === "pendientes") loadPendientes();
    if (tab === "progreso") loadProgreso();
    if (tab === "historial") loadHistorial();
  });
});

// ----------------------------------
// LOGOUT
// ----------------------------------
document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

// ----------------------------------
// CARGAR PENDIENTES
// ----------------------------------
async function loadPendientes() {
  const cont = document.getElementById("cgPendientesContainer");
  cont.innerHTML = "Cargando...";

  try {
    const res = await fetch(`${API}/paseos/pendientes-cuidador/${caregiverId}`);
    const data = await res.json();

    if (data.length === 0) {
      cont.innerHTML = "<p>No hay paseos pendientes.</p>";
      return;
    }

    cont.innerHTML = data
      .map(p => `
        <div class="cg-card">
          <h3>${p.mascota_nombre}</h3>
          <p class="cg-small">Cliente: ${p.cliente_nombre}</p>
          <button class="cg-btn-aceptar" onclick="aceptarPaseo(${p.id_reserva})">
            Aceptar Paseo
          </button>
        </div>
      `)
      .join("");

  } catch (err) {
    cont.innerHTML = "Error al cargar.";
  }
}

// ----------------------------------
// ACEPTAR PASEO
// ----------------------------------
async function aceptarPaseo(idReserva) {
  try {
    await fetch(`${API}/paseos/aceptar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_reserva: idReserva,
        id_cuidador: caregiverId
      })
    });

    alert("Paseo aceptado. Ahora está en curso.");
    startCaregiverGPS(idReserva);
    loadPendientes();
    loadProgreso();

  } catch (err) {
    alert("Error al aceptar paseo.");
  }
}


// ----------------------------------
// EN PROGRESO
// ----------------------------------
async function loadProgreso() {
  const cont = document.getElementById("cgProgresoContainer");
  cont.innerHTML = "Cargando...";

  try {
    const res = await fetch(`${API}/paseos/en-progreso-cuidador/${caregiverId}`);
    const data = await res.json();

    if (data.length === 0) {
      cont.innerHTML = "<p>No hay paseos en curso.</p>";
      return;
    }

    cont.innerHTML = data
      .map(p => `
        <div class="cg-card">
          <h3>${p.mascota_nombre}</h3>
          <p class="cg-small">Cliente: ${p.cliente_nombre}</p>
          <p class="cg-small">Estado: En curso</p>
        </div>
      `)
      .join("");

  } catch (err) {
    cont.innerHTML = "Error al cargar.";
  }
}

// ----------------------------------
// HISTORIAL
// ----------------------------------
async function loadHistorial() {
  const cont = document.getElementById("cgHistorialContainer");
  cont.innerHTML = "Cargando...";

  try {
    const res = await fetch(`${API}/paseos/historial-cuidador/${caregiverId}`);
    const data = await res.json();

    if (data.length === 0) {
      cont.innerHTML = "<p>No hay historial.</p>";
      return;
    }

    cont.innerHTML = data
      .map(p => `
        <div class="cg-card">
          <h3>${p.mascota_nombre}</h3>
          <p class="cg-small">Cliente: ${p.cliente_nombre}</p>
          <p class="cg-small">Estado: ${p.estado_paseo}</p>
        </div>
      `)
      .join("");

  } catch (err) {
    cont.innerHTML = "Error al cargar.";
  }
}
// --------------------------------------
// Enviar ubicación en vivo del cuidador
// --------------------------------------
function startCaregiverGPS(idReserva) {
  if (!navigator.geolocation) {
    alert("Este dispositivo no soporta GPS.");
    return;
  }

  navigator.geolocation.watchPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    console.log("GPS cuidador:", lat, lng);

    await fetch(`${API}/paseos/guardar-ubicacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_reserva: idReserva,
        lat,
        lng
      })
    });

  }, (err) => {
    console.log("Error GPS cuidador:", err);
  }, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 5000
  });
}


// Cargar primera vista
loadPendientes();
