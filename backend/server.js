// backend/server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3000;

// permitir peticiones desde tu HTML
app.use(cors());
app.use(express.json());

// conexión a MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',            // TU usuario de MySQL
  password: 'TU_PASSWORD', // TU contraseña de MySQL
  database: 'pawgo',
  port: 3306,
});

app.get('/', (req, res) => {
  res.send('API PAWGO OK');
});

// REGISTRO DE USUARIO
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

  if (!nombres || !apellidoP || !correo || !password || !calle || !cp) {
    return res.status(400).json({ ok: false, message: 'Faltan datos' });
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

// LOGIN
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

app.listen(PORT, () => {
  console.log(`API PAWGO escuchando en http://localhost:${PORT}`);
});

