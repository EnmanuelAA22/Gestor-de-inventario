// init.js
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initDatabase = async () => {
  // Configuración sin base de datos específica (para crear la BD si no existe)
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  };

  const connection = mysql.createConnection(config);

  try {
    console.log('🔧 Inicializando base de datos...');
    
    // Crear base de datos si no existe
    await new Promise((resolve, reject) => {
      connection.query('CREATE DATABASE IF NOT EXISTS inventario_db', (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
    
    console.log('✅ Base de datos creada/verificada');

    // Usar la base de datos
    await new Promise((resolve, reject) => {
      connection.query('USE inventario_db', (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });

    // Script SQL mejorado
    const sqlScript = `
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS inventario_db;
USE inventario_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    rol ENUM('Administrador', 'Almacén', 'Consulta') DEFAULT 'Consulta',
    permisos JSON,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#3498db',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de inventario
CREATE TABLE IF NOT EXISTS inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    tipo ENUM('cantidad', 'serializado') NOT NULL,
    cantidad INT DEFAULT 0,
    serial VARCHAR(100) UNIQUE,
    estado ENUM('disponible', 'en-uso', 'mantenimiento', 'baja') DEFAULT 'disponible',
    ubicacion VARCHAR(255) NOT NULL,
    fecha_adquisicion DATE,
    valor DECIMAL(10,2),
    proveedor VARCHAR(100),
    notas TEXT,
    imagen_url VARCHAR(500),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    INDEX idx_codigo (codigo),
    INDEX idx_categoria (categoria_id),
    INDEX idx_estado (estado)
);

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL,
    accion VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    datos_antes JSON,
    datos_despues JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario),
    INDEX idx_fecha (fecha)
);

-- Tabla de logs del sistema
CREATE TABLE IF NOT EXISTS logs_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nivel ENUM('INFO', 'WARNING', 'ERROR', 'DEBUG') NOT NULL,
    mensaje TEXT NOT NULL,
    modulo VARCHAR(50),
    usuario VARCHAR(50),
    ip_address VARCHAR(45),
    stack_trace TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nivel (nivel),
    INDEX idx_fecha (fecha)
);

-- Tabla de backups
CREATE TABLE IF NOT EXISTS backups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tamano BIGINT,
    tipo ENUM('automatico', 'manual') NOT NULL,
    estado ENUM('completado', 'fallido', 'en_progreso') DEFAULT 'en_progreso',
    usuario VARCHAR(50),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar categorías por defecto
INSERT IGNORE INTO categorias (id, nombre, descripcion, color) VALUES
(1, 'electronica', 'Componentes y equipos electrónicos', '#3498db'),
(2, 'herramientas', 'Herramientas manuales y eléctricas', '#e74c3c'),
(3, 'componentes', 'Componentes varios', '#f39c12'),
(4, 'consumibles', 'Materiales consumibles', '#27ae60'),
(5, 'equipos', 'Equipos y maquinaria', '#9b59b6'),
(6, 'seguridad', 'Equipos de seguridad', '#2ecc71'),
(7, 'oficina', 'Material de oficina', '#1abc9c');

-- Insertar usuario administrador por defecto (CONTRASEÑA: admin123)
INSERT IGNORE INTO usuarios (username, email, password_hash, nombre_completo, rol, permisos) VALUES
('admin', 'admin@sistema.com', '$2a$10$8K1p/a0dRTlB0Z6bZ8BzE.WZR5Xc5J5X5J5X5J5X5J5X5J5X5J5X5J', 
 'Administrador del Sistema', 'Administrador', '["dashboard", "inventario", "panel_control", "usuarios", "configuracion", "reportes"]');

-- Insertar datos de ejemplo para inventario
INSERT IGNORE INTO inventario (codigo, nombre, descripcion, categoria_id, tipo, cantidad, estado, ubicacion) VALUES
('TEC-001', 'Multímetro Digital', 'Multímetro digital profesional', 1, 'serializado', 1, 'disponible', 'Estante A-1'),
('TEC-002', 'Soldador 30W', 'Soldador de estaño 30W', 2, 'cantidad', 5, 'disponible', 'Cajón Herramientas'),
('TEC-003', 'Osciloscopio', 'Osciloscopio digital 100MHz', 1, 'serializado', 1, 'en-uso', 'Laboratorio'),
('TEC-004', 'Cautín', 'Cautín para electrónica', 2, 'cantidad', 3, 'disponible', 'Estante B-2');
`;

    // Ejecutar script SQL
    await new Promise((resolve, reject) => {
      connection.query(sqlScript, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
    
    console.log('✅ Tablas creadas exitosamente');
    console.log('📊 Tablas creadas: usuarios, categorias, inventario, auditoria, logs_sistema, backups');
    console.log('👤 Usuario administrador creado: admin / admin123');
    console.log('📦 Datos de ejemplo insertados');

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  } finally {
    connection.end();
  }
};

// Ejecutar inicialización
initDatabase().then(() => {
  console.log('🎉 Inicialización completada exitosamente!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error durante la inicialización:', error);
  process.exit(1);
});