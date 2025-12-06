// auth.js
// Lógica de autenticación y manejo de nombre de usuario

// Asegurarnos de que existe currentUserName (lo declara state.js)
if (typeof currentUserName === "undefined") {
  currentUserName = localStorage.getItem("pawgoUserName") || "Usuario";
}

// Pone el nombre en "Bienvenido X"
function renderWelcomeName() {
  const span = document.getElementById("welcome-username");
  if (span) {
    span.textContent = currentUserName;
  }
}
renderWelcomeName();

// Helper para cambiar de pantalla usando showScreen de state.js
function goToScreen(id) {
  if (typeof showScreen === "function") {
    showScreen(id);
    return;
  }
  // Fallback (por si acaso)
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
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
      });

      if (!resp.ok) {
        alert(resp.message || "Error al registrarse.");
        return;
      }

      currentUserName = resp.nombre || nombres;
      localStorage.setItem("pawgoUserName", currentUserName);
      if (resp.userId) {
        localStorage.setItem("pawgoUserId", resp.userId);
      }

      renderWelcomeName();
      alert("Registro completado.");
      goToScreen("screen-home");
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
      // El backend espera { email, password }
      const resp = await apiLogin({ email: correo, password });

      if (!resp.ok) {
        alert(resp.message || "Correo o contraseña incorrectos.");
        return;
      }

      // resp: { ok: true, user_id: 4, nombre: "Mauricio" }
      currentUser = {
        user_id: resp.user_id,
        nombre: resp.nombre,
        email: correo,
      };

      currentUserName = resp.nombre || correo.split("@")[0] || "Usuario";
      currentUserName =
        currentUserName.charAt(0).toUpperCase() + currentUserName.slice(1);

      localStorage.setItem("pawgoUserName", currentUserName);
      if (resp.user_id) {
        localStorage.setItem("pawgoUserId", resp.user_id);
      }

      renderWelcomeName();

      // Cargar mascotas del usuario logueado
      if (typeof loadPetsForCurrentUser === "function") {
        await loadPetsForCurrentUser();
      }

      alert("Inicio de sesión exitoso.");
      goToScreen("screen-home");
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al iniciar sesión.");
    }
  });
}
