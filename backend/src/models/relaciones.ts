import Almacen from './Almacen.js';
import Carrito from './Carrito.js';
import CarritoWeb from './CarritoWeb.js';
import CarritoWebItems from './CarritoWebItems.js';
import Categoria from './Categoria.js';
import Cliente from './Cliente.js';
import Comentario from './Comentario.js';
import ComentarioImagen from './ComentarioImagen.js';
import Compra from './Compra.js';
import DetalleCompra from './DetalleCompra.js';
import DetalleDevolucion from './DetalleDevolucion.js';
import Devolucion from './Devolucion.js';
import Presupuesto from './Presupuesto.js';
import PresupuestoDetalle from './PresupuestoDetalle.js';
import Proveedor from './Proveedor.js';
import Rol from './Rol.js';
import Usuario from './Usuario.js';
import Venta from './Venta.js';

// Almacen
Almacen.belongsTo(Categoria, { foreignKey: 'id_categoria' });
Categoria.hasMany(Almacen, { foreignKey: 'id_categoria' });
Almacen.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Usuario.hasMany(Almacen, { foreignKey: 'id_usuario' });

// Carrito (tabla antigua)
Carrito.belongsTo(Almacen, { foreignKey: 'id_producto' });
Almacen.hasMany(Carrito, { foreignKey: 'id_producto' });
Carrito.belongsTo(Venta, { foreignKey: 'nro_venta', targetKey: 'nro_venta' });
Venta.hasMany(Carrito, { foreignKey: 'nro_venta', sourceKey: 'nro_venta' });

// CarritoWeb (nueva implementación)
CarritoWeb.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
Cliente.hasMany(CarritoWeb, { foreignKey: 'id_cliente', as: 'carritos' });

// CarritoWebItems
CarritoWebItems.belongsTo(CarritoWeb, { foreignKey: 'id_carrito', as: 'carrito' });
CarritoWeb.hasMany(CarritoWebItems, { foreignKey: 'id_carrito', as: 'items' });

CarritoWebItems.belongsTo(Almacen, { foreignKey: 'id_producto', as: 'producto' });
Almacen.hasMany(CarritoWebItems, { foreignKey: 'id_producto', as: 'carritoItems' });

// Venta con CarritoWeb
Venta.belongsTo(CarritoWeb, { foreignKey: 'id_carrito', as: 'carrito' });
CarritoWeb.hasOne(Venta, { foreignKey: 'id_carrito', as: 'venta' });

// Compra y DetalleCompra
Compra.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Usuario.hasMany(Compra, { foreignKey: 'id_usuario' });
Compra.belongsTo(Proveedor, { foreignKey: 'id_proveedor' });
Proveedor.hasMany(Compra, { foreignKey: 'id_proveedor' });
DetalleCompra.belongsTo(Compra, { foreignKey: 'nro_compra', targetKey: 'nro_compra' });
Compra.hasMany(DetalleCompra, { foreignKey: 'nro_compra', sourceKey: 'nro_compra' });
DetalleCompra.belongsTo(Almacen, { foreignKey: 'id_producto' });
Almacen.hasMany(DetalleCompra, { foreignKey: 'id_producto' });

// DetalleDevolucion y Devolucion
DetalleDevolucion.belongsTo(Almacen, { foreignKey: 'id_producto' });
Almacen.hasMany(DetalleDevolucion, { foreignKey: 'id_producto' });
DetalleDevolucion.belongsTo(Devolucion, { foreignKey: 'id_devolucion' });
Devolucion.hasMany(DetalleDevolucion, { foreignKey: 'id_devolucion' });
Devolucion.belongsTo(Cliente, { foreignKey: 'id_cliente' });
Cliente.hasMany(Devolucion, { foreignKey: 'id_cliente' });

// Presupuesto y PresupuestoDetalle
Presupuesto.belongsTo(Cliente, { foreignKey: 'id_cliente' });
Cliente.hasMany(Presupuesto, { foreignKey: 'id_cliente' });
PresupuestoDetalle.belongsTo(Presupuesto, { foreignKey: 'nro_presupuesto', targetKey: 'nro_presupuesto' });
Presupuesto.hasMany(PresupuestoDetalle, { foreignKey: 'nro_presupuesto', sourceKey: 'nro_presupuesto' });
PresupuestoDetalle.belongsTo(Almacen, { foreignKey: 'id_producto' });
Almacen.hasMany(PresupuestoDetalle, { foreignKey: 'id_producto' });

// Usuario y Rol
Usuario.belongsTo(Rol, { foreignKey: 'id_rol' });
Rol.hasMany(Usuario, { foreignKey: 'id_rol' });

// Venta
Venta.belongsTo(Cliente, { foreignKey: 'id_cliente' });
Cliente.hasMany(Venta, { foreignKey: 'id_cliente' });
// Carrito y Venta ya definidos arriba

// Comentarios de productos
Comentario.belongsTo(Almacen, { foreignKey: 'id_producto', as: 'producto' });
Almacen.hasMany(Comentario, { foreignKey: 'id_producto', as: 'comentarios' });

Comentario.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
Cliente.hasMany(Comentario, { foreignKey: 'id_cliente', as: 'comentarios' });

Comentario.belongsTo(Usuario, { foreignKey: 'id_admin_respuesta', as: 'adminRespuesta' });
Usuario.hasMany(Comentario, { foreignKey: 'id_admin_respuesta', as: 'respuestasAdmin' });

// Imágenes de comentarios
ComentarioImagen.belongsTo(Comentario, { foreignKey: 'id_comentario', as: 'comentario' });
Comentario.hasMany(ComentarioImagen, { foreignKey: 'id_comentario', as: 'imagenes' });

// Exportar todos los modelos (opcional, útil para inicialización)
export {
  Almacen,
  Carrito,
  CarritoWeb,
  CarritoWebItems,
  Categoria,
  Cliente,
  Comentario,
  ComentarioImagen,
  Compra,
  DetalleCompra,
  DetalleDevolucion,
  Devolucion,
  Presupuesto,
  PresupuestoDetalle,
  Proveedor,
  Rol,
  Usuario,
  Venta
}; 