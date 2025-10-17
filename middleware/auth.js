const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario aún existe y está activo
    const usuario = await query(
      'SELECT id, username, email, nombre_completo, rol, permisos FROM usuarios WHERE id = ? AND activo = TRUE',
      [decoded.userId]
    );

    if (usuario.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    req.user = usuario[0];
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(403).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    let permisos = [];
    try {
      permisos = JSON.parse(req.user.permisos || '[]');
    } catch (e) {
      permisos = [];
    }

    if (!permisos.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes el permiso necesario para esta acción'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission
};