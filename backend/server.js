// -----------------------------------------
// PAWGO - BACKEND COMPLETO (ACTUALIZADO)
// -----------------------------------------

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------------------
// CONEXIÓN A BD
// -----------------------------------------
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "mauri123",
  database: "pawgo",
});

// -----------------------------------------
// LOGIN
// -----------------------------------------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      "SELECT * FROM usuarios WHERE email = ? AND password_hash = ?",
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(400).json({ ok: false, message: "Credenciales incorrectas" });
    }

    const user = rows[0];

    res.json({
      ok: true,
      userId: user.id_usuario,
      nombre: user.nombre,
      rol: user.rol || "cliente",
    });
  } catch (err) {
    console.error("Error en /api/login:", err);
    res.status(500).json({ ok: false, message: "Error interno" });
  }
});

// -----------------------------------------
// REGISTRO DE USUARIO
// -----------------------------------------
app.post("/api/register", async (req, res) => {
  try {
    const {
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
      rol,
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO usuarios(nombre, apellidos, email, password_hash, rol, calle, cp, num_int, num_ext, alcaldia, telefono)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombres,
        `${apellidoP} ${apellidoM}`,
        correo,
        password,
        rol || "cliente",
        calle,
        cp,
        numInt || null,
        numExt,
        alcaldia,
        telefono,
      ]
    );

    res.json({
      ok: true,
      userId: result.insertId,
      nombre: nombres,
      rol: rol || "cliente",
    });
  } catch (err) {
    console.error("Error registrando usuario:", err);
    res.status(500).json({ ok: false, message: "Error interno" });
  }
});

// -----------------------------------------
// OBTENER MASCOTAS POR USUARIO
// -----------------------------------------
app.get("/api/mascotas/:idUsuario", async (req, res) => {
  try {
    const { idUsuario } = req.params;

    const [rows] = await pool.execute(
      "SELECT * FROM mascotas WHERE id_usuario = ?",
      [idUsuario]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error al obtener mascotas:", err);
    res.status(500).json({ ok: false });
  }
});

// -----------------------------------------
// AGENDAR PASEO (CLIENTE)
// -----------------------------------------
app.post("/api/paseos", async (req, res) => {
  try {
    const { id_cliente, id_mascota, fecha, turno } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO reservas (id_cliente, id_mascota, fecha_creacion, estado, estado_paseo)
       VALUES (?, ?, NOW(), 'pendiente', 'pendiente')`,
      [id_cliente, id_mascota]
    );

    res.json({ ok: true, reservaId: result.insertId });
  } catch (err) {
    console.error("Error creando paseo:", err);
    res.status(500).json({ ok: false });
  }
});

// -----------------------------------------
// CUIDADOR — LISTAR PASEOS PENDIENTES
// -----------------------------------------
app.get("/api/paseos/pendientes-cuidador/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT r.*, c.nombre AS cliente_nombre, m.nombre AS mascota_nombre
       FROM reservas r
       JOIN usuarios c ON r.id_cliente = c.id_usuario
       JOIN mascotas m ON r.id_mascota = m.id_mascota
       WHERE r.estado = 'pendiente'`
    );

    res.json(rows);
  } catch (err) {
    console.error("Error en pendientes-cuidador:", err);
    res.status(500).json({ ok: false });
  }
});

// -----------------------------------------
// CUIDADOR — ACEPTAR PASEO
// -----------------------------------------
app.post("/api/paseos/aceptar", async (req, res) => {
  try {
    const { id_reserva, id_cuidador } = req.body;

    await pool.execute(
      `UPDATE reservas 
       SET id_cuidador = ?, estado = 'confirmada', estado_paseo = 'en_progreso'
       WHERE id_reserva = ?`,
      [id_cuidador, id_reserva]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error al aceptar paseo:", err);
    res.status(500).json({ ok: false });
  }
});

// -----------------------------------------
// CUIDADOR — EN PROGRESO
// -----------------------------------------
app.get("/api/paseos/en-progreso-cuidador/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT r.*, c.nombre AS cliente_nombre, m.nombre AS mascota_nombre
       FROM reservas r
       JOIN usuarios c ON r.id_cliente = c.id_usuario
       JOIN mascotas m ON r.id_mascota = m.id_mascota
       WHERE r.id_cuidador = ?
       AND r.estado_paseo = 'en_progreso'`,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error en en-progreso:", err);
    res.status(500).json({ ok: false });
  }
});

// -----------------------------------------
// CUIDADOR — HISTORIAL
// -----------------------------------------
app.get("/api/paseos/historial-cuidador/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT r.*, c.nombre AS cliente_nombre, m.nombre AS mascota_nombre
       FROM reservas r
       JOIN usuarios c ON r.id_cliente = c.id_usuario
       JOIN mascotas m ON r.id_mascota = m.id_mascota
       WHERE r.id_cuidador = ?
       AND r.estado_paseo IN ('completado','cancelado')`,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error en historial:", err);
    res.status(500).json({ ok: false });
  }
});

// -----------------------------------------
// GUARDAR UBICACIÓN DEL CUIDADOR
// -----------------------------------------
app.post("/api/paseos/actualizar-ubicacion", async (req, res) => {
  try {
    const { id_reserva, lat, lng } = req.body;

    await pool.execute(
      `UPDATE reservas SET cuidador_lat = ?, cuidador_lng = ? WHERE id_reserva = ?`,
      [lat, lng, id_reserva]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error actualizando ubicación:", err);
    res.status(500).json({ ok: false });
  }
});


app.get("/api/paseos/detalle/:id_reserva", async (req, res) => {
  try {
    const { id_reserva } = req.params;

    const [rows] = await pool.execute(
      `SELECT 
         r.*, 
         c.nombre AS cliente_nombre,
         c.apellidos AS cliente_apellidos,
         c.calle,
         c.cp,
         c.alcaldia,
         c.latitud AS cliente_lat,
         c.longitud AS cliente_lng,
         m.nombre AS mascota_nombre,
         m.raza,
         m.foto_url
       FROM reservas r
       JOIN usuarios c ON r.id_cliente = c.id_usuario
       JOIN mascotas m ON r.id_mascota = m.id_mascota
       WHERE r.id_reserva = ?`,
      [id_reserva]
    );

    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error("Error detalle paseo:", err);
    res.status(500).json({ ok: false });
  }
});

app.post("/api/paseos/guardar-ubicacion", async (req, res) => {
  try {
    const { id_reserva, lat, lng } = req.body;

    await pool.execute(
      `UPDATE reservas 
       SET cuidador_lat = ?, cuidador_lng = ?
       WHERE id_reserva = ?`,
      [lat, lng, id_reserva]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error guardando ubicación:", err);
    res.status(500).json({ ok: false });
  }
});

app.get("/api/paseos/ubicacion-cuidador/:id_reserva", async (req, res) => {
  try {
    const { id_reserva } = req.params;

    const [rows] = await pool.execute(
      `SELECT cuidador_lat, cuidador_lng 
       FROM reservas WHERE id_reserva = ?`,
      [id_reserva]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Error obteniendo ubicación:", err);
    res.status(500).json({ ok: false });
  }
});


// -----------------------------------------
app.listen(3000, () => {
  console.log("Servidor PAWGO corriendo en http://localhost:3000");
});
