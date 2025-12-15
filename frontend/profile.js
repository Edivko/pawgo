// profile.js

// Puedes guardar/leer el perfil del cliente desde localStorage
const PROFILE_USER_KEY = "pawgo_profile_user_v1";

// Perfil cuidador puede venir de tu caregiver.js o también localStorage
const PROFILE_CARE_KEY = "pawgo_profile_caregiver_v1";

function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_USER_KEY)) || {};
  } catch {
    return {};
  }
}

function setUserProfile(p) {
  localStorage.setItem(PROFILE_USER_KEY, JSON.stringify(p));
}

function getCareProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_CARE_KEY)) || {};
  } catch {
    return {};
  }
}

function setCareProfile(p) {
  localStorage.setItem(PROFILE_CARE_KEY, JSON.stringify(p));
}

function renderClienteProfile(container) {
  const p = getUserProfile();

  container.innerHTML = `
    <div class="card">
      <h3 class="section-title">Perfil cliente</h3>

      <label class="field">
        <span class="field-label">Nombre(s)</span>
        <input class="input-line" name="nombres" value="${p.nombres || ""}" />
      </label>

      <div class="field-row">
        <label class="field">
          <span class="field-label">Apellido paterno</span>
          <input class="input-line" name="apellidoP" value="${p.apellidoP || ""}" />
        </label>
        <label class="field">
          <span class="field-label">Apellido materno</span>
          <input class="input-line" name="apellidoM" value="${p.apellidoM || ""}" />
        </label>
      </div>

      <label class="field">
        <span class="field-label">Correo</span>
        <input class="input-line" name="correo" value="${p.correo || ""}" disabled />
      </label>

      <label class="field">
        <span class="field-label">Teléfono</span>
        <input class="input-line" name="telefono" value="${p.telefono || ""}" />
      </label>

      <h3 class="section-title">Dirección</h3>
      <label class="field">
        <span class="field-label">Calle</span>
        <input class="input-line" name="calle" value="${p.calle || ""}" />
      </label>

      <div class="field-row">
        <label class="field small">
          <span class="field-label">CP</span>
          <input class="input-line" name="cp" value="${p.cp || ""}" />
        </label>
        <label class="field small">
          <span class="field-label">Num Int</span>
          <input class="input-line" name="numInt" value="${p.numInt || ""}" />
        </label>
        <label class="field small">
          <span class="field-label">Num Ext</span>
          <input class="input-line" name="numExt" value="${p.numExt || ""}" />
        </label>
      </div>

      <label class="field">
        <span class="field-label">Alcaldía</span>
        <input class="input-line" name="alcaldia" value="${p.alcaldia || ""}" />
      </label>

      <button id="btn-save-profile" class="btn btn-primary" type="button">Guardar</button>
    </div>
  `;

container.querySelector("#btn-save-profile")?.addEventListener("click", async () => {
  const userId = localStorage.getItem("pawgoUserId");
  if (!userId) {
    alert("Primero inicia sesión.");
    return;
  }

  const data = Object.fromEntries(
    Array.from(container.querySelectorAll("input[name]")).map(i => [i.name, i.value.trim()])
  );

  // correo viene disabled
  data.correo = p.correo || "";

  // Payload hacia backend (mismo “modelo” que usa tu UI)
  const payload = {
    nombres: data.nombres || "",
    apellidoP: data.apellidoP || "",
    apellidoM: data.apellidoM || "",
    telefono: data.telefono || "",
    calle: data.calle || "",
    cp: data.cp || "",
    numInt: data.numInt || "",
    numExt: data.numExt || "",
    alcaldia: data.alcaldia || "",
  };

  if (!payload.nombres.trim()) {
    alert("El nombre es obligatorio.");
    return;
  }

  try {
    const resp = await apiUpdateProfile(userId, payload);
    if (!resp.ok) {
      alert(resp.message || "No se pudo guardar el perfil.");
      return;
    }

    // 1) Mantén tu storage actual (para no romper nada)
    setUserProfile({ ...p, ...data });

    // 2) Refresca nombre global del Home
    localStorage.setItem("pawgoUserName", payload.nombres);

    // 3) Actualiza UI de bienvenida si existe
    const el = document.getElementById("welcome-username");
    if (el) el.textContent = payload.nombres;

    alert("Perfil actualizado.");
  } catch (err) {
    console.error(err);
    alert("Error conectando con el servidor.");
  }
});

}

function renderCuidadorProfile(container) {
  const p = getCareProfile();

  container.innerHTML = `
    <div class="card">
      <h3 class="section-title">Perfil cuidador</h3>

      <label class="field">
        <span class="field-label">Descripción</span>
        <textarea id="care-desc" class="input-line" rows="3">${p.descripcion || ""}</textarea>
      </label>

      <div class="field-row">
        <label class="field small">
          <span class="field-label">Experiencia (años)</span>
          <input id="care-exp" class="input-line" type="number" min="0" value="${p.experiencia || ""}" />
        </label>
        <label class="field small">
          <span class="field-label">Teléfono</span>
          <input id="care-tel" class="input-line" type="tel" value="${p.telefono || ""}" />
        </label>
      </div>

      <h3 class="section-title">Zona / Tarifas</h3>
      <label class="field">
        <span class="field-label">Zona</span>
        <input id="care-zona" class="input-line" value="${p.zona || ""}" />
      </label>

      <div class="field-row">
        <label class="field small">
          <span class="field-label">Chico</span>
          <input id="t-chico" class="input-line" type="number" min="0" step="0.01" value="${p.tarifaChico || ""}" />
        </label>
        <label class="field small">
          <span class="field-label">Mediano</span>
          <input id="t-med" class="input-line" type="number" min="0" step="0.01" value="${p.tarifaMediano || ""}" />
        </label>
        <label class="field small">
          <span class="field-label">Grande</span>
          <input id="t-gra" class="input-line" type="number" min="0" step="0.01" value="${p.tarifaGrande || ""}" />
        </label>
      </div>

      <button id="btn-save-care" class="btn btn-primary" type="button">Guardar</button>
    </div>
  `;

  container.querySelector("#btn-save-care")?.addEventListener("click", () => {
    const updated = {
      descripcion: container.querySelector("#care-desc")?.value?.trim() || "",
      experiencia: container.querySelector("#care-exp")?.value || "",
      telefono: container.querySelector("#care-tel")?.value?.trim() || "",
      zona: container.querySelector("#care-zona")?.value?.trim() || "",
      tarifaChico: container.querySelector("#t-chico")?.value || "",
      tarifaMediano: container.querySelector("#t-med")?.value || "",
      tarifaGrande: container.querySelector("#t-gra")?.value || "",
    };
    setCareProfile({ ...p, ...updated });
    alert("Perfil de cuidador guardado");
  });
}

// Render principal (decide por rol)
async function renderProfile() {
  const container = document.getElementById("profile-container");
  if (!container) return;

  // Ajustar botón volver según rol (tu lógica actual)
  const backBtn = document.querySelector("#screen-profile .back-btn");
  if (backBtn && typeof esCuidador === "function") {
    backBtn.setAttribute(
      "data-next",
      esCuidador() ? "screen-caregiver-home" : "screen-home"
    );
  }

  container.innerHTML = "Cargando perfil...";

  const userId = localStorage.getItem("pawgoUserId");
  if (!userId) {
    container.innerHTML = "Primero inicia sesión.";
    return;
  }

  try {
    // 1) Traer perfil base (usuarios)
    const resp = await apiGetProfile(userId);
    if (!resp.ok) {
      container.innerHTML = resp.message || "No se pudo cargar el perfil.";
      return;
    }

    const u = resp.perfil;

    // 2) Si es cuidador, además trae perfil cuidador (tu API ya existe)
    if (u.rol === "cuidador") {
      const careResp = await apiGetCaregiverProfile(userId); // ya existe en api.js
      const cp = careResp.ok ? careResp.perfil : {};

      // Guardar en tu storage actual para que renderCuidadorProfile lo use
      setCareProfile({
        descripcion: cp.descripcion || "",
        experiencia: cp.experiencia_anios ?? "",
        telefono: u.telefono || "",
        zona: "", // si luego lo conectas a BD
        tarifaChico: "",
        tarifaMediano: "",
        tarifaGrande: "",
      });

      renderCuidadorProfile(container);
      return;
    }

    // 3) Cliente: mapear DB -> tu modelo actual de UI
    const parts = (u.apellidos || "").trim().split(/\s+/);
    const apellidoP = parts[0] || "";
    const apellidoM = parts.slice(1).join(" ") || "";

setUserProfile({
  nombres: u.nombres || u.nombre || "",
  apellidoP,
  apellidoM,
  correo: u.correo || u.email || "",
  telefono: u.telefono || "",
  calle: u.calle || "",
  cp: u.cp || "",
  numInt: u.numInt || "",
  numExt: u.numExt || "",
  alcaldia: u.alcaldia || u.colonia || "",
});


    renderClienteProfile(container);
  } catch (err) {
    console.error(err);
    container.innerHTML = "Error conectando con el servidor.";
  }
}

window.renderProfile = renderProfile;

