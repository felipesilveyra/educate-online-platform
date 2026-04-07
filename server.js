/**
 * BACKEND PARA PLATAFORMA DE APRENDIZAJE + SHOPIFY
 * Versión Railway - Simplificada y robusta
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-secreta-super-segura';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';

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
  { id: 1, moduleId: 1, videoNumber: 1, title: "Mentalidad - Parte 1", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 2, moduleId: 1, videoNumber: 2, title: "Mentalidad - Parte 2", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 3, moduleId: 2, videoNumber: 1, title: "Psicología - Parte 1", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 4, moduleId: 2, videoNumber: 2, title: "Psicología - Parte 2", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 5, moduleId: 3, videoNumber: 1, title: "Estructura - Parte 1", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 6, moduleId: 3, videoNumber: 2, title: "Estructura - Parte 2", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 7, moduleId: 4, videoNumber: 1, title: "Guiones - Parte 1", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 8, moduleId: 4, videoNumber: 2, title: "Guiones - Parte 2", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 9, moduleId: 5, videoNumber: 1, title: "Objeciones - Parte 1", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 10, moduleId: 5, videoNumber: 2, title: "Objeciones - Parte 2", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 11, moduleId: 6, videoNumber: 1, title: "Socios - Parte 1", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 12, moduleId: 6, videoNumber: 2, title: "Socios - Parte 2", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 13, moduleId: 7, videoNumber: 1, title: "6 Cifras - Parte 1", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 14, moduleId: 7, videoNumber: 2, title: "6 Cifras - Parte 2", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 15, moduleId: 8, videoNumber: 1, title: "Errores Mortales", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
];

// Almacenamiento en memoria (temporal)
const users = [];
const progress = [];

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

// ─── RUTAS: AUTENTICACIÓN ────────────────────────────────────────────────

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Verificar si el usuario ya existe
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email ya registrado' });
    }

    const userId = users.length + 1;
    const user = {
      id: userId,
      email,
      name: name || email,
      password, // En producción, hashear esto
      access_granted: false,
      created_at: new Date(),
    };

    users.push(user);
    const token = generateToken(userId);

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generateToken(user.id);
    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
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

// ─── RUTAS: PROGRESO ────────────────────────────────────────────────────

app.get('/api/progress', authenticateToken, (req, res) => {
  try {
    const userProgress = progress.filter(p => p.user_id === req.userId);
    res.json(userProgress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/progress/mark-watched', authenticateToken, (req, res) => {
  try {
    const { videoId } = req.body;

    const existingProgress = progress.find(
      p => p.user_id === req.userId && p.video_id === videoId
    );

    if (!existingProgress) {
      progress.push({
        id: progress.length + 1,
        user_id: req.userId,
        video_id: videoId,
        watched: true,
        watched_at: new Date(),
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── RUTAS: WEBHOOK SHOPIFY ────────────────────────────────────────────────

app.post('/api/webhooks/shopify/order-created', (req, res) => {
  try {
    const { email, customer } = req.body;
    const userEmail = email || (customer && customer.email);

    if (!userEmail) {
      return res.status(400).json({ error: 'Email no encontrado' });
    }

    let user = users.find(u => u.email === userEmail);
    let userId;

    if (!user) {
      userId = users.length + 1;
      user = {
        id: userId,
        email: userEmail,
        name: customer?.first_name || 'Usuario',
        password: crypto.randomBytes(16).toString('hex'),
        access_granted: true,
        created_at: new Date(),
      };
      users.push(user);
    } else {
      user.access_granted = true;
      userId = user.id;
    }

    res.json({ success: true, userId });
  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── RUTAS: USUARIO ACTUAL ────────────────────────────────────────────────

app.get('/api/user/me', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      access_granted: user.access_granted,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── HEALTH CHECK ────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});

// ─── INICIAR SERVIDOR ────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`✅ API disponible en http://localhost:${PORT}/api`);
});

module.exports = app;
