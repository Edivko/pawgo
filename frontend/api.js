// api.js
const API_URL = "http://localhost:3000";

// -------- USUARIOS --------
async function apiRegisterUser(userData) {
  const resp = await fetch(`${API_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return resp.json();  // { ok, userId, nombre, message? }
}

async function apiLogin(credentials) {
  const resp = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return resp.json();  // { ok, userId, nombre, message? }
}

// -------- MASCOTAS --------
async function apiGetMascotas(userId) {
  const resp = await fetch(`${API_URL}/api/mascotas/${userId}`);
  return resp.json();  // { ok, mascotas: [...] }
}

async function apiCreatePet(petData) {
  const resp = await fetch(`${API_URL}/api/mascotas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(petData),
  });
  return resp.json();  // { ok, id_mascota, message? }
}

// -------- RESERVAS (PASEOS) --------
async function apiCreateReserva(data) {
  const resp = await fetch(`${API_URL}/api/reservas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return resp.json();  // { ok, id_reserva, id_disponibilidad, message? }
}

// -------- CUIDADORES --------
async function apiGetCaregiverProfile(idCuidador) {
  const resp = await fetch(`${API_URL}/api/cuidadores/${idCuidador}/perfil`);
  return resp.json(); // { ok, perfil }
}

async function apiUpdateCaregiverProfile(idCuidador, data) {
  const resp = await fetch(`${API_URL}/api/cuidadores/${idCuidador}/perfil`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return resp.json(); // { ok, message? }
}

async function apiGetCaregiverReservas(idCuidador) {
  const resp = await fetch(`${API_URL}/api/cuidadores/${idCuidador}/reservas`);
  return resp.json(); // { ok, reservas }
}


// -------- SERVICIOS --------
async function apiGetServicios() {
  const resp = await fetch(`${API_URL}/api/servicios`);
  return resp.json(); // { ok, servicios }
}

// -------- TARIFAS CUIDADOR --------
async function apiGetCaregiverTarifas(idCuidador) {
  const resp = await fetch(`${API_URL}/api/cuidadores/${idCuidador}/tarifas`);
  return resp.json(); // { ok, tarifas }
}

async function apiSaveCaregiverTarifas(idCuidador, data) {
  const resp = await fetch(`${API_URL}/api/cuidadores/${idCuidador}/tarifas`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return resp.json(); // { ok, message? }
}
