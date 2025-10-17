const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const initDatabase = async () => {
  // Configuración sin base de datos específica
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  };

  const connection = mysql.createConnection(config);

  try {
    // Leer archivo SQL
    const sqlFile = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
    
    // Ejecutar script SQL
    connection.query(sqlFile, (error, results) => {
      if (error) {
        console.error('❌ Error inicializando base de datos:', error);
        process.exit(1);
      }
      
      console.log('✅ Base de datos inicializada correctamente');
      console.log('📊 Tablas creadas: usuarios, categorias, inventario, auditoria, logs_sistema, backups');
      console.log('👤 Usuario administrador creado: admin / admin123');
      connection.end();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error leyendo archivo SQL:', error);
    connection.end();
    process.exit(1);
  }
};

initDatabase();