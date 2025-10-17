// test-connection.js
require('dotenv').config();
const { testConnection, query } = require('./config/database');

async function testDatabaseConnection() {
    console.log('🧪 Probando conexión a la base de datos...');
    
    // Test de conexión básica
    const isConnected = await testConnection();
    
    if (isConnected) {
        console.log('✅ Conexión a MySQL establecida correctamente');
        
        // Test de consultas
        try {
            console.log('\n📊 Probando consultas a la base de datos...');
            
            // Test 1: Obtener todas las tablas
            const tables = await query('SHOW TABLES');
            console.log('✅ Tablas en la base de datos:');
            tables.forEach(table => {
                console.log(`   - ${table.Tables_in_inventario_db}`);
            });
            
            // Test 2: Contar usuarios
            const users = await query('SELECT COUNT(*) as total FROM usuarios');
            console.log(`✅ Total de usuarios: ${users[0].total}`);
            
            // Test 3: Contar categorías
            const categories = await query('SELECT COUNT(*) as total FROM categorias');
            console.log(`✅ Total de categorías: ${categories[0].total}`);
            
            // Test 4: Obtener usuario admin
            const adminUser = await query('SELECT username, email, rol FROM usuarios WHERE username = ?', ['admin']);
            if (adminUser.length > 0) {
                console.log('✅ Usuario administrador encontrado:');
                console.log(`   - Usuario: ${adminUser[0].username}`);
                console.log(`   - Email: ${adminUser[0].email}`);
                console.log(`   - Rol: ${adminUser[0].rol}`);
            }
            
            console.log('\n🎉 ¡Todas las pruebas pasaron correctamente!');
            console.log('🚀 Puedes iniciar el servidor principal');
            
        } catch (error) {
            console.error('❌ Error en las consultas de prueba:', error.message);
        }
        
    } else {
        console.error('❌ No se pudo conectar a la base de datos');
        console.log('📋 Verifica:');
        console.log('   - Que MySQL esté ejecutándose');
        console.log('   - Las credenciales en el archivo .env');
        console.log('   - Que la base de datos "inventario_db" exista');
    }
}

testDatabaseConnection();