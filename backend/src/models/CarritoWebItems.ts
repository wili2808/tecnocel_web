import { Model, DataTypes, Association } from 'sequelize';
import sequelize from '../config/database.js';

// Importaciones para tipos de asociaciones
import type CarritoWeb from './CarritoWeb.js';
import type Almacen from './Almacen.js';

class CarritoWebItems extends Model {
  declare id_item: number;
  declare id_carrito: number;
  declare id_producto: number;
  declare cantidad: number;
  declare precio_unitario: number;
  declare subtotal: number;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;

  // Asociaciones
  declare carrito?: CarritoWeb;
  declare producto?: Almacen;

  // Definir asociaciones estáticas
  declare static associations: {
    carrito: Association<CarritoWebItems, CarritoWeb>;
    producto: Association<CarritoWebItems, Almacen>;
  };

  // Método para calcular el subtotal basado en cantidad y precio
  calcularSubtotal(): number {
    return this.cantidad * this.precio_unitario;
  }

  // Método para actualizar el subtotal
  async actualizarSubtotal(): Promise<void> {
    const nuevoSubtotal = this.calcularSubtotal();
    await this.update({ 
      subtotal: nuevoSubtotal,
      fyh_actualizacion: new Date()
    });
  }
}

CarritoWebItems.init({
  id_item: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_carrito: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_carritosweb',
      key: 'id_carrito'
    }
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_almacen',
      key: 'id_producto'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fyh_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'CarritoWebItems',
  tableName: 'tb_carritoweb_items',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_carrito', 'id_producto']
    }
  ]
});

export default CarritoWebItems;
