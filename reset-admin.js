// reset-admin.js
require('dotenv').config();
const { query } = require('./config/database');
const bcrypt = require('bcryptjs');

async function resetAdminUser() {
    try {
        console.log('🔄 Reseteando usuario administrador...');
        
        // Generar nuevo hash para admin123
        const newHash = await bcrypt.hash('admin123', 10);
        
        // Actualizar usuario admin
        const result = await query(
            'UPDATE usuarios SET password_hash = ? WHERE username = ?',
            [newHash, 'admin']
        );
        
        if (result.affectedRows > 0) {
            console.log('✅ Usuario admin actualizado correctamente');
            console.log('🔐 Nuevas credenciales:');
            console.log('   Usuario: admin');
            console.log('   Contraseña: admin123');
        } else {
            // Si no existe, crearlo
            await query(
                `INSERT INTO usuarios (username, email, password_hash, nombre_completo, rol, permisos) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    'admin',
                    'admin@sistema.com',
                    newHash,
                    'Administrador del Sistema',
                    'Administrador',
                    JSON.stringify(['dashboard', 'inventario', 'panel_control', 'usuarios', 'configuracion', 'reportes'])
                ]
            );
            console.log('✅ Usuario admin creado correctamente');
        }
        
        console.log('🎉 ¡Ahora prueba con admin/admin123!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

resetAdminUser();