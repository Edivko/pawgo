// Cambiar entre pantallas
function showScreen(id) {
  const screens = document.querySelectorAll(".screen");
  screens.forEach((s) => s.classList.remove("active"));

  const target = document.getElementById(id);
  if (target) {
    target.classList.add("active");
    target.scrollTop = 0;
  }
}

// Navegación con data-next (botones de continuar / back)
document.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-next]");
  if (!btn) return;

  const nextId = btn.getAttribute("data-next");
  if (nextId) {
    event.preventDefault();
    showScreen(nextId);
  }
});

// ---------- FORMULARIOS ----------

// 1) Registro - datos de contacto
const formRegister2 = document.getElementById("form-register-2");
const btnRegister2 = document.getElementById("btn-register-2");

btnRegister2.addEventListener("click", () => {
  const calle = formRegister2.calle.value.trim();
  const cp = formRegister2.cp.value.trim();

  if (!calle) {
    alert("Por favor ingresa la calle.");
    formRegister2.calle.focus();
    return;
  }

  if (!cp) {
    alert("Por favor ingresa el código postal.");
    formRegister2.cp.focus();
    return;
  }

  // Aquí podrías mandar los datos al backend
  alert("Registro completado (ejemplo).");
  showScreen("screen-home");
});

// 2) Login (simulado)
const formLogin = document.getElementById("form-login");

formLogin.addEventListener("submit", (e) => {
  e.preventDefault();

  const correo = formLogin.correoLogin.value.trim();
  const password = formLogin.passwordLogin.value.trim();

  if (!correo || !password) {
    alert("Ingresa correo y contraseña.");
    return;
  }

  // Aquí iría la llamada real al backend
  alert("Inicio de sesión exitoso (ejemplo).");
  showScreen("screen-home");
});

// 3) Registrar mascota
const formPetRegister = document.getElementById("form-pet-register");

formPetRegister.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombreMascota = formPetRegister.nombreMascota.value.trim();
  if (!nombreMascota) {
    alert("Ingresa el nombre de la mascota.");
    formPetRegister.nombreMascota.focus();
    return;
  }

  alert("Mascota registrada (ejemplo).");
  showScreen("screen-home");
});

// 4) VIP paseo
const formVipWalk = document.getElementById("form-vip-walk");

formVipWalk.addEventListener("submit", (e) => {
  e.preventDefault();

  // Podrías validar campos aquí si quieres
  alert("Paseo agendado (ejemplo).");
  showScreen("screen-home");
});
