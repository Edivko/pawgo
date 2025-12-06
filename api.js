const API = "http://localhost:3000/api";

// --- REGISTRO ---
async function apiRegisterUser(data) {
  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return await res.json();
}

// --- LOGIN ---
async function apiLogin(data) {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return await res.json();
}

// --- MASCOTAS ---
async function apiGetPets(userId) {
  const res = await fetch(`${API}/pets/${userId}`);
  return await res.json();
}

// --- AGENDAR PASEO ---
async function apiAgendarPaseo(clienteId, mascotasIds, turno) {
  const res = await fetch(`${API}/paseos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: clienteId, mascotasIds, turno })
  });
  return await res.json();
}

// --- CUIDADOR: OBTENER PASEOS ---
async function apiGetPendingWalks() {
  const res = await fetch(`${API}/care/pending-walks`);
  return await res.json();
}

// --- CUIDADOR: ACEPTAR PASEO ---
async function apiAcceptWalk(paseoId, cuidadorId) {
  const res = await fetch(`${API}/care/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paseoId, cuidadorId })
  });
  return await res.json();
}
