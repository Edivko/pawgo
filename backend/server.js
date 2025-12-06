// server.js
// Backend de PAWGO

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Pool de conexión a MySQL
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "mauri123",       // <-- tu contraseña de MySQL
  database: "pawgo",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ---------- LOGIN ----------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Faltan datos." });
    }

    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
      "SELECT id_usuario, nombre, apellidos, email, password_hash FROM usuarios WHERE email = ? LIMIT 1",
      [email]
    );
    conn.release();

    if (!rows.length) {
      return res
        .status(400)
        .json({ ok: false, message: "Correo o contraseña incorrectos." });
    }

    const user = rows[0];

    // Aquí se podría usar bcrypt; por simplicidad usamos texto plano
    if (user.password_hash !== password) {
      return res
        .status(400)
        .json({ ok: false, message: "Correo o contraseña incorrectos." });
    }

    return res.json({
      ok: true,
      user_id: user.id_usuario,
      nombre: user.nombre,
    });
  } catch (err) {
    console.error("Error en /api/login:", err);
    res.status(500).json({ ok: false, message: "Error en el servidor." });
  }
});

// ---------- REGISTRO ----------
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
    } = req.body;

    if (!nombres || !apellidoP || !correo || !password || !calle || !cp || !numExt) {
      return res.status(400).json({ ok: false, message: "Faltan datos." });
    }

    const conn = await pool.getConnection();

    // Insertar usuario
    const [userResult] = await conn.execute(
      `INSERT INTO usuarios (nombre, apellidos, email, password_hash, telefono, rol, estado)
       VALUES (?, ?, ?, ?, ?, 'cliente', 'activo')`,
      [
        nombres,
        `${apellidoP} ${apellidoM || ""}`.trim(),
        correo,
        password, // en real debería ir hash
        telefono || null,
      ]
    );

    const userId = userResult.insertId;

    // Insertar dirección principal
    await conn.execute(
      `INSERT INTO direcciones 
       (id_usuario, calle, numero_ext, numero_int, colonia, cp, es_principal)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        userId,
        calle,
        numExt,
        numInt || null,
        alcaldia || "",
        cp,
      ]
    );

    conn.release();

    res.json({
      ok: true,
      userId,
      nombre: nombres,
    });
  } catch (err) {
    console.error("Error en /api/register:", err);
    res.status(500).json({ ok: false, message: "Error en el servidor." });
  }
});

// ---------- OBTENER MASCOTAS DE UN USUARIO ----------
app.get("/api/mascotas/:idUsuario", async (req, res) => {
  try {
    const { idUsuario } = req.params;

    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
      `SELECT id_mascota, id_dueno, nombre, raza, tamano, edad, peso 
       FROM mascotas
       WHERE id_dueno = ?`,
      [idUsuario]
    );
    conn.release();

    // Devolvemos directamente el arreglo (así lo espera el front)
    res.json(rows);
  } catch (err) {
    console.error("Error en GET /api/mascotas/:idUsuario:", err);
    res.status(500).json({ ok: false, message: "Error en el servidor." });
  }
});

// ---------- CREAR MASCOTA ----------
app.post("/api/mascotas", async (req, res) => {
  try {
    const { duenoId, nombre, raza, edad, peso, tamano } = req.body;

    if (!duenoId || !nombre) {
      return res.status(400).json({ ok: false, message: "Faltan datos de mascota." });
    }

    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      `INSERT INTO mascotas (id_dueno, nombre, raza, tamano, edad, peso)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        duenoId,
        nombre,
        raza || null,
        tamano || null,
        edad || null,
        peso || null,
      ]
    );
    conn.release();

    res.json({
      ok: true,
      id: result.insertId,
    });
  } catch (err) {
    console.error("Error en POST /api/mascotas:", err);
    res.status(500).json({ ok: false, message: "Error en el servidor." });
  }
});

// ---------- AGENDAR PASEO (VIP o normal) ----------
app.post("/api/paseos", async (req, res) => {
  try {
    console.log("BODY /api/paseos =>", req.body);

    const { userId, petIds, date, turno } = req.body;

    if (!userId || !Array.isArray(petIds) || petIds.length === 0) {
      return res
        .status(400)
        .json({ ok: false, message: "userId o petIds inválidos" });
    }

    // Aquí podrías insertar en tu tabla 'reservas' realmente.
    // De momento, solo respondemos OK para que el flujo funcione.
    // Ejemplo (comentado):
    /*
    const conn = await pool.getConnection();
    for (const petId of petIds) {
      await conn.execute(
        `INSERT INTO reservas (id_cliente, id_mascota, fecha_creacion, estado, motivo_cancelacion)
         VALUES (?, ?, NOW(), 'pendiente', NULL)`,
        [userId, petId]
      );
    }
    conn.release();
    */

    res.json({
      ok: true,
      message: "Paseo agendado correctamente.",
    });
  } catch (err) {
    console.error("Error en POST /api/paseos:", err);
    res.status(500).json({ ok: false, message: "Error en el servidor." });
  }
});

// ---------- ARRANCAR SERVIDOR ----------
app.listen(PORT, () => {
  console.log(`Servidor PAWGO corriendo en http://localhost:${PORT}`);
});
