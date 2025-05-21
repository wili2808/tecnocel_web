import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import Categoria, { initCategoria } from '../models/Categoria.js';
import Producto, { initProducto } from '../models/Producto.js';
import Usuario, { initUsuario } from '../models/Usuario.js';
import Carrito, { initCarrito } from '../models/Carrito.js';
import Direccion, { initDireccion } from '../models/Direccion.js';
import Pedido, { initPedido } from '../models/Pedido.js';
import ItemCarrito, { initItemCarrito } from '../models/ItemCarrito.js';
import ItemPedido, { initItemPedido } from '../models/ItemPedido.js';

dotenv.config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Initialize models
initCategoria(sequelize);
initProducto(sequelize);
initUsuario(sequelize);
initCarrito(sequelize);
initDireccion(sequelize);
initPedido(sequelize);
await initItemCarrito(sequelize);
initItemPedido(sequelize);

const createInitialData = async () => {
  try {
    const categoriaCount = await Categoria.count();
    if (categoriaCount === 0) {
      console.log('Creando categorías y productos de ejemplo...');
      // Crear categorías de ejemplo
      const uniformeEscolar = await Categoria.create({ nombre: 'Uniformes Escolares', descripcion: 'Uniformes para diferentes escuelas' });
      const deportivo = await Categoria.create({ nombre: 'Deportivo', descripcion: 'Ropa deportiva' });
      const sublimacion = await Categoria.create({ nombre: 'Sublimacion', descripcion: 'Productos para sublimacion' });
      const bordado = await Categoria.create({ nombre: 'Bordado', descripcion: 'Productos para bordado' });

      // Crear productos de ejemplo
      await Producto.bulkCreate([
        { categoria_id: uniformeEscolar.id, nombre: 'Camisa Escolar', descripcion: 'Camisa blanca de uniforme', precio: 25, existencias: 100, es_personalizable: false },
        { categoria_id: uniformeEscolar.id, nombre: 'Pantalon Escolar', descripcion: 'Pantalon gris de uniforme', precio: 30, existencias: 50, es_personalizable: false },
        { categoria_id: deportivo.id, nombre: 'Camiseta Deportiva', descripcion: 'Camiseta deportiva de algodon', precio: 20, existencias: 75, es_personalizable: true },
        { categoria_id: sublimacion.id, nombre: 'Taza Sublimada', descripcion: 'Taza para sublimacion', precio: 10, existencias: 120, es_personalizable: true },
        { categoria_id: bordado.id, nombre: 'Gorra Bordada', descripcion: 'Gorra con logo bordado', precio: 15, existencias: 90, es_personalizable: true },
      ]);

      console.log('Categorías y productos de ejemplo creados correctamente.');
    } else {
      console.log('Ya existen categorías en la base de datos, omitiendo la creación de datos de ejemplo.');
    }
  } catch (error) {
    console.error('Error al crear datos de ejemplo:', error);
  }
};

export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    await sequelize.sync();
    console.log('Modelos sincronizados con la base de datos.');
    await createInitialData();
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    process.exit(1);
  }
};

export default sequelize;
