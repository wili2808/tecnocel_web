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

  // ✅ NUEVOS CAMPOS (Fase 1 - Revalidación de Precios)
  // Snapshot histórico de precios al momento de agregar al carrito
  declare precio_base_original: number;
  declare precio_con_oferta_original: number | null;
  declare descuento_porcentaje_original: number | null;
  declare id_oferta_aplicada: number | null;
  declare precio_es_manual: boolean;
  declare fyh_precio_validado: Date;
  declare precio_ha_cambiado: boolean;

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
  // ✅ NUEVOS CAMPOS (Fase 1 - Revalidación de Precios)
  // Snapshot histórico de precios al momento de agregar al carrito
  precio_base_original: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    },
    comment: 'Precio de catalogo SIN descuento al momento de agregar al carrito'
  },
  precio_con_oferta_original: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Precio CON oferta aplicada al momento de agregar (NULL si no habia oferta)'
  },
  descuento_porcentaje_original: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Porcentaje de descuento que se aplico originalmente'
  },
  id_oferta_aplicada: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tb_ofertas',
      key: 'id_oferta'
    },
    comment: 'FK a la oferta que se uso (NULL si no hubo oferta)'
  },
  precio_es_manual: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'TRUE si fue un precio personalizado manualmente'
  },
  fyh_precio_validado: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Ultima vez que se valido/verifico el precio contra el catalogo actual'
  },
  precio_ha_cambiado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'TRUE si el precio actual del producto difiere del original'
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
