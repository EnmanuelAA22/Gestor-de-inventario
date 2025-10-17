// routes/usuarios.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const router = express.Router();

// Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const usuarios = await query(`
            SELECT id, username, email, rol, fechaCreacion 
            FROM usuarios 
            ORDER BY username
        `);
        
        res.json({
            success: true,
            data: usuarios
        });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo usuarios'
        });
    }
});

module.exports = router;