// auth.js
// Lógica de autenticación y manejo de nombre de usuario

// Nombre y rol guardados en localStorage (si existen)
currentUserName = localStorage.getItem("pawgoUserName") || "Usuario";
currentUserRole = localStorage.getItem("pawgoUserRole") || "cliente";

// Pone el nombre en "Bienvenido X"
function renderWelcomeName() {
  const span = document.getElementById("welcome-username");
  if (span) {
    span.textContent = currentUserName;
  }
}
renderWelcomeName();

// Helper para cambiar de pantalla
function goToScreen(id) {
  // Si ya existe showScreen en otro archivo, úsalo
  if (typeof showScreen === "function") {
    showScreen(id);
    return;
  }
  // Fallback: manejar la clase .active aquí
  document.querySelectorAll(".screen").forEach((s) =>
    s.classList.remove("active")
  );
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
}

// -------- REGISTRO: DATOS BÁSICOS + CONTACTO --------
const formRegister1 = document.getElementById("form-register-1");
const formRegister2 = document.getElementById("form-register-2");
const btnRegister2 = document.getElementById("btn-register-2");

if (btnRegister2 && formRegister1 && formRegister2) {
  btnRegister2.addEventListener("click", async () => {
    // ----- datos del form 1 -----
    const nombres = formRegister1.nombres.value.trim();
    const apellidoP = formRegister1.apellidoP.value.trim();
    const apellidoM = formRegister1.apellidoM.value.trim();
    const correo = formRegister1.correo.value.trim();
    const password = formRegister1.password.value.trim();
    const password2 = formRegister1.password2.value.trim();

    // NUEVO: rol elegido (cliente / cuidador)
    const rolInput = formRegister1.querySelector('input[name="rol"]:checked');
    const rol = rolInput ? rolInput.value : "cliente";

    // ----- datos del form 2 -----
    const calle = formRegister2.calle.value.trim();
    const cp = formRegister2.cp.value.trim();
    const numInt = formRegister2.numInt.value.trim();
    const numExt = formRegister2.numExt.value.trim();
    const alcaldia = formRegister2.alcaldia.value.trim();
    const telefono = formRegister2.telefono.value.trim();

    // Validaciones rápidas
    if (!nombres || !apellidoP || !correo || !password || !password2) {
      alert("Llena todos los campos obligatorios del registro.");
      return;
    }
    if (password !== password2) {
      alert("Las contraseñas no coinciden.");
      return;
    }
    if (!calle || !cp || !numExt) {
      alert("Llena la dirección (calle, CP y número exterior).");
      return;
    }

    try {
      const resp = await apiRegisterUser({
        nombres,
        apellidoP,
        apellidoM,
        correo,
        password,
        calle,
        cp,
        numInt,
        numExt,
        alcaldia,
        telefono,
        rol, // 👈 se manda al backend
      });

      if (!resp.ok) {
        alert(resp.message || "Error al registrarse.");
        return;
      }

      // Guardar nombre
      currentUserName = resp.nombre || nombres;
      localStorage.setItem("pawgoUserName", currentUserName);

      // Guardar id de usuario
      if (resp.userId) {
        localStorage.setItem("pawgoUserId", resp.userId);
      }

      // NUEVO: guardar rol (lo que diga el backend, o el seleccionado)
      currentUserRole = resp.rol || rol || "cliente";
      localStorage.setItem("pawgoUserRole", currentUserRole);

      renderWelcomeName();

      alert(`Registro completado como ${currentUserRole}.`);
      const nextScreen =
        currentUserRole === "cuidador" ? "screen-caregiver-home" : "screen-home";
      goToScreen(nextScreen);

    } catch (err) {
      console.error(err);
      alert("Error conectando con el servidor.");
    }
  });
}

// -------- LOGIN --------
const formLogin = document.getElementById("form-login");

if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo = formLogin.correoLogin.value.trim();
    const password = formLogin.passwordLogin.value.trim();

    if (!correo || !password) {
      alert("Ingresa correo y contraseña.");
      return;
    }

    try {
      const resp = await apiLogin({ email: correo, password });

      if (!resp.ok) {
        alert(resp.message || "Correo o contraseña incorrectos.");
        return;
      }

      // Nombre
      currentUserName = resp.nombre || correo.split("@")[0] || "Usuario";
      currentUserName =
        currentUserName.charAt(0).toUpperCase() + currentUserName.slice(1);

      localStorage.setItem("pawgoUserName", currentUserName);

      // Id de usuario
      if (resp.userId) {
        localStorage.setItem("pawgoUserId", resp.userId);
      }

      // NUEVO: rol devuelto por el backend
      currentUserRole = resp.rol || "cliente";
      localStorage.setItem("pawgoUserRole", currentUserRole);

      renderWelcomeName();
      alert(`Inicio de sesión exitoso como ${currentUserRole}.`);
      const nextScreen =
        currentUserRole === "cuidador" ? "screen-caregiver-home" : "screen-home";
      goToScreen(nextScreen);

    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al iniciar sesión.");
    }
  });
}
