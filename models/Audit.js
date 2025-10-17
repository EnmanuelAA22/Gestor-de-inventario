const { query } = require('../config/database');

class Audit {
  // Registrar acción de auditoría
  static async log(usuario, accion, modulo, descripcion = '', datos_antes = null, datos_despues = null, ip_address = null, user_agent = null) {
    await query(
      `INSERT INTO auditoria (usuario, accion, modulo, descripcion, datos_antes, datos_despues, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario, accion, modulo, descripcion, 
       datos_antes ? JSON.stringify(datos_antes) : null,
       datos_despues ? JSON.stringify(datos_despues) : null,
       ip_address, user_agent]
    );
  }

  // Obtener registros de auditoría
  static async getLogs(limite = 50, pagina = 1) {
    const offset = (pagina - 1) * limite;
    
    const logs = await query(
      `SELECT * FROM auditoria 
       ORDER BY fecha DESC 
       LIMIT ? OFFSET ?`,
      [limite, offset]
    );

    const total = await query('SELECT COUNT(*) as count FROM auditoria');
    
    return {
      logs,
      paginacion: {
        pagina,
        limite,
        total: total[0].count,
        totalPaginas: Math.ceil(total[0].count / limite)
      }
    };
  }

  // Buscar en auditoría
  static async search(termino, limite = 50) {
    return await query(
      `SELECT * FROM auditoria 
       WHERE usuario LIKE ? OR accion LIKE ? OR modulo LIKE ? OR descripcion LIKE ?
       ORDER BY fecha DESC 
       LIMIT ?`,
      [`%${termino}%`, `%${termino}%`, `%${termino}%`, `%${termino}%`, limite]
    );
  }
}

// Función helper para logging rápido
const logAuditoria = (usuario, accion, modulo, extras = {}) => {
  Audit.log(
    usuario,
    accion,
    modulo,
    extras.descripcion,
    extras.datos_antes,
    extras.datos_despues,
    extras.ip,
    extras.userAgent
  ).catch(console.error);
};

module.exports = { Audit, logAuditoria };