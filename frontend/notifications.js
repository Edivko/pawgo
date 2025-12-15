// notifications.js (pantalla completa)

const NOTIF_KEY = "pawgo_notifs_v1";

function getNotifications() {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_KEY)) || [];
  } catch {
    return [];
  }
}

function saveNotifications(list) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
}

// Render para la PANTALLA screen-notifications
function renderNotificationsScreen() {
  const container = document.getElementById("notifications-container");
  if (!container) return;

  const list = getNotifications();

  if (list.length === 0) {
    container.innerHTML = `<p class="muted">No tienes notificaciones.</p>`;
    return;
  }

  container.innerHTML = list.map(n => {
    const date = new Date(n.createdAt).toLocaleString();
    return `
      <div class="card ${n.read ? "" : "unread"}">
        <h4>${n.title}</h4>
        <p>${n.message}</p>
        <p class="small-muted">${date}</p>
        ${!n.read ? `<button data-id="${n.id}" class="btn-outline-sm mark-read">Marcar como leída</button>` : ""}
      </div>
    `;
  }).join("");
}

// Marcar como leída
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".mark-read");
  if (!btn) return;

  const id = btn.dataset.id;
  const list = getNotifications().map(n =>
    n.id === id ? { ...n, read: true } : n
  );

  saveNotifications(list);
  renderNotificationsScreen();
});

// Exponer para state.js
window.renderNotificationsScreen = renderNotificationsScreen;
