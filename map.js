// map.js
// Manejo del mapa embebido, dirección y ubicación del usuario (cliente)

const API_BASE = "http://localhost:3000";

// ID de la reserva actual (el paseo que está activo o recién agendado)
let currentReservaId = null;

// Coordenadas del cliente (home)
let homeLat = null;
let homeLng = null;

// Intervalo para seguir al cuidador en vivo
let liveFollowInterval = null;

// ------------------------------------------
// Actualizar iframe por DIRECCIÓN
// ------------------------------------------
function updateMapFromAddress(address) {
  const iframe = document.getElementById("map-iframe");
  if (!iframe) return;

  if (!address) {
    iframe.src = "";
    return;
  }

  const query = encodeURIComponent(address);
  iframe.src = `https://www.google.com/maps?q=${query}&z=16&output=embed`;
}

// ------------------------------------------
// Actualizar iframe por COORDENADAS
// ------------------------------------------
function updateMapFromCoords(lat, lng) {
  const iframe = document.getElementById("map-iframe");
  if (!iframe) return;

  if (lat == null || lng == null) {
    iframe.src = "";
    return;
  }

  iframe.src = `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
}

// ------------------------------------------
// Inicialización del mapa y dirección
// ------------------------------------------
function initMap() {
  const homeAddressInput = document.getElementById("home-address");
  const btnUseLocation = document.getElementById("btn-use-location");

  // Cargar datos almacenados
  const storedAddress = localStorage.getItem("pawgoAddress");
  const storedLat = localStorage.getItem("pawgoLat");
  const storedLng = localStorage.getItem("pawgoLng");

  if (storedLat && storedLng) {
    homeLat = parseFloat(storedLat);
    homeLng = parseFloat(storedLng);
    updateMapFromCoords(homeLat, homeLng);
  } else if (storedAddress) {
    if (homeAddressInput) homeAddressInput.value = storedAddress;
    updateMapFromAddress(storedAddress);
  } else if (homeAddressInput) {
    const initialAddress =
      homeAddressInput.value && homeAddressInput.value.trim()
        ? homeAddressInput.value.trim()
        : "Ciudad de México";
    homeAddressInput.value = initialAddress;
    updateMapFromAddress(initialAddress);
  }

  // Cuando el usuario cambie la dirección manualmente
  if (homeAddressInput) {
    homeAddressInput.addEventListener("change", () => {
      const newAddress = homeAddressInput.value.trim();
      if (!newAddress) return;
      // Borramos coords si el usuario mete una dirección manual
      homeLat = null;
      homeLng = null;
      localStorage.removeItem("pawgoLat");
      localStorage.removeItem("pawgoLng");

      localStorage.setItem("pawgoAddress", newAddress);
      updateMapFromAddress(newAddress);
    });
  }

  // Botón "Usar mi ubicación"
  if (btnUseLocation && navigator.geolocation) {
    btnUseLocation.addEventListener("click", () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          homeLat = pos.coords.latitude;
          homeLng = pos.coords.longitude;

          localStorage.setItem("pawgoLat", String(homeLat));
          localStorage.setItem("pawgoLng", String(homeLng));
          // podemos limpiar address porque ahora mandamos coords
          localStorage.removeItem("pawgoAddress");

          updateMapFromCoords(homeLat, homeLng);
          alert("Ubicación guardada como domicilio.");
        },
        (err) => {
          console.error("Error GPS cliente:", err);
          alert("No se pudo obtener tu ubicación.");
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  }

  // Listener para el botón "Ver ruta del cuidador"
  const btnVerRuta = document.getElementById("btnVerRuta");
  if (btnVerRuta) {
    btnVerRuta.addEventListener("click", onVerRutaClick);
  }
}

// ------------------------------------------
// Usado desde el registro de contacto
// para establecer dirección inicial
// ------------------------------------------
function setAddressFromContactForm() {
  const formRegister2 = document.getElementById("form-register-2");
  if (!formRegister2) return;

  const calle = formRegister2.calle.value.trim();
  const cp = formRegister2.cp.value.trim();
  const alcaldia = formRegister2.alcaldia
    ? formRegister2.alcaldia.value.trim()
    : "";

  const fullAddress = [calle, cp, alcaldia].filter(Boolean).join(", ");
  if (!fullAddress) return;

  const homeAddressInput = document.getElementById("home-address");
  if (homeAddressInput) {
    homeAddressInput.value = fullAddress;
  }

  // Al usar dirección, limpiamos las coords
  homeLat = null;
  homeLng = null;
  localStorage.removeItem("pawgoLat");
  localStorage.removeItem("pawgoLng");

  localStorage.setItem("pawgoAddress", fullAddress);
  updateMapFromAddress(fullAddress);
}

// ------------------------------------------
// Configurar el ID de la reserva actual
// Esto lo debes llamar desde el flujo
// donde creas el paseo en el backend
// ------------------------------------------
function setCurrentReservaId(idReserva) {
  currentReservaId = idReserva;
}

// ------------------------------------------
// Seguir ubicación del cuidador en vivo
// (actualiza el iframe cada N segundos)
// ------------------------------------------
function followCaregiverLive(reservaId) {
  if (!reservaId) return;

  // cancelamos anteriores
  if (liveFollowInterval) {
    clearInterval(liveFollowInterval);
    liveFollowInterval = null;
  }

  liveFollowInterval = setInterval(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/paseos/ubicacion-cuidador/${reservaId}`
      );
      const data = await res.json();

      if (!data || data.cuidador_lat == null || data.cuidador_lng == null) {
        // todavía no llega ubicación del cuidador
        return;
      }

      const iframe = document.getElementById("map-iframe");
      if (!iframe) return;

      iframe.src = `https://www.google.com/maps?q=${data.cuidador_lat},${data.cuidador_lng}&z=17&output=embed`;
    } catch (err) {
      console.error("Error obteniendo ubicación del cuidador:", err);
    }
  }, 4000); // cada 4s
}

// ------------------------------------------
// Botón "Ver ruta del cuidador" (abre Google Maps)
// ------------------------------------------
async function onVerRutaClick() {
  if (!currentReservaId) {
    alert("No se encontró el paseo actual.");
    return;
  }

  // Necesitamos la ubicación actual del cuidador
  try {
    const res = await fetch(
      `${API_BASE}/api/paseos/ubicacion-cuidador/${currentReservaId}`
    );
    const loc = await res.json();

    if (!loc || loc.cuidador_lat == null || loc.cuidador_lng == null) {
      alert("El cuidador aún no ha compartido ubicación.");
      return;
    }

    // Y necesitamos la ubicación del cliente
    if (homeLat == null || homeLng == null) {
      // Intentar cargar de localStorage por si ya estaban guardadas
      const storedLat = localStorage.getItem("pawgoLat");
      const storedLng = localStorage.getItem("pawgoLng");
      if (storedLat && storedLng) {
        homeLat = parseFloat(storedLat);
        homeLng = parseFloat(storedLng);
      }
    }

    if (homeLat == null || homeLng == null) {
      alert("No se tiene registrada tu ubicación como cliente.");
      return;
    }

    // Abrimos Google Maps con la ruta (no requiere API key)
    const url = `https://www.google.com/maps/dir/${loc.cuidador_lat},${loc.cuidador_lng}/${homeLat},${homeLng}`;
    window.open(url, "_blank");
  } catch (err) {
    console.error("Error al obtener ubicación para ruta:", err);
    alert("No se pudo obtener la ruta en este momento.");
  }
}

// ------------------------------------------
// Inicializar al cargar el DOM
// ------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initMap();
});
