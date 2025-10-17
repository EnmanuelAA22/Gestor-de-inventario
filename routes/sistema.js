const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { query } = require('../config/database');
const { Audit } = require('../models/Audit');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Obtener logs del sistema
router.get('/logs', authenticateToken, requireRole(['Administrador']), async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 50;
    
    const logs = await query(
      'SELECT * FROM logs_sistema ORDER BY fecha DESC LIMIT ?',
      [limite]
    );

    res.json({
      success: true,
      data: logs
    });

  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo logs del sistema'
    });
  }
});

// Crear backup de la base de datos
router.post('/backup', authenticateToken, requireRole(['Administrador']), async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_inventario_${timestamp}.sql`;
    const backupPath = path.join(__dirname, '../backups', backupFileName);

    // Crear directorio de backups si no existe
    const backupsDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Comando para mysqldump
    const command = `mysqldump -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${backupPath}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error creando backup:', error);
        
        // Registrar en auditoría
        Audit.log(
          req.user.username,
          'BACKUP_FAILED',
          'Sistema',
          `Error creando backup: ${error.message}`,
          null,
          null,
          req.ip,
          req.get('User-Agent')
        );

        return res.status(500).json({
          success: false,
          message: 'Error creando backup de la base de datos'
        });
      }

      // Registrar backup en la base de datos
      const fileStats = fs.statSync(backupPath);
      
      query(
        'INSERT INTO backups (nombre_archivo, ruta_archivo, tamano, tipo, usuario, estado) VALUES (?, ?, ?, ?, ?, ?)',
        [backupFileName, backupPath, fileStats.size, 'manual', req.user.username, 'completado']
      );

      // Registrar en auditoría
      Audit.log(
        req.user.username,
        'BACKUP_CREATED',
        'Sistema',
        `Backup creado: ${backupFileName}`,
        null,
        { fileName: backupFileName, size: fileStats.size },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Backup creado exitosamente',
        data: {
          fileName: backupFileName,
          size: fileStats.size,
          timestamp: new Date().toISOString()
        }
      });
    });

  } catch (error) {
    console.error('Error en proceso de backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error en proceso de backup'
    });
  }
});

// Obtener información del sistema
router.get('/info', authenticateToken, requireRole(['Administrador']), async (req, res) => {
  try {
    // Estadísticas de la base de datos
    const dbStats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios) as total_usuarios,
        (SELECT COUNT(*) FROM inventario) as total_materiales,
        (SELECT COUNT(*) FROM categorias) as total_categorias,
        (SELECT COUNT(*) FROM auditoria) as total_auditoria,
        (SELECT COUNT(*) FROM logs_sistema) as total_logs
    `);

    // Uso de espacio en tablas
    const tableSizes = await query(`
      SELECT 
        TABLE_NAME as tabla,
        TABLE_ROWS as filas,
        ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as tamaño_mb
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
    `, [process.env.DB_NAME]);

    res.json({
      success: true,
      data: {
        sistema: {
          nombre: 'Sistema de Gestión de Inventario',
          version: '1.0.0',
          entorno: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        },
        base_datos: dbStats[0],
        tablas: tableSizes
      }
    });

  } catch (error) {
    console.error('Error obteniendo información del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo información del sistema'
    });
  }
});

module.exports = router;