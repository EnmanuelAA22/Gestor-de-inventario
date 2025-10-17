// check-users.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventario_db',
    port: process.env.DB_PORT || 3306
  };

  const connection = await mysql.createConnection(config);

  try {
    console.log('📊 Verificando usuarios en la base de datos...');
    
    const [users] = await connection.execute(
      'SELECT id, username, email, rol, activo FROM usuarios'
    );
    
    console.log('👥 Usuarios encontrados:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Rol: ${user.rol} - Activo: ${user.activo}`);
    });
    
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error verificando usuarios:', error);
  } finally {
    await connection.end();
  }
}

checkUsers();