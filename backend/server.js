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
  } = req.body;

  if (!nombres || !apellidoP || !correo || !password || !calle || !cp || !numExt) {
    return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios' });
  }

  const apellidos = `${apellidoP} ${apellidoM || ''}`.trim();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [userResult] = await conn.execute(
      `INSERT INTO usuarios (nombre, apellidos, email, password_hash, telefono)
       VALUES (?, ?, ?, ?, ?)`,
      [nombres, apellidos, correo, password, telefono || null]
    );

    const userId = userResult.insertId;

    await conn.execute(
      `INSERT INTO direcciones
       (id_usuario, calle, numero_ext, numero_int, colonia, cp, es_principal)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [userId, calle, numExt || '', numInt || null, alcaldia || '', cp]
    );

    await conn.commit();

    res.json({ ok: true, userId, nombre: nombres });
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
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error en login' });
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
    return res.status(400).json({ ok: false, message: 'Faltan datos para la reserva' });
  }

  // Por ahora usamos un cuidador fijo (id 2) y servicio fijo (id 1)
  const id_cuidador = 2;
  const id_servicio = 1;

  const { hora_inicio, hora_fin } = mapSlot(diaVip);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

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
    res.status(500).json({ ok: false, message: 'Error al crear la reserva' });
  } finally {
    conn.release();
  }
});

app.listen(PORT, () => {
  console.log(`API PAWGO escuchando en http://localhost:${PORT}`);
});
