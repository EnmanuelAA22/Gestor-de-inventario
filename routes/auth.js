// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const router = express.Router();

// Login de usuario
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('🔐 Intento de login para:', username);

        // Validar campos
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        // Buscar usuario en la base de datos
        const usuarios = await query(
            'SELECT * FROM usuarios WHERE username = ?', 
            [username]
        );

        if (usuarios.length === 0) {
            console.log('❌ Usuario no encontrado:', username);
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        const usuario = usuarios[0];

        // Verificar contraseña
        const passwordValido = await bcrypt.compare(password, usuario.password);
        
        if (!passwordValido) {
            console.log('❌ Contraseña incorrecta para:', username);
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // Crear token JWT
        const token = jwt.sign(
            { 
                id: usuario.id, 
                username: usuario.username,
                rol: usuario.rol 
            },
            process.env.JWT_SECRET || 'secreto_por_defecto_cambiar_en_produccion',
            { expiresIn: '2h' }
        );

        console.log('✅ Login exitoso para:', username);

        // Responder con datos del usuario y token
        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                usuario: {
                    id: usuario.id,
                    username: usuario.username,
                    email: usuario.email,
                    rol: usuario.rol,
                    permisos: obtenerPermisosPorRol(usuario.rol)
                },
                sessionId: Date.now().toString()
            }
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Verificar token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                valid: false,
                message: 'Token no proporcionado'
            });
        }

        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'secreto_por_defecto_cambiar_en_produccion'
        );

        // Verificar que el usuario aún existe
        const usuarios = await query(
            'SELECT id, username, rol FROM usuarios WHERE id = ?', 
            [decoded.id]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                valid: false,
                message: 'Usuario no existe'
            });
        }

        res.json({
            success: true,
            valid: true,
            usuario: {
                ...decoded,
                permisos: obtenerPermisosPorRol(decoded.rol)
            }
        });

    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(401).json({
            success: false,
            valid: false,
            message: 'Token inválido'
        });
    }
});

// Función auxiliar para obtener permisos por rol
function obtenerPermisosPorRol(rol) {
    const permisos = {
        'Administrador': ['dashboard', 'inventario', 'panel_control', 'usuarios', 'configuracion', 'reportes'],
        'Almacén': ['dashboard', 'inventario'],
        'Consulta': ['dashboard']
    };
    return permisos[rol] || ['dashboard'];
}

module.exports = router;