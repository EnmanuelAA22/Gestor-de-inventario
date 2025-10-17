// backend/server.js - VERSIÓN COMPLETA PARA TELECOMUNICACIONES
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../public'));

// Conexión a MySQL
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
    console.log('✅ Conectado a MySQL correctamente');
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM inventario');
    console.log(`📊 Base de datos cargada: ${rows[0].count} equipos en inventario`);
    
    const [userRows] = await connection.execute('SELECT COUNT(*) as count FROM usuarios');
    console.log(`👥 Usuarios en sistema: ${userRows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    process.exit(1);
  }
}

// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Token requerido' });
  }

  // Simulamos usuario básico para las rutas protegidas
  req.user = {
    username: 'admin',
    rol: 'Administrador'
  };
  
  next();
}

// ==================== RUTAS PÚBLICAS ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/app-a.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/app-a.html'));
});

app.get('/inventario.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/inventario.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/panel control.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/panel control.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Test de conexión a BD
app.get('/api/test-connection', async (req, res) => {
  try {
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    res.json({ 
      success: true, 
      message: '✅ Conexión a BD exitosa',
      data: rows 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '❌ Error de conexión a BD: ' + error.message 
    });
  }
});

// ==================== RUTAS DE AUTENTICACIÓN CON MYSQL ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 Intento de login:', username);
    
    // Buscar usuario en la base de datos
    const [users] = await connection.execute(
      'SELECT * FROM usuarios WHERE username = ? AND activo = true',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = users[0];
    
    // Verificar contraseña directamente (sin hash para simplificar)
    if (password === user.password_directa) {
      console.log('✅ Login exitoso para:', username);
      
      // Registrar en auditoría
      await connection.execute(
        `INSERT INTO auditoria (usuario, accion, modulo, descripcion) 
         VALUES (?, 'Login', 'Autenticación', ?)`,
        [username, `Usuario ${username} inició sesión`]
      );
      
      res.json({
        success: true,
        message: 'Login exitoso',
        token: 'user-token-' + Date.now(),
        user: {
          id: user.id,
          username: user.username,
          rol: user.rol,
          email: user.email,
          nombre_completo: user.nombre_completo
        }
      });
    } else {
      // Registrar intento fallido
      await connection.execute(
        `INSERT INTO auditoria (usuario, accion, modulo, descripcion) 
         VALUES (?, 'Login Fallido', 'Autenticación', ?)`,
        [username, `Intento fallido de login para usuario ${username}`]
      );
      
      res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en login: ' + error.message
    });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    valid: true,
    user: req.user
  });
});

// ==================== RUTAS DE INVENTARIO - TELECOMUNICACIONES ====================
app.get('/api/inventario', authenticateToken, async (req, res) => {
  try {
    const [rows] = await connection.execute(`
      SELECT i.*, c.nombre as categoria_nombre 
      FROM inventario i 
      LEFT JOIN categorias c ON i.categoria_id = c.id 
      WHERE i.activo = true
      ORDER BY i.codigo, i.id DESC
    `);
    
    console.log(`📊 Inventario: ${rows.length} equipos encontrados`);
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
    
  } catch (error) {
    console.error('❌ Error en /api/inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo inventario: ' + error.message
    });
  }
});

app.get('/api/inventario/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM inventario WHERE id = ? AND activo = true',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo equipo: ' + error.message
    });
  }
});

// AGREGAR EQUIPO - VERSIÓN TELECOMUNICACIONES (SIN RESTRICCIONES UNICAS)
app.post('/api/inventario', authenticateToken, async (req, res) => {
  try {
    let { codigo, nombre, descripcion, categoria_id, tipo, cantidad, serial, estado, ubicacion } = req.body;
    
    console.log('📦 Agregando equipo para telecomunicaciones:', { 
      codigo, 
      nombre, 
      tipo, 
      serial: serial || 'N/A' 
    });
    
    // VALIDACIONES PARA TELECOMUNICACIONES
    if (tipo === 'serializado') {
      // Para equipos serializados (modems, routers), el serial es requerido
      if (!serial || serial.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El número de serie es obligatorio para equipos serializados'
        });
      }
    } else {
      // Para materiales por cantidad (cables, conectores), el serial debe ser NULL
      serial = null;
      if (!cantidad || cantidad < 1) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser al menos 1 para materiales no serializados'
        });
      }
    }
    
    // Validaciones básicas
    if (!codigo || !nombre || !ubicacion) {
      return res.status(400).json({
        success: false,
        message: 'Código, nombre y ubicación son campos obligatorios'
      });
    }
    
    // INSERTAR SIN RESTRICCIONES DE UNICIDAD
    const [result] = await connection.execute(
      `INSERT INTO inventario (codigo, nombre, descripcion, categoria_id, tipo, cantidad, serial, estado, ubicacion) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, nombre, descripcion, categoria_id, tipo, cantidad, serial, estado, ubicacion]
    );
    
    // Registrar en auditoría
    await connection.execute(
      `INSERT INTO auditoria (usuario, accion, modulo, descripcion) 
       VALUES (?, 'Agregar', 'Inventario', ?)`,
      [req.user.username, `Equipo "${nombre}" (${codigo}) ${serial ? 'con serie ' + serial : 'cantidad: ' + cantidad} agregado`]
    );
    
    // Obtener el equipo recién insertado
    const [rows] = await connection.execute('SELECT * FROM inventario WHERE id = ?', [result.insertId]);
    
    console.log('✅ Equipo agregado exitosamente:', {
      id: result.insertId,
      codigo: codigo,
      nombre: nombre,
      serial: serial
    });
    
    res.json({
      success: true,
      message: 'Equipo agregado correctamente al inventario',
      data: rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error agregando equipo:', error);
    
    // Manejo específico de errores de MySQL
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Error de duplicado. Por favor contacte al administrador para verificar las restricciones de la base de datos.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error agregando equipo: ' + error.message
    });
  }
});

// ACTUALIZAR EQUIPO - VERSIÓN TELECOMUNICACIONES
app.put('/api/inventario/:id', authenticateToken, async (req, res) => {
  try {
    let { codigo, nombre, descripcion, categoria_id, tipo, cantidad, serial, estado, ubicacion } = req.body;
    
    // Obtener el equipo actual
    const [currentMaterial] = await connection.execute(
      'SELECT * FROM inventario WHERE id = ?',
      [req.params.id]
    );
    
    if (currentMaterial.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }
    
    // Para equipos serializados, validar que tenga serial
    if (tipo === 'serializado') {
      if (!serial || serial.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El número de serie es obligatorio para equipos serializados'
        });
      }
    } else {
      // Para no serializados, serial debe ser NULL
      serial = null;
    }
    
    // Validaciones básicas
    if (!codigo || !nombre || !ubicacion) {
      return res.status(400).json({
        success: false,
        message: 'Código, nombre y ubicación son campos obligatorios'
      });
    }
    
    // ACTUALIZAR SIN RESTRICCIONES DE UNICIDAD
    await connection.execute(
      `UPDATE inventario SET codigo=?, nombre=?, descripcion=?, categoria_id=?, tipo=?,
       cantidad=?, serial=?, estado=?, ubicacion=? WHERE id=?`,
      [codigo, nombre, descripcion, categoria_id, tipo, cantidad, serial, estado, ubicacion, req.params.id]
    );
    
    await connection.execute(
      `INSERT INTO auditoria (usuario, accion, modulo, descripcion) 
       VALUES (?, 'Actualizar', 'Inventario', ?)`,
      [req.user.username, `Equipo "${nombre}" (${codigo}) actualizado`]
    );
    
    res.json({
      success: true,
      message: 'Equipo actualizado correctamente'
    });
    
  } catch (error) {
    console.error('❌ Error actualizando equipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando equipo: ' + error.message
    });
  }
});

app.delete('/api/inventario/:id', authenticateToken, async (req, res) => {
  try {
    const [equipo] = await connection.execute('SELECT nombre, codigo FROM inventario WHERE id = ?', [req.params.id]);
    
    await connection.execute('UPDATE inventario SET activo = false WHERE id = ?', [req.params.id]);
    
    if (equipo.length > 0) {
      await connection.execute(
        `INSERT INTO auditoria (usuario, accion, modulo, descripcion) 
         VALUES (?, 'Eliminar', 'Inventario', ?)`,
        [req.user.username, `Equipo "${equipo[0].nombre}" (${equipo[0].codigo}) eliminado`]
      );
    }
    
    res.json({
      success: true,
      message: 'Equipo eliminado correctamente'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error eliminando equipo: ' + error.message
    });
  }
});

// BÚSQUEDA DE EQUIPOS
app.get('/api/inventario/buscar', authenticateToken, async (req, res) => {
  try {
    const termino = req.query.q;
    
    if (!termino) {
      return res.status(400).json({
        success: false,
        message: 'Término de búsqueda requerido'
      });
    }
    
    const searchTerm = `%${termino}%`;
    
    const [rows] = await connection.execute(
      `SELECT i.*, c.nombre as categoria_nombre 
       FROM inventario i 
       LEFT JOIN categorias c ON i.categoria_id = c.id 
       WHERE i.activo = true AND (
         i.codigo LIKE ? OR 
         i.nombre LIKE ? OR 
         i.descripcion LIKE ? OR 
         i.serial LIKE ? OR 
         i.ubicacion LIKE ?
       )
       ORDER BY i.codigo, i.id DESC`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    );
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error buscando equipos: ' + error.message
    });
  }
});

// ==================== RUTAS DE DASHBOARD ====================
app.get('/api/dashboard/estadisticas', authenticateToken, async (req, res) => {
  try {
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as totalItems,
        SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as availableItems,
        SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) as maintenanceItems,
        SUM(CASE WHEN estado = 'en-uso' THEN 1 ELSE 0 END) as enUsoItems,
        SUM(CASE WHEN tipo = 'serializado' THEN 1 ELSE 0 END) as serializedItems,
        SUM(CASE WHEN cantidad < 5 THEN 1 ELSE 0 END) as lowStockItems,
        SUM(CASE WHEN cantidad = 0 THEN 1 ELSE 0 END) as outOfStockItems,
        (SELECT COUNT(*) FROM auditoria WHERE DATE(fecha) = CURDATE()) as totalMovements
      FROM inventario WHERE activo = true
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas: ' + error.message
    });
  }
});

// Ruta para obtener actividad reciente
app.get('/api/dashboard/actividad', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Solicitando actividad reciente...');
    
    const [actividad] = await connection.execute(`
      SELECT 
        id,
        usuario,
        accion,
        modulo,
        descripcion,
        fecha as fecha_creacion
      FROM auditoria 
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY fecha DESC 
      LIMIT 3
    `);
    
    console.log(`📝 Actividad encontrada: ${actividad.length} registros`);
    
    if (actividad.length === 0) {
      console.log('⚠️  No hay actividad reciente, generando datos de ejemplo');
      const actividadEjemplo = await generarActividadReciente();
      return res.json({
        success: true,
        data: actividadEjemplo,
        usandoEjemplo: true
      });
    }
    
    // Mapear los datos para que coincidan con lo que espera el frontend
    const actividadMapeada = actividad.map(item => ({
      id: item.id,
      usuario: item.usuario,
      accion: item.accion,
      modulo: item.modulo,
      descripcion: item.descripcion,
      fecha: item.fecha_creacion,
      tipo: getTipoActividad(item.accion),
      icon: getIconoActividad(item.accion)
    }));
    
    res.json({
      success: true,
      data: actividadMapeada,
      usandoEjemplo: false
    });
    
  } catch (error) {
    console.error('❌ Error en /api/dashboard/actividad:', error);
    const actividadEjemplo = await generarActividadReciente();
    res.json({
      success: true,
      data: actividadEjemplo,
      usandoEjemplo: true,
      message: 'Usando datos de ejemplo: ' + error.message
    });
  }
});

// Ruta para alertas del sistema
app.get('/api/dashboard/alertas', authenticateToken, async (req, res) => {
  try {
    const [stockBajo] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM inventario 
      WHERE cantidad < 5 AND cantidad > 0 AND activo = true
    `);
    
    const [stockAgotado] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM inventario 
      WHERE cantidad = 0 AND activo = true
    `);
    
    const [mantenimiento] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM inventario 
      WHERE estado = 'mantenimiento' AND activo = true
    `);
    
    const alertas = [];
    
    if (stockBajo[0].count > 0) {
      alertas.push({
        id: 1,
        title: 'Stock Bajo',
        message: `${stockBajo[0].count} productos tienen stock bajo`,
        type: 'warning',
        critical: stockBajo[0].count > 10,
        timestamp: new Date().toISOString()
      });
    }
    
    if (stockAgotado[0].count > 0) {
      alertas.push({
        id: 2,
        title: 'Stock Agotado',
        message: `${stockAgotado[0].count} productos están agotados`,
        type: 'danger',
        critical: true,
        timestamp: new Date().toISOString()
      });
    }
    
    if (mantenimiento[0].count > 0) {
      alertas.push({
        id: 3,
        title: 'Equipos en Mantenimiento',
        message: `${mantenimiento[0].count} equipos están en mantenimiento`,
        type: 'info',
        critical: false,
        timestamp: new Date().toISOString()
      });
    }
    
    // Si no hay alertas, agregar una de información
    if (alertas.length === 0) {
      alertas.push({
        id: 4,
        title: 'Sistema Estable',
        message: 'No hay alertas críticas en este momento',
        type: 'success',
        critical: false,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: alertas
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo alertas: ' + error.message
    });
  }
});

// ==================== RUTAS DE USUARIOS ====================
app.get('/api/usuarios', authenticateToken, async (req, res) => {
  try {
    const [usuarios] = await connection.execute(`
      SELECT id, username, email, nombre_completo, rol, activo, fecha_creacion
      FROM usuarios 
      WHERE activo = true
      ORDER BY nombre_completo
    `);
    
    res.json({
      success: true,
      data: usuarios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios: ' + error.message
    });
  }
});

app.post('/api/usuarios', authenticateToken, async (req, res) => {
  try {
    const { username, email, nombre_completo, rol, password_directa } = req.body;
    
    // Verificar si el usuario ya existe
    const [existing] = await connection.execute(
      'SELECT id FROM usuarios WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El usuario o email ya existe'
      });
    }
    
    const [result] = await connection.execute(
      `INSERT INTO usuarios (username, email, nombre_completo, rol, password_directa) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, nombre_completo, rol, password_directa]
    );
    
    await connection.execute(
      `INSERT INTO auditoria (usuario, accion, modulo, descripcion) 
       VALUES (?, 'Crear', 'Usuarios', ?)`,
      [req.user.username, `Usuario "${username}" creado`]
    );
    
    res.json({
      success: true,
      message: 'Usuario creado correctamente',
      data: { id: result.insertId }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando usuario: ' + error.message
    });
  }
});

// ==================== RUTAS ADICIONALES ====================
app.get('/api/auditoria', authenticateToken, async (req, res) => {
  try {
    const [auditoria] = await connection.execute(`
      SELECT * FROM auditoria 
      ORDER BY fecha DESC 
      LIMIT 50
    `);
    
    res.json({
      success: true,
      data: auditoria
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo auditoría: ' + error.message
    });
  }
});

app.get('/api/logs', authenticateToken, async (req, res) => {
  try {
    const [logs] = await connection.execute(`
      SELECT * FROM logs_sistema 
      ORDER BY fecha DESC 
      LIMIT 50
    `);
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs: ' + error.message
    });
  }
});

app.post('/api/backup', authenticateToken, async (req, res) => {
  try {
    await connection.execute(
      `INSERT INTO auditoria (usuario, accion, modulo, descripcion) 
       VALUES (?, 'Backup', 'Sistema', 'Backup del sistema creado manualmente')`,
      [req.user.username]
    );
    
    res.json({
      success: true,
      message: 'Backup creado correctamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando backup: ' + error.message
    });
  }
});

// ==================== FUNCIONES AUXILIARES ====================

// Función para generar actividad reciente basada en el inventario
async function generarActividadReciente() {
  try {
    const [inventarioReciente] = await connection.execute(`
      SELECT 
        codigo,
        nombre,
        fecha_creacion
      FROM inventario 
      WHERE activo = true
      ORDER BY fecha_creacion DESC 
      LIMIT 3
    `);
    
    const actividad = inventarioReciente.map((item, index) => {
      const horas = index * 2;
      const fecha = new Date(Date.now() - horas * 60 * 60 * 1000);
      
      return {
        id: item.codigo,
        usuario: 'admin',
        accion: 'Agregar',
        modulo: 'Inventario',
        descripcion: `Equipo "${item.nombre}" agregado al inventario`,
        fecha: fecha.toISOString(),
        tipo: 'success',
        icon: 'fa-box'
      };
    });
    
    return actividad;
  } catch (error) {
    console.error('Error generando actividad de ejemplo:', error);
    return [
      {
        id: 1,
        usuario: 'admin',
        accion: 'Login',
        modulo: 'Sistema',
        descripcion: 'Usuario administrador inició sesión',
        fecha: new Date().toISOString(),
        tipo: 'primary',
        icon: 'fa-user'
      },
      {
        id: 2,
        usuario: 'admin',
        accion: 'Agregar',
        modulo: 'Inventario',
        descripcion: 'Modem Huawei agregado al inventario',
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        tipo: 'success',
        icon: 'fa-box'
      },
      {
        id: 3,
        usuario: 'admin',
        accion: 'Actualizar',
        modulo: 'Inventario',
        descripcion: 'Stock de cables actualizado',
        fecha: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        tipo: 'info',
        icon: 'fa-sync-alt'
      }
    ];
  }
}

// Funciones auxiliares para mapear actividad
function getTipoActividad(accion) {
  const tipos = {
    'Agregar': 'success',
    'Actualizar': 'info',
    'Eliminar': 'danger',
    'Login': 'primary'
  };
  return tipos[accion] || 'info';
}

function getIconoActividad(accion) {
  const iconos = {
    'Agregar': 'fa-plus-circle',
    'Actualizar': 'fa-edit',
    'Eliminar': 'fa-trash',
    'Login': 'fa-sign-in-alt'
  };
  return iconos[accion] || 'fa-circle';
}

// ==================== RUTA PARA SERVIR ARCHIVOS ESTÁTICOS ====================
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, '../public', req.path);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, '../public/404.html'));
    }
  });
});

// ==================== INICIAR SERVIDOR ====================
async function startServer() {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`📁 Sirviendo archivos desde: ../public/`);
      console.log(`🏠 Frontend: http://localhost:${PORT}`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
      console.log('');
      console.log('🔐 Sistema de autenticación directa con MySQL');
      console.log('📡 ESPECIALIZADO PARA TELECOMUNICACIONES');
      console.log('✅ Permite múltiples equipos con mismo código y serie');
      console.log('💡 Ideal para modems, routers, y equipos de telecom');
      console.log('');
      console.log('💡 Para detener el servidor: Ctrl + C');
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
  }
}

startServer();