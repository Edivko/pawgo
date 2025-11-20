// api.js
// Aquí centralizarás TODAS las llamadas al backend cuando lo tengas.
// Por ahora son "stubs" para que puedas reemplazarlos fácilmente después.

async function apiRegisterUser(userData) {
  // TODO: reemplazar por fetch al backend
  console.log("apiRegisterUser (demo)", userData);
  return { ok: true, id: Date.now(), ...userData };
}

async function apiLogin(credentials) {
  // TODO: reemplazar por fetch al backend
  console.log("apiLogin (demo)", credentials);
  // Simulamos usuario devuelto
  return {
    ok: true,
    token: "demo-token",
    user: {
      name: credentials.email.split("@")[0] || "Usuario",
      email: credentials.email,
    },
  };
}

async function apiCreatePet(petData) {
  // TODO: reemplazar por fetch al backend
  console.log("apiCreatePet (demo)", petData);
  return { ok: true, id: Date.now(), ...petData };
}
