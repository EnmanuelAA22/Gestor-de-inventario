// routes/inventario.js
const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// Obtener todo el inventario
router.get('/', async (req, res) => {
    try {
        const materiales = await query(`
            SELECT * FROM materiales 
            ORDER BY fechaRegistro DESC
        `);
        
        res.json({
            success: true,
            data: materiales
        });
    } catch (error) {
        console.error('Error obteniendo inventario:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo inventario'
        });
    }
});

// Agregar nuevo material
router.post('/', async (req, res) => {
    try {
        const { codigo, nombre, descripcion, categoria, tipo, estado, ubicacion, cantidad, serial } = req.body;

        // Validaciones básicas
        if (!codigo || !nombre || !ubicacion) {
            return res.status(400).json({
                success: false,
                message: 'Código, nombre y ubicación son requeridos'
            });
        }

        // Para materiales serializados, verificar serial único
        if (tipo === 'serializado' && serial) {
            const existente = await query(
                'SELECT id FROM materiales WHERE serial = ?',
                [serial]
            );
            if (existente.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El número de serie ya existe'
                });
            }
        }

        const result = await query(
            `INSERT INTO materiales 
            (codigo, nombre, descripcion, categoria, tipo, estado, ubicacion, cantidad, serial) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [codigo, nombre, descripcion, categoria, tipo, estado, ubicacion, cantidad || null, serial || null]
        );

        res.json({
            success: true,
            message: 'Material agregado correctamente',
            data: { id: result.insertId }
        });

    } catch (error) {
        console.error('Error agregando material:', error);
        res.status(500).json({
            success: false,
            message: 'Error agregando material'
        });
    }
});

// Buscar materiales
router.get('/buscar', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.json({
                success: true,
                data: []
            });
        }

        const materiales = await query(`
            SELECT * FROM materiales 
            WHERE codigo LIKE ? OR nombre LIKE ? OR descripcion LIKE ? OR serial LIKE ?
            ORDER BY nombre
        `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);

        res.json({
            success: true,
            data: materiales
        });

    } catch (error) {
        console.error('Error buscando materiales:', error);
        res.status(500).json({
            success: false,
            message: 'Error buscando materiales'
        });
    }
});

module.exports = router;