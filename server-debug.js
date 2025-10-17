// server-debug.js - VERSIÓN DEBUG
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001; // Puerto diferente para debugging

app.use(cors());
app.use(express.json());
app.use(express.static('../public'));

const dbConfig = {
  host: 'localhost',
  user: 'root', 
  password: 'admin',
  database: 'inventario_db'
};

let connection;

async function connectDB() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');
    
    // Verificar usuarios
    const [users] = await connection.execute('SELECT * FROM usuarios');
    console.log('👥 Usuarios en BD:', users);
    
  } catch (error) {
    console.error('❌ Error MySQL:', error.message);
  }
}

// Login simplificado para debugging
app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Login attempt:', req.body);
  
  const { username, password } = req.body;
  
  try {
    // Buscar usuario
    const [users] = await connection.execute(
      'SELECT * FROM usuarios WHERE username = ? AND activo = true', 
      [username]
    );
    
    console.log('📋 Usuarios encontrados:', users);
    
    if (users.length === 0) {
      console.log('❌ Usuario no encontrado');
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = users[0];
    console.log('🔍 Usuario encontrado:', user.username);
    console.log('🔍 Password en BD:', user.password_directa);
    console.log('🔍 Password recibido:', password);
    
    // Verificar contraseña
    if (user.password_directa === password) {
      console.log('✅ Login exitoso');
      res.json({
        success: true,
        message: 'Login exitoso',
        token: 'debug-token',
        user: {
          id: user.id,
          username: user.username,
          rol: user.rol,
          email: user.email
        }
      });
    } else {
      console.log('❌ Contraseña incorrecta');
      res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor: ' + error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Debug server running' });
});

connectDB();

app.listen(PORT, () => {
  console.log(`🐛 Debug server en http://localhost:${PORT}`);
});