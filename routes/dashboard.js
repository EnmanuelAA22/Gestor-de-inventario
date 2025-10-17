// routes/dashboard.js
const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// Obtener estadísticas del dashboard
router.get('/estadisticas', async (req, res) => {
    try {
        // Total de materiales
        const totalResult = await query('SELECT COUNT(*) as total FROM materiales');
        const total = totalResult[0].total;

        // Materiales disponibles
        const disponiblesResult = await query(
            'SELECT COUNT(*) as total FROM materiales WHERE estado = "disponible"'
        );
        const disponibles = disponiblesResult[0].total;

        // Materiales en mantenimiento
        const mantenimientoResult = await query(
            'SELECT COUNT(*) as total FROM materiales WHERE estado = "mantenimiento"'
        );
        const mantenimiento = mantenimientoResult[0].total;

        // Materiales serializados
        const serializadosResult = await query(
            'SELECT COUNT(*) as total FROM materiales WHERE tipo = "serializado"'
        );
        const serializados = serializadosResult[0].total;

        // Materiales por categoría
        const categoriasResult = await query(`
            SELECT categoria, COUNT(*) as cantidad 
            FROM materiales 
            GROUP BY categoria
        `);

        const categorias = {};
        categoriasResult.forEach(row => {
            categorias[row.categoria] = row.cantidad;
        });

        // Materiales por estado
        const estadosResult = await query(`
            SELECT estado, COUNT(*) as cantidad 
            FROM materiales 
            GROUP BY estado
        `);

        const estados = {
            disponible: 0,
            enUso: 0,
            mantenimiento: 0,
            baja: 0
        };

        estadosResult.forEach(row => {
            if (row.estado in estados) {
                estados[row.estado] = row.cantidad;
            }
        });

        res.json({
            success: true,
            data: {
                total,
                disponibles,
                mantenimiento,
                serializados,
                categorias,
                estados
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas'
        });
    }
});

// Obtener items recientes
router.get('/recientes', async (req, res) => {
    try {
        const { limite = 10 } = req.query;

        const materiales = await query(`
            SELECT * FROM materiales 
            ORDER BY fechaRegistro DESC 
            LIMIT ?
        `, [parseInt(limite)]);

        res.json({
            success: true,
            data: materiales
        });

    } catch (error) {
        console.error('Error obteniendo items recientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo items recientes'
        });
    }
});

module.exports = router;