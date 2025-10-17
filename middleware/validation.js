const { body, validationResult } = require('express-validator');

// Validaciones para login
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3 })
    .withMessage('El usuario debe tener al menos 3 caracteres'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Validaciones para inventario
const validateInventory = [
  body('codigo')
    .notEmpty()
    .withMessage('El código es requerido')
    .isLength({ max: 50 })
    .withMessage('El código no puede exceder 50 caracteres'),
  
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ max: 255 })
    .withMessage('El nombre no puede exceder 255 caracteres'),
  
  body('tipo')
    .isIn(['cantidad', 'serializado'])
    .withMessage('El tipo debe ser "cantidad" o "serializado"'),
  
  body('estado')
    .optional()
    .isIn(['disponible', 'en-uso', 'mantenimiento', 'baja'])
    .withMessage('Estado inválido'),
  
  body('ubicacion')
    .notEmpty()
    .withMessage('La ubicación es requerida')
];

// Validaciones para usuarios
const validateUser = [
  body('username')
    .notEmpty()
    .withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('El usuario debe tener entre 3 y 50 caracteres'),
  
  body('email')
    .isEmail()
    .withMessage('El email debe ser válido')
    .normalizeEmail(),
  
  body('nombre_completo')
    .notEmpty()
    .withMessage('El nombre completo es requerido')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder 100 caracteres'),
  
  body('rol')
    .isIn(['Administrador', 'Almacén', 'Consulta'])
    .withMessage('Rol inválido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateLogin,
  validateInventory,
  validateUser,
  handleValidationErrors
};