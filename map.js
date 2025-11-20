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
  const initialAddress = storedAddress || homeAddressInput.value || "Ciudad de México";

  homeAddressInput.value = initialAddress;
  updateMapFromAddress(initialAddress);

  // Cuando el usuario cambie la dirección en el Home
  homeAddressInput.addEventListener("change", () => {
    const newAddress = homeAddressInput.value.trim();
    if (!newAddress) return;
    localStorage.setItem("pawgoAddress", newAddress);
    updateMapFromAddress(newAddress);
  });
}

// Usado desde auth.js al finalizar el registro de contacto
function setAddressFromContactForm() {
  const formRegister2 = document.getElementById("form-register-2");
  if (!formRegister2) return;

  const calle = formRegister2.calle.value.trim();
  const cp = formRegister2.cp.value.trim();
  const alcaldia = formRegister2.alcaldia ? formRegister2.alcaldia.value.trim() : "";

  const fullAddress = [calle, cp, alcaldia].filter(Boolean).join(", ");
  if (!fullAddress) return;

  const homeAddressInput = document.getElementById("home-address");
  if (homeAddressInput) {
    homeAddressInput.value = fullAddress;
  }

  localStorage.setItem("pawgoAddress", fullAddress);
  updateMapFromAddress(fullAddress);
}
