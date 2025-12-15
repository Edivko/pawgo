// map.js
// Manejo del mapa embebido y dirección del usuario

function updateMapFromAddress(address) {
  const iframe = document.getElementById("map-iframe");
  if (!iframe) return;

  const query = encodeURIComponent(address);
  iframe.src = `https://www.google.com/maps?q=${query}&output=embed`;
}

// Inicialización del mapa y del input de dirección
function initMap() {
  const homeAddressInput = document.getElementById("home-address");
  if (!homeAddressInput) return;

  const storedAddress = localStorage.getItem("pawgoAddress");
  const initialAddress =
    storedAddress || homeAddressInput.value || "Ciudad de México";

  homeAddressInput.value = initialAddress;
  updateMapFromAddress(initialAddress);

  homeAddressInput.addEventListener("change", () => {
    const newAddress = homeAddressInput.value.trim();
    if (!newAddress) return;
    localStorage.setItem("pawgoAddress", newAddress);
    updateMapFromAddress(newAddress);
  });

  const btnUseLocation = document.getElementById("btn-use-location");
  if (!btnUseLocation) return;

  btnUseLocation.addEventListener("click", (e) => {
    e.preventDefault();

    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    btnUseLocation.disabled = true;

    // ⬇⬇⬇ AQUÍ va el código nuevo ⬇⬇⬇
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
            latitude
          )}&lon=${encodeURIComponent(longitude)}`;
          const resp = await fetch(url);
          if (!resp.ok) throw new Error();

          const data = await resp.json();
          const address = data.display_name || `${latitude}, ${longitude}`;

          homeAddressInput.value = address;
          localStorage.setItem("pawgoAddress", address);
          updateMapFromAddress(address);
        } catch {
          const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          homeAddressInput.value = coords;
          localStorage.setItem("pawgoAddress", coords);
          updateMapFromAddress(coords);
        } finally {
          btnUseLocation.disabled = false;
        }
      },
      (err) => {
        btnUseLocation.disabled = false;

        if (err?.code === 1) {
          alert("Permiso denegado. Activa la ubicación en el navegador.");
        } else if (err?.code === 3) {
          alert("Tiempo de espera agotado.");
        } else {
          alert("No se pudo obtener la ubicación.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
    // ⬆⬆⬆ AQUÍ termina el código nuevo ⬆⬆⬆
  });
}

// Usado desde auth.js al finalizar el registro de contacto
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

  localStorage.setItem("pawgoAddress", fullAddress);
  updateMapFromAddress(fullAddress);
}
