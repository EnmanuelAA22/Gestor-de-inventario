-- Crear base de datos
CREATE DATABASE IF NOT EXISTS inventario_db;
USE inventario_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_directa VARCHAR(100), -- Campo adicional para login simplificado
    nombre_completo VARCHAR(100) NOT NULL,
    rol ENUM('Administrador', 'Almacén', 'Consulta') DEFAULT 'Consulta',
    permisos JSON,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de categorías (CORREGIDA)
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#3498db',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de inventario (ACTUALIZADA - SIN UNICIDAD EN CÓDIGO)
CREATE TABLE IF NOT EXISTS inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    tipo ENUM('cantidad', 'serializado') NOT NULL,
    cantidad INT DEFAULT 0,
    serial VARCHAR(100), -- QUITAMOS UNIQUE PARA PERMITIR NULL EN MATERIALES POR CANTIDAD
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
    INDEX idx_codigo (codigo), -- ÍNDICE NORMAL, NO ÚNICO
    INDEX idx_categoria (categoria_id),
    INDEX idx_estado (estado),
    INDEX idx_tipo (tipo),
    INDEX idx_serial (serial)
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

-- Insertar categorías por defecto (ACTUALIZADO)
INSERT IGNORE INTO categorias (id, nombre, descripcion, color) VALUES
(1, 'electronica', 'Componentes y equipos electrónicos', '#3498db'),
(2, 'herramientas', 'Herramientas manuales y eléctricas', '#e74c3c'),
(3, 'componentes', 'Componentes varios', '#f39c12'),
(4, 'consumibles', 'Materiales consumibles', '#27ae60'),
(5, 'equipos', 'Equipos y maquinaria', '#9b59b6'),
(6, 'instrumentos', 'Instrumentos de medición', '#2ecc71'),
(7, 'oficina', 'Material de oficina', '#1abc9c');

-- Insertar usuario administrador por defecto (CONTRASEÑA: admin123)
INSERT IGNORE INTO usuarios (username, email, password_hash, password_directa, nombre_completo, rol, permisos) VALUES
('admin', 'admin@sistema.com', '$2a$10$8K1p/a0dRTlB0Z6bZ8BzE.WZR5Xc5J5X5J5X5J5X5J5X5J5X5J5X5J', 'admin123', 
 'Administrador del Sistema', 'Administrador', '["dashboard", "inventario", "panel_control", "usuarios", "configuracion", "reportes"]');

-- Insertar datos de ejemplo para inventario (ACTUALIZADO) - CON CÓDIGOS DUPLICADOS
INSERT IGNORE INTO inventario (codigo, nombre, descripcion, categoria_id, tipo, cantidad, serial, estado, ubicacion) VALUES
('TEC-001', 'Multímetro Digital', 'Multímetro digital profesional para mediciones eléctricas', 6, 'serializado', 1, 'MTD-2024-001', 'disponible', 'Estante A-1'),
('TEC-001', 'Multímetro Digital', 'Multímetro digital profesional para mediciones eléctricas', 6, 'serializado', 1, 'MTD-2024-002', 'disponible', 'Estante A-1'),
('TEC-001', 'Multímetro Digital', 'Multímetro digital profesional para mediciones eléctricas', 6, 'serializado', 1, 'MTD-2024-003', 'en-uso', 'Laboratorio'),
('TEC-002', 'Soldador 30W', 'Soldador de estaño 30W para electrónica', 2, 'cantidad', 5, NULL, 'disponible', 'Cajón Herramientas'),
('TEC-002', 'Soldador 30W', 'Soldador de estaño 30W para electrónica', 2, 'cantidad', 3, NULL, 'disponible', 'Estante B-2'),
('TEC-003', 'Osciloscopio', 'Osciloscopio digital 100MHz para laboratorio', 6, 'serializado', 1, 'OSC-2024-001', 'en-uso', 'Laboratorio Principal'),
('TEC-004', 'Cautín', 'Cautín para electrónica de precisión', 2, 'cantidad', 3, NULL, 'disponible', 'Estante B-2'),
('TEC-005', 'Tarjeta Arduino Uno', 'Microcontrolador Arduino Uno R3', 1, 'cantidad', 10, NULL, 'disponible', 'Estante C-3'),
('TEC-005', 'Tarjeta Arduino Uno', 'Microcontrolador Arduino Uno R3', 1, 'cantidad', 8, NULL, 'disponible', 'Estante C-4'),
('TEC-006', 'Fuente de Alimentación', 'Fuente regulada 0-30V 5A', 1, 'serializado', 1, 'FUA-2024-001', 'mantenimiento', 'Taller Reparaciones'),
('TEC-006', 'Fuente de Alimentación', 'Fuente regulada 0-30V 5A', 1, 'serializado', 1, 'FUA-2024-002', 'disponible', 'Estante D-1'),
('TEC-007', 'Resistencias 1/4W', 'Kit de resistencias variadas 1/4 watt', 3, 'cantidad', 150, NULL, 'disponible', 'Cajón Componentes'),
('TEC-008', 'Protoboard', 'Protoboard 830 puntos para prototipado', 1, 'cantidad', 8, NULL, 'disponible', 'Estante D-4');

-- Crear índices para mejor rendimiento
CREATE INDEX idx_inventario_codigo ON inventario(codigo);
CREATE INDEX idx_inventario_categoria ON inventario(categoria_id);
CREATE INDEX idx_inventario_estado ON inventario(estado);
CREATE INDEX idx_inventario_tipo ON inventario(tipo);
CREATE INDEX idx_inventario_serial ON inventario(serial);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario);
CREATE INDEX idx_logs_fecha ON logs_sistema(fecha);
CREATE INDEX idx_logs_nivel ON logs_sistema(nivel);

-- Vista para estadísticas del dashboard
CREATE VIEW vista_estadisticas_inventario AS
SELECT 
    COUNT(*) as total_items,
    SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as disponibles,
    SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) as mantenimiento,
    SUM(CASE WHEN estado = 'en-uso' THEN 1 ELSE 0 END) as en_uso,
    SUM(CASE WHEN estado = 'baja' THEN 1 ELSE 0 END) as baja,
    SUM(CASE WHEN tipo = 'serializado' THEN 1 ELSE 0 END) as serializados,
    SUM(CASE WHEN cantidad < 5 THEN 1 ELSE 0 END) as stock_bajo,
    SUM(CASE WHEN cantidad = 0 THEN 1 ELSE 0 END) as agotados
FROM inventario 
WHERE activo = TRUE;