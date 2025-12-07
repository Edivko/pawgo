const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Conexión a MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'mauri123', // tu contraseña de MySQL
  database: 'pawgo',
  port: 3306,
});

app.get('/', (req, res) => {
  res.send('API PAWGO OK');
});

// ---------- REGISTRO DE USUARIO ----------
app.post('/api/register', async (req, res) => {
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

  if (!nombres || !apellidoP || !correo || !password || !calle || !cp || !numExt) {
    return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios' });
  }

  const apellidos = `${apellidoP} ${apellidoM || ''}`.trim();

  // Normalizamos el rol para que siempre sea válido para la BD
  let rolDb = 'cliente';
  if (rol === 'cuidador') {
    rolDb = 'cuidador';
  } else if (rol === 'admin') {
    rolDb = 'admin';
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insertar usuario con rol
    const [userResult] = await conn.execute(
      `INSERT INTO usuarios (nombre, apellidos, email, password_hash, telefono, rol)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombres, apellidos, correo, password, telefono || null, rolDb]
    );

    const userId = userResult.insertId;

    // Si es cuidador, crear también su perfil vacío en cuidadores_perfil
    if (rolDb === 'cuidador') {
      await conn.execute(
        `INSERT INTO cuidadores_perfil (id_cuidador)
         VALUES (?)`,
        [userId]
      );
    }

    // Insertar dirección principal
    await conn.execute(
      `INSERT INTO direcciones
       (id_usuario, calle, numero_ext, numero_int, colonia, cp, es_principal)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [userId, calle, numExt || '', numInt || null, alcaldia || '', cp]
    );

    await conn.commit();

    res.json({ ok: true, userId, nombre: nombres, rol: rolDb });
  } catch (err) {
    console.error(err);
    await conn.rollback();
    res.status(500).json({ ok: false, message: 'Error al registrar' });
  } finally {
    conn.release();
  }
});

// ---------- LOGIN ----------
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ? AND password_hash = ?',
      [email, password]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ ok: false, message: 'Correo o contraseña incorrectos' });
    }

    const user = rows[0];

    res.json({
      ok: true,
      userId: user.id_usuario,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,   // 👈 NUEVO: devolvemos el rol al front
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error en login' });
  }
});

// ---------- PERFIL CUIDADOR ----------
app.get('/api/cuidadores/:id/perfil', async (req, res) => {
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
        .json({ ok: false, message: 'Cuidador no encontrado' });
    }

    res.json({ ok: true, perfil: rows[0] });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ ok: false, message: 'Error al obtener perfil de cuidador' });
  }
});

app.put('/api/cuidadores/:id/perfil', async (req, res) => {
  const id = req.params.id;
  const { descripcion, experiencia_anios, telefono } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // actualizar teléfono en usuarios (opcional)
    if (telefono !== undefined) {
      await conn.execute(
        'UPDATE usuarios SET telefono = ? WHERE id_usuario = ? AND rol = "cuidador"',
        [telefono || null, id]
      );
    }

    // actualizar perfil en cuidadores_perfil
    await conn.execute(
      `UPDATE cuidadores_perfil
       SET descripcion = ?, experiencia_anios = ?
       WHERE id_cuidador = ?`,
      [descripcion || null, experiencia_anios || 0, id]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    await conn.rollback();
    res
      .status(500)
      .json({ ok: false, message: 'Error al actualizar perfil de cuidador' });
  } finally {
    conn.release();
  }
});

// ---------- RESERVAS DEL CUIDADOR ----------
app.get('/api/cuidadores/:id/reservas', async (req, res) => {
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
      .json({ ok: false, message: 'Error al obtener reservas del cuidador' });
  }
});


// ---------- HELPERS ----------
function normalizarTamano(t) {
  if (!t) return 'mediano';
  t = t.toString().trim().toLowerCase();
  if (t === 'ch' || t === 'chico' || t === 'c') return 'chico';
  if (t === 'g' || t === 'grande') return 'grande';
  if (t === 'm' || t === 'mediano') return 'mediano';
  return 'mediano';
}

function mapSlot(diaVip) {
  if (diaVip === 'tarde') {
    return { hora_inicio: '17:00:00', hora_fin: '18:00:00' };
  }
  // Default mañana
  return { hora_inicio: '10:00:00', hora_fin: '11:00:00' };
}

// ---------- OBTENER MASCOTAS DE UN USUARIO ----------
app.get('/api/mascotas/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM mascotas WHERE id_dueno = ?',
      [userId]
    );
    res.json({ ok: true, mascotas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener mascotas' });
  }
});

// ---------- REGISTRAR MASCOTA ----------
app.post('/api/mascotas', async (req, res) => {
  const {
    id_dueno,
    nombreMascota,
    raza,
    edad,
    peso,
    tamano,
  } = req.body;

  if (!id_dueno || !nombreMascota) {
    return res.status(400).json({ ok: false, message: 'Faltan datos de mascota' });
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
    res.status(500).json({ ok: false, message: 'Error al registrar mascota' });
  }
});


// ---------- CREAR RESERVA DE PASEO ----------
app.post('/api/reservas', async (req, res) => {
  const { id_cliente, id_mascota, fecha, diaVip } = req.body;

  if (!id_cliente || !id_mascota || !fecha) {
    return res
      .status(400)
      .json({ ok: false, message: 'Faltan datos para la reserva' });
  }

  const { hora_inicio, hora_fin } = mapSlot(diaVip);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Elegimos un cuidador existente (por ahora el primero que haya)
    const [cuidadorRows] = await conn.execute(
      'SELECT id_cuidador FROM cuidadores_perfil ORDER BY id_cuidador ASC LIMIT 1'
    );

    if (cuidadorRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        ok: false,
        message: 'No hay cuidadores registrados en el sistema.',
      });
    }

    const id_cuidador = cuidadorRows[0].id_cuidador;

    // 2) Servicio fijo por ahora (puedes cambiarlo luego)
    const id_servicio = 1;

    // 3) Crear una disponibilidad asociada a esta reserva
    const [dispResult] = await conn.execute(
      `INSERT INTO disponibilidades (id_cuidador, fecha, hora_inicio, hora_fin, estado)
       VALUES (?, ?, ?, ?, 'reservado')`,
      [id_cuidador, fecha, hora_inicio, hora_fin]
    );
    const id_disponibilidad = dispResult.insertId;

    // 4) Crear la reserva
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
    res.status(500).json({ ok: false, message: 'Error al crear la reserva' });
  } finally {
    conn.release();
  }
});

app.listen(PORT, () => {
  console.log(`API PAWGO escuchando en http://localhost:${PORT}`);
});
