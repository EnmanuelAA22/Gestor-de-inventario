const express = require('express');
const { Audit } = require('../models/Audit');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Obtener registros de auditoría
router.get('/', authenticateToken, requirePermission('panel_control'), async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 50;
    const pagina = parseInt(req.query.pagina) || 1;

    const auditoria = await Audit.getLogs(limite, pagina);

    res.json({
      success: true,
      data: auditoria.logs,
      paginacion: auditoria.paginacion
    });

  } catch (error) {
    console.error('Error obteniendo auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo auditoría'
    });
  }
});

// Buscar en auditoría
router.get('/buscar', authenticateToken, requirePermission('panel_control'), async (req, res) => {
  try {
    const { q } = req.query;
    const limite = parseInt(req.query.limite) || 50;

    if (!q) {
      return res.json({
        success: true,
        data: [],
        message: 'Ingrese un término de búsqueda'
      });
    }

    const resultados = await Audit.search(q, limite);

    res.json({
      success: true,
      data: resultados,
      total: resultados.length
    });

  } catch (error) {
    console.error('Error buscando en auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda'
    });
  }
});

module.exports = router;