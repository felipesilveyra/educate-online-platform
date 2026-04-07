/**
 * BACKEND PARA PLATAFORMA DE APRENDIZAJE + SHOPIFY
 * Listo para Railway (SIN GitHub, SIN terminal)
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Middleware para raw body (webhook de Shopify)
app.use(express.raw({ type: 'application/json' }));

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'educate_online',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-secreta-super-segura';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';

// Pool de conexiones
const pool = mysql.createPool(DB_CONFIG);

// ─── DATOS DE MÓDULOS Y VIDEOS ────────────────────────────────────────────────
const MODULES = [
  { id: 1, moduleNumber: 1, title: "Mentalidad", description: "Desarrollá la base mental correcta para sostener el proceso, evitar frustrarte rápido y entrar al rol con enfoque y seguridad." },
  { id: 2, moduleNumber: 2, title: "Psicología de Alto Valor", description: "Entendé cómo piensa un prospecto, qué lo frena, qué lo mueve y cómo leer mejor una conversación de venta." },
  { id: 3, moduleNumber: 3, title: "Estructura de Ventas", description: "Aprendé a ordenar una llamada de venta de principio a fin para no improvisar y llevar la conversación con dirección." },
  { id: 4, moduleNumber: 4, title: "Guiones de Venta", description: "Usá guiones como apoyo para tener claridad, seguridad y una estructura concreta al momento de vender." },
  { id: 5, moduleNumber: 5, title: "Rebatir Objeciones", description: "Respondé dudas, frenos y resistencias del prospecto sin perder autoridad ni trabarte en la llamada." },
  { id: 6, moduleNumber: 6, title: "Cómo Encontrar Socios", description: "Aprendé a acercarte a empresas, oportunidades o alianzas para empezar a moverte dentro del mercado digital." },
  { id: 7, moduleNumber: 7, title: "Ingresos de 6 Cifras", description: "La lógica, el enfoque y la estructura comercial necesarios para construir un camino serio de crecimiento en ventas." },
  { id: 8, moduleNumber: 8, title: "7 Errores Mortales", description: "Detectá y evitá los errores más comunes que frenan resultados, bajan la confianza y arruinan cierres." },
];

const VIDEOS = [
  // Módulo 1
  { id: 1, moduleId: 1, videoNumber: 1, title: "Mentalidad - Parte 1", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 2, moduleId: 1, videoNumber: 2, title: "Mentalidad - Parte 2", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  // Módulo 2
  { id: 3, moduleId: 2, videoNumber: 1, title: "Psicología - Parte 1", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 4, moduleId: 2, videoNumber: 2, title: "Psicología - Parte 2", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  // Módulo 3
  { id: 5, moduleId: 3, videoNumber: 1, title: "Estructura - Parte 1", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 6, moduleId: 3, videoNumber: 2, title: "Estructura - Parte 2", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  // Módulo 4
  { id: 7, moduleId: 4, videoNumber: 1, title: "Guiones - Parte 1", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 8, moduleId: 4, videoNumber: 2, title: "Guiones - Parte 2", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  // Módulo 5
  { id: 9, moduleId: 5, videoNumber: 1, title: "Objeciones - Parte 1", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 10, moduleId: 5, videoNumber: 2, title: "Objeciones - Parte 2", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  // Módulo 6
  { id: 11, moduleId: 6, videoNumber: 1, title: "Socios - Parte 1", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 12, moduleId: 6, videoNumber: 2, title: "Socios - Parte 2", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  // Módulo 7
  { id: 13, moduleId: 7, videoNumber: 1, title: "6 Cifras - Parte 1", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 14, moduleId: 7, videoNumber: 2, title: "6 Cifras - Parte 2", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  // Módulo 8
  { id: 15, moduleId: 8, videoNumber: 1, title: "Errores - Parte 1", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
];

// ─── FUNCIONES AUXILIARES ────────────────────────────────────────────────────
async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    // Crear tabla de usuarios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shopify_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password VARCHAR(255),
        shopify_order_id VARCHAR(255),
        access_granted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de progreso
    await connection.query(`
      CREATE TABLE IF NOT EXISTS progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        video_id INT NOT NULL,
        watched BOOLEAN DEFAULT FALSE,
        watched_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE KEY unique_user_video (user_id, video_id)
      )
    `);

    console.log('✅ Base de datos inicializada');
  } catch (error) {
    console.error('Error inicializando BD:', error);
  } finally {
    connection.release();
  }
}

// Generar JWT
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

// Verificar JWT
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  req.userId = decoded.userId;
  next();
}

// ─── RUTAS: AUTENTICACIÓN ────────────────────────────────────────────────────

// Login con email
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Email o contraseña inválidos' });
    }

    const user = users[0];
    if (!user.access_granted) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    const connection = await pool.getConnection();
    
    try {
      await connection.query(
        'INSERT INTO users (email, name, password, access_granted) VALUES (?, ?, ?, ?)',
        [email, name, password, true]
      );

      const [newUsers] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
      const user = newUsers[0];
      const token = generateToken(user.id);

      res.json({ 
        token, 
        user: { id: user.id, email: user.email, name: user.name },
        message: 'Registro exitoso'
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email ya registrado' });
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── RUTAS: MÓDULOS Y VIDEOS ────────────────────────────────────────────────

app.get('/api/modules', (req, res) => {
  res.json(MODULES);
});

app.get('/api/modules/:moduleId/videos', (req, res) => {
  const { moduleId } = req.params;
  const videos = VIDEOS.filter(v => v.moduleId === parseInt(moduleId));
  res.json(videos);
});

// ─── RUTAS: PROGRESO ────────────────────────────────────────────────────────

app.get('/api/progress', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [progress] = await connection.query(
      'SELECT * FROM progress WHERE user_id = ?',
      [req.userId]
    );
    connection.release();

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/progress/mark-watched', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.body;

    const connection = await pool.getConnection();
    await connection.query(
      `INSERT INTO progress (user_id, video_id, watched, watched_at) 
       VALUES (?, ?, true, NOW())
       ON DUPLICATE KEY UPDATE watched = true, watched_at = NOW()`,
      [req.userId, videoId]
    );
    connection.release();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── WEBHOOK DE SHOPIFY ────────────────────────────────────────────────────

app.post('/api/webhooks/shopify/order-created', async (req, res) => {
  try {
    // Convertir body a JSON si es necesario
    let order;
    if (typeof req.body === 'string') {
      order = JSON.parse(req.body);
    } else {
      order = req.body;
    }

    const email = order.email;
    const customerName = order.customer?.first_name || 'Cliente';

    const connection = await pool.getConnection();

    // Buscar o crear usuario
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    let userId;
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      // Actualizar acceso
      await connection.query(
        'UPDATE users SET access_granted = true, shopify_order_id = ? WHERE id = ?',
        [order.id, userId]
      );
    } else {
      // Crear nuevo usuario
      await connection.query(
        'INSERT INTO users (email, name, shopify_id, shopify_order_id, access_granted) VALUES (?, ?, ?, ?, true)',
        [email, customerName, order.customer?.id, order.id]
      );

      const [newUsers] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
      userId = newUsers[0].id;
    }

    connection.release();

    console.log(`✅ Usuario ${email} obtuvo acceso automático`);
    res.json({ success: true, userId });
  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── RUTAS: USUARIO ACTUAL ────────────────────────────────────────────────

app.get('/api/user/me', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT id, email, name, access_granted FROM users WHERE id = ?',
      [req.userId]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── HEALTH CHECK ────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});

// ─── INICIAR SERVIDOR ────────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  await initializeDatabase();
});

module.exports = app;
