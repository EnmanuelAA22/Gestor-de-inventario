// reset-all-passwords.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAllPasswords() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventario_db',
    port: process.env.DB_PORT || 3306
  };

  const connection = await mysql.createConnection(config);

  try {
    console.log('🔧 Reseteando contraseñas de todos los usuarios...');
    
    const password = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Actualizar contraseña para admin
    const [result1] = await connection.execute(
      'UPDATE usuarios SET password_hash = ? WHERE username = ?',
      [hashedPassword, 'admin']
    );
    
    // Actualizar contraseña para enmanuel
    const [result2] = await connection.execute(
      'UPDATE usuarios SET password_hash = ? WHERE username = ?',
      [hashedPassword, 'enmanuel']
    );
    
    console.log('✅ Contraseñas reseteadas exitosamente');
    console.log('👤 Usuarios actualizados:');
    console.log('   - admin (admin@sistema.com)');
    console.log('   - enmanuel (enmanuel@empresa.com)');
    console.log('🔑 Contraseña para ambos: admin123');
    
  } catch (error) {
    console.error('❌ Error resetando contraseñas:', error);
  } finally {
    await connection.end();
  }
}

resetAllPasswords();