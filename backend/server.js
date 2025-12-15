const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Conexión a MySQL
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "eduardo*", // tu contraseña de MySQL
  database: "pawgo",
  port: 3306,
});

app.get("/", (req, res) => {
  res.send("API PAWGO OK");
});

// ---------- REGISTRO DE USUARIO ----------
app.post("/api/register", async (req, res) => {
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

  if (
    !nombres ||
    !apellidoP ||
    !correo ||
    !password ||
    !calle ||
    !cp ||
    !numExt
  ) {
    return res
      .status(400)
      .json({ ok: false, message: "Faltan datos obligatorios" });
  }

  const apellidos = `${apellidoP} ${apellidoM || ""}`.trim();

  // Normalizar rol
  let rolDb = "cliente";
  if (rol === "cuidador") {
    rolDb = "cuidador";
  } else if (rol === "admin") {
    rolDb = "admin";
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insertar usuario
    const [userResult] = await conn.execute(
      `INSERT INTO usuarios (nombre, apellidos, email, password_hash, telefono, rol)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombres, apellidos, correo, password, telefono || null, rolDb]
    );

    const userId = userResult.insertId;

    // Si es cuidador, crear perfil vacío
    if (rolDb === "cuidador") {
      await conn.execute(
        `INSERT INTO cuidadores_perfil (id_cuidador) VALUES (?)`,
        [userId]
      );
    }

    // Insertar dirección principal
    await conn.execute(
      `INSERT INTO direcciones
       (id_usuario, calle, numero_ext, numero_int, colonia, cp, es_principal)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [userId, calle, numExt || "", numInt || null, alcaldia || "", cp]
    );

    await conn.commit();

    res.json({ ok: true, userId, nombre: nombres, rol: rolDb });
  } catch (err) {
    console.error(err);
    await conn.rollback();
    res.status(500).json({ ok: false, message: "Error al registrar" });
  } finally {
    conn.release();
  }
});

// ---------- LOGIN ----------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM usuarios WHERE email = ? AND password_hash = ?",
      [email, password]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ ok: false, message: "Correo o contraseña incorrectos" });
    }

    const user = rows[0];

    res.json({
      ok: true,
      userId: user.id_usuario,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error en login" });
  }
});

// ---------- PERFIL CUIDADOR ----------
app.get("/api/cuidadores/:id/perfil", async (req, res) => {
  const id = req.params.id;

  try {
    const [rows] = await pool.execute(
      `SELECT 
         u.id_usuario,
         u.nombre,
         u.apellidos,
         u.email,
         u.telefono,
         u.rating_promedio,
         u.total_servicios,
         cp.descripcion,
         cp.experiencia_anios,
         cp.verificado
       FROM usuarios u
       LEFT JOIN cuidadores_perfil cp ON cp.id_cuidador = u.id_usuario
       WHERE u.id_usuario = ? AND u.rol = 'cuidador'`,
      [id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, message: "Cuidador no encontrado" });
    }

    res.json({ ok: true, perfil: rows[0] });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ ok: false, message: "Error al obtener perfil de cuidador" });
  }
});

app.put("/api/cuidadores/:id/perfil", async (req, res) => {
  const id = req.params.id;
  const { descripcion, experiencia_anios, telefono } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar que sea cuidador
    const [userRows] = await conn.execute(
      "SELECT id_usuario, rol FROM usuarios WHERE id_usuario = ?",
      [id]
    );
    if (userRows.length === 0 || userRows[0].rol !== "cuidador") {
      await conn.rollback();
      return res
        .status(400)
        .json({ ok: false, message: "El usuario no es cuidador" });
    }

    // Actualizar teléfono
    if (telefono !== undefined) {
      await conn.execute(
        "UPDATE usuarios SET telefono = ? WHERE id_usuario = ?",
        [telefono || null, id]
      );
    }

    // Asegurar que exista el registro en cuidadores_perfil
    await conn.execute(
      "INSERT IGNORE INTO cuidadores_perfil (id_cuidador) VALUES (?)",
      [id]
    );

    // Actualizar datos de perfil
    await conn.execute(
      `UPDATE cuidadores_perfil
       SET descripcion = ?, experiencia_anios = ?
       WHERE id_cuidador = ?`,
      [
        descripcion || null,
        experiencia_anios !== undefined && experiencia_anios !== null
          ? experiencia_anios
          : 0,
        id,
      ]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    await conn.rollback();
    res
      .status(500)
      .json({ ok: false, message: "Error al actualizar perfil de cuidador" });
  } finally {
    conn.release();
  }
});

// ---------- RESERVAS DEL CUIDADOR ----------
app.get("/api/cuidadores/:id/reservas", async (req, res) => {
  const id = req.params.id;

  try {
    const [rows] = await pool.execute(
      `SELECT 
         r.id_reserva,
         r.estado,
         r.fecha_creacion,
         d.fecha,
         d.hora_inicio,
         d.hora_fin,
         m.id_mascota,
         m.nombre AS nombre_mascota,
         m.tamano,
         c.id_usuario AS id_cliente,
         c.nombre AS nombre_cliente,
         c.apellidos AS apellidos_cliente
       FROM reservas r
       JOIN disponibilidades d ON d.id_disponibilidad = r.id_disponibilidad
       JOIN mascotas m ON m.id_mascota = r.id_mascota
       JOIN usuarios c ON c.id_usuario = r.id_cliente
       WHERE r.id_cuidador = ?
       ORDER BY d.fecha ASC, d.hora_inicio ASC`,
      [id]
    );

    res.json({ ok: true, reservas: rows });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ ok: false, message: "Error al obtener reservas del cuidador" });
  }
});

// ---------- RESERVAS DEL CLIENTE ----------
app.get("/api/clientes/:id/reservas", async (req, res) => {
  const id = req.params.id;

  try {
    const [rows] = await pool.execute(
      `SELECT 
         r.id_reserva,
         r.estado,
         r.fecha_creacion,
         d.fecha,
         d.hora_inicio,
         d.hora_fin,
         m.id_mascota,
         m.nombre AS nombre_mascota,
         m.tamano,
         cu.id_usuario AS id_cuidador,
         cu.nombre AS nombre_cuidador,
         cu.apellidos AS apellidos_cuidador
       FROM reservas r
       JOIN disponibilidades d ON d.id_disponibilidad = r.id_disponibilidad
       JOIN mascotas m ON m.id_mascota = r.id_mascota
       JOIN usuarios cu ON cu.id_usuario = r.id_cuidador
       WHERE r.id_cliente = ?
         AND r.estado IN ('pendiente','confirmada')
       ORDER BY d.fecha ASC, d.hora_inicio ASC`,
      [id]
    );

    res.json({ ok: true, reservas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: "Error al obtener reservas del cliente",
    });
  }
});

// ---------- CANCELAR RESERVA (CLIENTE) ----------
app.patch("/api/reservas/:id/cancelar", async (req, res) => {
  const id_reserva = req.params.id;
  const { id_cliente, motivo } = req.body || {};

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT id_reserva, id_cliente, id_disponibilidad, estado
       FROM reservas
       WHERE id_reserva = ?`,
      [id_reserva]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({ ok: false, message: "Reserva no encontrada" });
    }

    const reserva = rows[0];

    // Verificamos que la reserva sea de ese cliente (si nos mandó id_cliente)
    if (
      id_cliente &&
      Number(id_cliente) &&
      reserva.id_cliente !== Number(id_cliente)
    ) {
      await conn.rollback();
      return res
        .status(403)
        .json({ ok: false, message: "No puedes cancelar esta reserva" });
    }

    if (reserva.estado === "cancelada") {
      await conn.rollback();
      return res
        .status(400)
        .json({ ok: false, message: "La reserva ya está cancelada" });
    }

    if (reserva.estado === "completada") {
      await conn.rollback();
      return res.status(400).json({
        ok: false,
        message: "No se puede cancelar una reserva completada",
      });
    }

    // 1) Marcar reserva como cancelada
    await conn.execute(
      `UPDATE reservas
       SET estado = 'cancelada',
           motivo_cancelacion = ?
       WHERE id_reserva = ?`,
      [motivo || null, id_reserva]
    );

    // 2) Liberar la disponibilidad asociada
    await conn.execute(
      `UPDATE disponibilidades
       SET estado = 'libre'
       WHERE id_disponibilidad = ?`,
      [reserva.id_disponibilidad]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    await conn.rollback();
    res.status(500).json({
      ok: false,
      message: "Error al cancelar la reserva",
    });
  } finally {
    conn.release();
  }
});

// ---------- SERVICIOS ----------
app.get("/api/servicios", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id_servicio, nombre, descripcion, duracion_min FROM servicios WHERE activo = 1"
    );
    res.json({ ok: true, servicios: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error al obtener servicios" });
  }
});

// ---------- TARIFAS DEL CUIDADOR ----------
// Obtener tarifas del cuidador
app.get("/api/cuidadores/:id/tarifas", async (req, res) => {
  const id = req.params.id;

  try {
    const [rows] = await pool.execute(
      `SELECT 
         t.id_tarifa,
         t.id_servicio,
         s.nombre AS nombre_servicio,
         t.tamano_perro,
         t.precio,
         t.moneda,
         t.activo
       FROM tarifas_cuidadores t
       JOIN servicios s ON s.id_servicio = t.id_servicio
       WHERE t.id_cuidador = ?`,
      [id]
    );

    res.json({ ok: true, tarifas: rows });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ ok: false, message: "Error al obtener tarifas del cuidador" });
  }
});

// Guardar / actualizar tarifas del cuidador (upsert)
app.put("/api/cuidadores/:id/tarifas", async (req, res) => {
  const id = req.params.id;
  let { id_servicio, chico, mediano, grande, moneda } = req.body;

  id_servicio = id_servicio || 1; // Paseo estándar
  moneda = moneda || "MXN";

  const tarifas = [];
  const chicoNum =
    chico !== undefined && chico !== null && chico !== ""
      ? parseFloat(chico)
      : NaN;
  const medianoNum =
    mediano !== undefined && mediano !== null && mediano !== ""
      ? parseFloat(mediano)
      : NaN;
  const grandeNum =
    grande !== undefined && grande !== null && grande !== ""
      ? parseFloat(grande)
      : NaN;

  if (!isNaN(chicoNum)) tarifas.push({ tamano: "chico", precio: chicoNum });
  if (!isNaN(medianoNum))
    tarifas.push({ tamano: "mediano", precio: medianoNum });
  if (!isNaN(grandeNum)) tarifas.push({ tamano: "grande", precio: grandeNum });

  if (tarifas.length === 0) {
    return res.status(400).json({
      ok: false,
      message: "Debes proporcionar al menos una tarifa válida",
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar cuidador
    const [userRows] = await conn.execute(
      "SELECT id_usuario, rol FROM usuarios WHERE id_usuario = ?",
      [id]
    );
    if (userRows.length === 0 || userRows[0].rol !== "cuidador") {
      await conn.rollback();
      return res
        .status(400)
        .json({ ok: false, message: "El usuario no es cuidador" });
    }

    // Asegurar que exista el registro en cuidadores_perfil (por si es cuidador viejo)
    await conn.execute(
      "INSERT IGNORE INTO cuidadores_perfil (id_cuidador) VALUES (?)",
      [id]
    );

    // Asegurarnos de que el servicio exista
    let [servRows] = await conn.execute(
      "SELECT id_servicio FROM servicios WHERE id_servicio = ?",
      [id_servicio]
    );

    if (servRows.length === 0) {
      const [servRes] = await conn.execute(
        `INSERT INTO servicios (nombre, descripcion, duracion_min, activo)
         VALUES (?, ?, ?, 1)`,
        ["Paseo estándar", "Servicio creado automáticamente", 60]
      );
      id_servicio = servRes.insertId;
    }

    // Upsert de cada tarifa por tamaño
    for (const t of tarifas) {
      await conn.execute(
        `INSERT INTO tarifas_cuidadores
           (id_cuidador, id_servicio, tamano_perro, precio, moneda, activo)
         VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           precio = VALUES(precio),
           moneda = VALUES(moneda),
           activo = 1`,
        [id, id_servicio, t.tamano, t.precio, moneda]
      );
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    await conn.rollback();
    res
      .status(500)
      .json({ ok: false, message: "Error al guardar tarifas del cuidador" });
  } finally {
    conn.release();
  }
});

// ---------- HELPERS ----------
function normalizarTamano(t) {
  if (!t) return "mediano";
  t = t.toString().trim().toLowerCase();
  if (t === "ch" || t === "chico" || t === "c") return "chico";
  if (t === "g" || t === "grande") return "grande";
  if (t === "m" || t === "mediano") return "mediano";
  return "mediano";
}

function mapSlot(diaVip) {
  if (diaVip === "tarde") {
    return { hora_inicio: "17:00:00", hora_fin: "18:00:00" };
  }
  // Default mañana
  return { hora_inicio: "10:00:00", hora_fin: "11:00:00" };
}

// ---------- OBTENER MASCOTAS DE UN USUARIO ----------
app.get("/api/mascotas/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM mascotas WHERE id_dueno = ?",
      [userId]
    );
    res.json({ ok: true, mascotas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error al obtener mascotas" });
  }
});

// ---------- REGISTRAR MASCOTA ----------
app.post("/api/mascotas", async (req, res) => {
  const { id_dueno, nombreMascota, raza, edad, peso, tamano } = req.body;

  if (!id_dueno || !nombreMascota) {
    return res
      .status(400)
      .json({ ok: false, message: "Faltan datos de mascota" });
  }

  const tamanoDb = normalizarTamano(tamano);
  const edadInt = edad ? parseInt(edad, 10) : null;
  const pesoNum = peso ? parseFloat(peso) : null;

  try {
    const [result] = await pool.execute(
      `INSERT INTO mascotas (id_dueno, nombre, raza, tamano, edad, peso)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_dueno, nombreMascota, raza || null, tamanoDb, edadInt, pesoNum]
    );

    res.json({ ok: true, id_mascota: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error al registrar mascota" });
  }
});

// ---------- CREAR RESERVA DE PASEO ----------
app.post("/api/reservas", async (req, res) => {
  const { id_cliente, id_mascota, fecha, diaVip } = req.body;

  if (!id_cliente || !id_mascota || !fecha) {
    return res
      .status(400)
      .json({ ok: false, message: "Faltan datos para la reserva" });
  }

  const { hora_inicio, hora_fin } = mapSlot(diaVip);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Elegimos un cuidador (por ahora el primero que exista)
    const [cuidadorRows] = await conn.execute(
      "SELECT id_cuidador FROM cuidadores_perfil ORDER BY id_cuidador ASC LIMIT 1"
    );
    if (cuidadorRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        ok: false,
        message: "No hay cuidadores registrados en el sistema.",
      });
    }
    const id_cuidador = cuidadorRows[0].id_cuidador;

    // Servicio fijo por ahora
    const id_servicio = 1;

    // Crear una disponibilidad asociada a esta reserva
    const [dispResult] = await conn.execute(
      `INSERT INTO disponibilidades (id_cuidador, fecha, hora_inicio, hora_fin, estado)
       VALUES (?, ?, ?, ?, 'reservado')`,
      [id_cuidador, fecha, hora_inicio, hora_fin]
    );
    const id_disponibilidad = dispResult.insertId;

    // Crear la reserva
    const [resResult] = await conn.execute(
      `INSERT INTO reservas (id_cliente, id_cuidador, id_mascota, id_servicio, id_disponibilidad, estado)
       VALUES (?, ?, ?, ?, ?, 'confirmada')`,
      [id_cliente, id_cuidador, id_mascota, id_servicio, id_disponibilidad]
    );

    await conn.commit();

    res.json({
      ok: true,
      id_reserva: resResult.insertId,
      id_disponibilidad,
    });
  } catch (err) {
    console.error(err);
    await conn.rollback();
    res.status(500).json({ ok: false, message: "Error al crear la reserva" });
  } finally {
    conn.release();
  }
});

// ---------- PERFIL (USUARIO + DIRECCIÓN PRINCIPAL) ----------
app.get("/api/profile/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const [rows] = await pool.execute(
      `SELECT
         u.id_usuario,
         u.nombre,
         u.apellidos,
         u.email,
         u.telefono,
         u.rol,
         u.estado,
         u.rating_promedio,
         u.total_servicios,
         u.fecha_registro,

         d.calle,
         d.numero_ext,
         d.numero_int,
         d.colonia,
         d.cp,
         d.latitud,
         d.longitud,
         d.es_principal
       FROM usuarios u
       LEFT JOIN direcciones d
         ON d.id_usuario = u.id_usuario
        AND d.es_principal = 1
       WHERE u.id_usuario = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, message: "Usuario no encontrado" });
    }

    const r = rows[0];

    // Devolvemos el formato que tu profile.js / UI ya entiende
    const perfil = {
      nombres: r.nombre || "",
      // Si quieres separar apellidos, lo hacemos en frontend; aquí regresamos apellidos completos
      apellidos: r.apellidos || "",
      correo: r.email || "",
      telefono: r.telefono || "",

      calle: r.calle || "",
      numExt: r.numero_ext || "",
      numInt: r.numero_int || "",
      // En tu UI lo llamas "alcaldia", pero en BD es "colonia"
      alcaldia: r.colonia || "",
      cp: r.cp || "",

      rol: r.rol,
      estado: r.estado,
      rating_promedio: r.rating_promedio,
      total_servicios: r.total_servicios,
      fecha_registro: r.fecha_registro,

      latitud: r.latitud,
      longitud: r.longitud,
    };

    res.json({ ok: true, perfil });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error al obtener perfil" });
  }
});

// ---------- ACTUALIZAR PERFIL (USUARIO + DIRECCIÓN PRINCIPAL) ----------
app.put("/api/profile/:id", async (req, res) => {
  const id = Number(req.params.id);
  const {
    nombres,
    apellidoP,
    apellidoM,
    telefono,
    calle,
    cp,
    numInt,
    numExt,
    alcaldia,
  } = req.body || {};

  if (!id || !nombres || !nombres.trim()) {
    return res
      .status(400)
      .json({ ok: false, message: "Nombre es obligatorio" });
  }

  const apellidos = `${(apellidoP || "").trim()} ${(
    apellidoM || ""
  ).trim()}`.trim();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE usuarios
       SET nombre = ?, apellidos = ?, telefono = ?
       WHERE id_usuario = ?`,
      [nombres.trim(), apellidos, telefono || null, id]
    );

    const [dirRows] = await conn.execute(
      `SELECT id_direccion
       FROM direcciones
       WHERE id_usuario = ? AND es_principal = 1
       LIMIT 1`,
      [id]
    );

    if (dirRows.length > 0) {
      await conn.execute(
        `UPDATE direcciones
         SET calle = ?, numero_ext = ?, numero_int = ?, colonia = ?, cp = ?
         WHERE id_direccion = ?`,
        [
          (calle || "").trim(),
          (numExt || "").trim(),
          numInt !== undefined &&
          numInt !== null &&
          String(numInt).trim() !== ""
            ? String(numInt).trim()
            : null,
          (alcaldia || "").trim(),
          (cp || "").trim(),
          dirRows[0].id_direccion,
        ]
      );
    } else {
      await conn.execute(
        `INSERT INTO direcciones
         (id_usuario, calle, numero_ext, numero_int, colonia, cp, es_principal)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          id,
          (calle || "").trim(),
          (numExt || "").trim(),
          numInt !== undefined &&
          numInt !== null &&
          String(numInt).trim() !== ""
            ? String(numInt).trim()
            : null,
          (alcaldia || "").trim(),
          (cp || "").trim(),
        ]
      );
    }

    await conn.commit();
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    await conn.rollback();
    return res
      .status(500)
      .json({ ok: false, message: "Error al actualizar perfil" });
  } finally {
    conn.release();
  }
});

// ---------- OBTENER 1 MASCOTA POR ID (SOLO DUEÑO) ----------
app.get("/api/mascota/:id", async (req, res) => {
  const idMascota = Number(req.params.id);
  const idDueno = Number(req.query.id_dueno);

  if (!idMascota || !idDueno) {
    return res.status(400).json({ ok: false, message: "Parámetros inválidos" });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id_mascota, id_dueno, nombre, raza, tamano, edad, peso, notas_medicas
       FROM mascotas
       WHERE id_mascota = ? AND id_dueno = ?`,
      [idMascota, idDueno]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, message: "Mascota no encontrada" });
    }

    return res.json({ ok: true, mascota: rows[0] });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ ok: false, message: "Error al obtener mascota" });
  }
});

// ---------- ACTUALIZAR MASCOTA (SOLO DUEÑO) ----------
app.put("/api/mascota/:id", async (req, res) => {
  const idMascota = Number(req.params.id);
  const { id_dueno, nombre, raza, tamano, edad, peso, notas_medicas } =
    req.body || {};

  if (!idMascota || !id_dueno || !nombre || !nombre.trim()) {
    return res.status(400).json({ ok: false, message: "Datos incompletos" });
  }

  const tamanoDb = normalizarTamano(tamano);

  const edadInt =
    edad !== undefined && edad !== null && edad !== ""
      ? parseInt(edad, 10)
      : null;
  const pesoNum =
    peso !== undefined && peso !== null && peso !== ""
      ? parseFloat(peso)
      : null;

  try {
    const [result] = await pool.execute(
      `UPDATE mascotas
       SET nombre = ?, raza = ?, tamano = ?, edad = ?, peso = ?, notas_medicas = ?
       WHERE id_mascota = ? AND id_dueno = ?`,
      [
        nombre.trim(),
        raza ? raza.trim() : null,
        tamanoDb,
        Number.isNaN(edadInt) ? null : edadInt,
        Number.isNaN(pesoNum) ? null : pesoNum,
        notas_medicas ? notas_medicas.trim() : null,
        idMascota,
        Number(id_dueno),
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(403)
        .json({ ok: false, message: "No autorizado o no existe" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ ok: false, message: "Error al actualizar mascota" });
  }
});

app.listen(PORT, () => {
  console.log(`API PAWGO escuchando en http://localhost:${PORT}`);
});
