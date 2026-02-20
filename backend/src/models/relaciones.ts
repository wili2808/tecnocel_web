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
import VentaItem from './VentaItem.js';
import Cancelacion from './Cancelacion.js';
import Envio from './Envio.js';
import './Configuracion.js';
// Nuevos modelos
import Marca from './Marca.js';
import TipoCaracteristica from './TipoCaracteristica.js';
import ProductoCaracteristica from './ProductoCaracteristica.js';
import Oferta from './Oferta.js';
import ProductoOferta from './ProductoOferta.js';
import Favorito from './Favorito.js';
import Direccion from './Direccion.js';
import ProductoImagen from './ProductoImagen.js';

// Almacen
Almacen.belongsTo(Categoria, { foreignKey: 'id_categoria', as: 'Categoria' });
Categoria.hasMany(Almacen, { foreignKey: 'id_categoria', as: 'productos' });
Almacen.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Usuario.hasMany(Almacen, { foreignKey: 'id_usuario' });

// Nuevas relaciones para Marcas
Almacen.belongsTo(Marca, { foreignKey: 'id_marca', as: 'marca' });
Marca.hasMany(Almacen, { foreignKey: 'id_marca', as: 'productos' });

// Carrito (tabla antigua - legacy, no se usa para nuevas ventas)
Carrito.belongsTo(Almacen, { foreignKey: 'id_producto' });
Almacen.hasMany(Carrito, { foreignKey: 'id_producto' });
Carrito.belongsTo(Venta, { foreignKey: 'nro_venta', targetKey: 'nro_venta' });
Venta.hasMany(Carrito, { foreignKey: 'nro_venta', sourceKey: 'nro_venta' });

// CarritoWeb (nueva implementación - flujo web del cliente)
CarritoWeb.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
Cliente.hasMany(CarritoWeb, { foreignKey: 'id_cliente', as: 'carritos' });

// CarritoWebItems
CarritoWebItems.belongsTo(CarritoWeb, { foreignKey: 'id_carrito', as: 'carrito' });
CarritoWeb.hasMany(CarritoWebItems, { foreignKey: 'id_carrito', as: 'items' });

CarritoWebItems.belongsTo(Almacen, { foreignKey: 'id_producto', as: 'producto' });
Almacen.hasMany(CarritoWebItems, { foreignKey: 'id_producto', as: 'carritoItems' });

// Venta → CarritoWeb (referencia histórica del proceso de compra web)
Venta.belongsTo(CarritoWeb, { foreignKey: 'id_carrito_web', as: 'carritoWeb' });
CarritoWeb.hasOne(Venta, { foreignKey: 'id_carrito_web', as: 'venta' });

// VentaItem - detalle universal de ventas (web y manual)
Venta.hasMany(VentaItem, { foreignKey: 'id_venta', as: 'items' });
VentaItem.belongsTo(Venta, { foreignKey: 'id_venta', as: 'venta' });

VentaItem.belongsTo(Almacen, { foreignKey: 'id_producto', as: 'producto' });
Almacen.hasMany(VentaItem, { foreignKey: 'id_producto', as: 'ventaItems' });

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

// Venta → Vendedor (usuario del sistema que registró la venta manual)
Venta.belongsTo(Usuario, { foreignKey: 'id_vendedor', as: 'vendedor' });
Usuario.hasMany(Venta, { foreignKey: 'id_vendedor', as: 'ventasRegistradas' });
// Carrito y Venta ya definidos arriba

// Cancelacion (auditoría de cancelaciones)
Venta.hasOne(Cancelacion, { foreignKey: 'id_venta', as: 'cancelacion' });
Cancelacion.belongsTo(Venta, { foreignKey: 'id_venta' });
Cancelacion.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario_cancelacion' });
Usuario.hasMany(Cancelacion, { foreignKey: 'id_usuario', as: 'cancelaciones' });

// Envio (logística de despacho — one-to-one con Venta)
Venta.hasOne(Envio, { foreignKey: 'id_venta', as: 'envio' });
Envio.belongsTo(Venta, { foreignKey: 'id_venta', as: 'venta' });

Envio.belongsTo(Direccion, { foreignKey: 'id_direccion', as: 'direccion_envio' });
Direccion.hasMany(Envio, { foreignKey: 'id_direccion', as: 'envios' });

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

// Relaciones para Características de Productos
Almacen.belongsToMany(TipoCaracteristica, {
  through: ProductoCaracteristica,
  foreignKey: 'id_producto',
  otherKey: 'id_tipo',
  as: 'caracteristicas'
});

TipoCaracteristica.belongsToMany(Almacen, {
  through: ProductoCaracteristica,
  foreignKey: 'id_tipo',
  otherKey: 'id_producto',
  as: 'productos'
});

ProductoCaracteristica.belongsTo(Almacen, { foreignKey: 'id_producto', as: 'producto' });
ProductoCaracteristica.belongsTo(TipoCaracteristica, { foreignKey: 'id_tipo', as: 'tipo' });

// Relación hasMany de Almacen hacia ProductoCaracteristica para incluir características individuales
Almacen.hasMany(ProductoCaracteristica, { foreignKey: 'id_producto', as: 'productosCaracteristicas' });

// Relaciones para Ofertas
Almacen.belongsToMany(Oferta, {
  through: ProductoOferta,
  foreignKey: 'id_producto',
  otherKey: 'id_oferta',
  as: 'ofertas'
});

Oferta.belongsToMany(Almacen, {
  through: ProductoOferta,
  foreignKey: 'id_oferta',
  otherKey: 'id_producto',
  as: 'productos'
});

ProductoOferta.belongsTo(Almacen, { foreignKey: 'id_producto', as: 'producto' });
ProductoOferta.belongsTo(Oferta, { foreignKey: 'id_oferta', as: 'oferta' });

// Relaciones para Favoritos
Cliente.belongsToMany(Almacen, {
  through: Favorito,
  foreignKey: 'id_cliente',
  otherKey: 'id_producto',
  as: 'favoritos'
});

Almacen.belongsToMany(Cliente, {
  through: Favorito,
  foreignKey: 'id_producto',
  otherKey: 'id_cliente',
  as: 'clientesFavoritos'
});

Favorito.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
Favorito.belongsTo(Almacen, { foreignKey: 'id_producto', as: 'producto' });

// Relaciones para Direcciones
Cliente.hasMany(Direccion, { foreignKey: 'id_cliente', as: 'direcciones' });
Direccion.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });

// Relaciones para Imágenes de Productos
Almacen.hasMany(ProductoImagen, { foreignKey: 'id_producto', as: 'imagenes' });
ProductoImagen.belongsTo(Almacen, { foreignKey: 'id_producto', as: 'producto' });

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
  Venta,
  VentaItem,
  Cancelacion,
  Envio,
  // Nuevos modelos
  Marca,
  TipoCaracteristica,
  ProductoCaracteristica,
  Oferta,
  ProductoOferta,
  Favorito,
  Direccion,
  ProductoImagen
}; 