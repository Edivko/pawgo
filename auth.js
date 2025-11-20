// auth.js
// Lógica de autenticación y manejo de nombre de usuario

// Renderizar el nombre en "Bienvenido X"
function renderWelcomeName() {
  const span = document.getElementById("welcome-username");
  if (span) {
    span.textContent = currentUserName;
  }
}

// -------- REGISTRO: DATOS DE CONTACTO --------
const formRegister2 = document.getElementById("form-register-2");
const btnRegister2 = document.getElementById("btn-register-2");

if (btnRegister2 && formRegister2) {
  btnRegister2.addEventListener("click", async () => {
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

    // Tomar el nombre que capturó en el primer formulario de registro
    const nombreInput = document.querySelector(
      '#form-register-1 input[name="nombres"]'
    );
    if (nombreInput && nombreInput.value.trim() !== "") {
      currentUserName = nombreInput.value.trim();
      localStorage.setItem("pawgoUserName", currentUserName);
      renderWelcomeName();
    }

    // Llamada al backend de registro (demo)
    try {
      await apiRegisterUser({
        name: currentUserName,
        address: calle,
        cp,
      });
    } catch (err) {
      console.error(err);
    }

    // Actualizar la dirección/mapa desde el formulario
    if (typeof setAddressFromContactForm === "function") {
      setAddressFromContactForm();
    }

    alert("Registro completado (ejemplo).");
    showScreen("screen-home");
  });
}

// -------- LOGIN (simulado, listo para backend) --------
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
        alert("Error de autenticación (demo).");
        return;
      }

      // Tomar nombre desde backend simulado
      currentUserName =
        (resp.user && resp.user.name) ||
        correo.split("@")[0] ||
        "Usuario";
      currentUserName =
        currentUserName.charAt(0).toUpperCase() + currentUserName.slice(1);

      localStorage.setItem("pawgoUserName", currentUserName);
      renderWelcomeName();

      alert("Inicio de sesión exitoso (ejemplo).");
      showScreen("screen-home");
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al iniciar sesión.");
    }
  });
}
