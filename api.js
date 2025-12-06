// api.js
// Funciones para hablar con el backend

const API_URL = "http://localhost:3000";

// -------- LOGIN --------
async function apiLogin(body) {
  try {
    const resp = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return {
        ok: false,
        message: data.message || "Error en login.",
      };
    }

    return data; // { ok: true, user_id, nombre }
  } catch (err) {
    console.error("apiLogin error:", err);
    return { ok: false, message: "Error de red en login." };
  }
}

// -------- REGISTRO --------
async function apiRegisterUser(body) {
  try {
    const resp = await fetch(`${API_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return {
        ok: false,
        message: data.message || "Error al registrar usuario.",
      };
    }

    return data; // { ok: true, userId, nombre }
  } catch (err) {
    console.error("apiRegisterUser error:", err);
    return { ok: false, message: "Error de red al registrar." };
  }
}

// -------- OBTENER MASCOTAS DE UN USUARIO --------
async function apiGetPets(userId) {
  try {
    const resp = await fetch(`${API_URL}/api/mascotas/${userId}`);
    const data = await resp.json().catch(() => []);

    if (!resp.ok) {
      console.error("apiGetPets error:", data);
      return [];
    }

    return data; // arreglo de mascotas
  } catch (err) {
    console.error("apiGetPets error:", err);
    return [];
  }
}

// -------- CREAR MASCOTA --------
async function apiCreatePet(body) {
  try {
    const resp = await fetch(`${API_URL}/api/mascotas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return {
        ok: false,
        message: data.message || "Error al crear mascota.",
      };
    }

    return data; // { ok: true, id }
  } catch (err) {
    console.error("apiCreatePet error:", err);
    return { ok: false, message: "Error de red al crear mascota." };
  }
}

// -------- AGENDAR PASEO VIP --------
async function apiAgendarVip(body) {
  try {
    const resp = await fetch(`${API_URL}/api/paseos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return {
        ok: false,
        message: data.message || "Error al agendar paseo.",
      };
    }

    return data; // { ok: true, message }
  } catch (err) {
    console.error("apiAgendarVip error:", err);
    return { ok: false, message: "Error de red al agendar paseo." };
  }
}
