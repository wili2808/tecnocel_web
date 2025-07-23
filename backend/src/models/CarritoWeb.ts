import { Model, DataTypes, Association } from 'sequelize';
import sequelize from '../config/database.js';

// Importaciones para tipos de asociaciones
import type Cliente from './Cliente.js';
import type CarritoWebItems from './CarritoWebItems.js';
import type Venta from './Venta.js';

class CarritoWeb extends Model {
  declare id_carrito: number;
  declare id_cliente: number;
  declare estado: 'activo' | 'completado' | 'abandonado';
  declare total_carrito: number;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
  declare fyh_abandono: Date | null;

  // Asociaciones
  declare cliente?: Cliente;
  declare items?: CarritoWebItems[];
  declare venta?: Venta;

  // Definir asociaciones estáticas
  declare static associations: {
    cliente: Association<CarritoWeb, Cliente>;
    items: Association<CarritoWeb, CarritoWebItems>;
    venta: Association<CarritoWeb, Venta>;
  };

  // Método para calcular el total del carrito
  async calcularTotal(): Promise<number> {
    const CarritoWebItems = await import('./CarritoWebItems.js');
    const items = await CarritoWebItems.default.findAll({
      where: { id_carrito: this.id_carrito }
    });
    
    const total = items.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal.toString()), 0);
    return total;
  }

  // Método para obtener la cantidad de items
  async contarItems(): Promise<number> {
    const CarritoWebItems = await import('./CarritoWebItems.js');
    const count = await CarritoWebItems.default.count({
      where: { id_carrito: this.id_carrito }
    });
    return count;
  }
}

CarritoWeb.init({
  id_carrito: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_clientes',
      key: 'id_cliente'
    }
  },
  estado: {
    type: DataTypes.ENUM('activo', 'completado', 'abandonado'),
    allowNull: false,
    defaultValue: 'activo'
  },
  total_carrito: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fyh_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fyh_abandono: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'CarritoWeb',
  tableName: 'tb_carritosweb',
  timestamps: false
});

export default CarritoWeb;
