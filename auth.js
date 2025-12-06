const formLogin = document.getElementById("form-login");

if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = formLogin.correoLogin.value.trim();
    const password = formLogin.passwordLogin.value.trim();

    const resp = await apiLogin({ email, password });

    if (!resp.ok) {
      alert(resp.message);
      return;
    }

    localStorage.setItem("pawgoUserId", resp.user_id);
    localStorage.setItem("pawgoUserName", resp.nombre);
    localStorage.setItem("pawgoRole", resp.rol);

    if (resp.rol === "cuidador") {
      window.location.href = "cuidador.html";
    } else {
      window.location.href = "index.html#home";
    }
  });
}

setInterval(async () => {
  const res = await fetch(`http://localhost:3000/api/paseos/en-progreso-cuidador/${caregiverId}`);
  const data = await res.json();

  if (data.length > 0) {
    console.log("🔔 Paseos en curso:", data.length);
  }
}, 6000);
