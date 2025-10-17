// migrate-db.js - Script de migración MySQL → Firestore
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

// Inicializar Firebase Admin
const serviceAccount = require('./service-account-key.json'); // Descargar desde Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateDatabase() {
  console.log('🚀 Iniciando migración a Firestore...');

  try {
    // ==================== MIGRAR USUARIOS ====================
    console.log('📋 Migrando usuarios...');
    
    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.collection('users').doc('admin').set({
      username: 'admin',
      email: 'admin@empresa.com',
      password: adminPassword,
      rol: 'Administrador',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true
    });

    await db.collection('users').doc('usuario1').set({
      username: 'usuario',
      email: 'usuario@empresa.com', 
      password: await bcrypt.hash('usuario123', 10),
      rol: 'Almacén',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true
    });

    // ==================== MIGRAR INVENTARIO ====================
    console.log('📦 Migrando inventario...');

    const inventarioEjemplo = [
      {
        codigo: 'LAP-001',
        nombre: 'Laptop Dell Latitude',
        descripcion: 'Laptop para desarrollo con 16GB RAM, 512GB SSD',
        categoria: 'electronica',
        tipo: 'serializado',
        serial: 'SN-DELL-001',
        estado: 'disponible',
        ubicacion: 'Almacén A - Estante 1',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'system'
      },
      {
        codigo: 'MON-001', 
        nombre: 'Monitor 24" Samsung',
        descripcion: 'Monitor LED Full HD 1080p para estaciones de trabajo',
        categoria: 'electronica',
        tipo: 'cantidad',
        cantidad: 5,
        estado: 'disponible', 
        ubicacion: 'Almacén B',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'system'
      },
      {
        codigo: 'TEC-001',
        nombre: 'Teclado Mecánico',
        descripcion: 'Teclado mecánico RGB para programación',
        categoria: 'electronica', 
        tipo: 'cantidad',
        cantidad: 10,
        estado: 'disponible',
        ubicacion: 'Almacén C - Cajón 2',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'system'
      },
      {
        codigo: 'SER-001',
        nombre: 'Servidor HP',
        descripcion: 'Servidor para base de datos y aplicaciones',
        categoria: 'equipos',
        tipo: 'serializado',
        serial: 'SN-HP-SRV-001',
        estado: 'mantenimiento',
        ubicacion: 'Sala de Servidores',
        createdAt: admin.firestore.FieldValue.serverTimestamp(), 
        createdBy: 'system'
      }
    ];

    for (const item of inventarioEjemplo) {
      await db.collection('inventory').add(item);
    }

    // ==================== MIGRAR AUDITORÍA ====================
    console.log('📊 Migrando logs de auditoría...');

    const auditoriaEjemplo = [
      {
        usuario: 'admin',
        accion: 'login',
        modulo: 'auth',
        descripcion: 'Inicio de sesión exitoso',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ip: '192.168.1.100'
      },
      {
        usuario: 'admin',
        accion: 'crear',
        modulo: 'inventario', 
        descripcion: 'Material creado: Laptop Dell Latitude',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        usuario: 'admin',
        accion: 'crear',
        modulo: 'inventario',
        descripcion: 'Material creado: Monitor 24" Samsung', 
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    for (const log of auditoriaEjemplo) {
      await db.collection('audit').add(log);
    }

    console.log('✅ Migración completada exitosamente!');
    console.log('\n📝 Credenciales de acceso:');
    console.log('   👤 Admin: usuario: admin, contraseña: admin123');
    console.log('   👤 Usuario: usuario: usuario, contraseña: usuario123');
    console.log('\n🎯 Datos migrados:');
    console.log('   👥 2 usuarios');
    console.log('   📦 4 items de inventario'); 
    console.log('   📊 3 logs de auditoría');

  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    process.exit();
  }
}

migrateDatabase();