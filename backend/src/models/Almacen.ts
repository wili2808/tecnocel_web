import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Almacen extends Model {
  declare id_producto: number;
  declare codigo: string;
  declare nombre: string;
  declare descripcion: string | null;
  declare stock: number;
  declare stock_minimo: number | null;
  declare stock_maximo: number | null;
  declare precio_compra: string;
  declare precio_venta: string;
  declare fecha_ingreso: Date;
  declare id_usuario: number;
  declare id_categoria: number;
  declare modelo: string | null;
  declare id_marca: number | null;
  declare es_destacado: boolean;
  declare orden_destacado: number;
  declare activo: boolean;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
  
  // Declarar asociaciones
  declare imagenes?: any[];
  declare ofertas?: any[];
  declare caracteristicas?: any[];
}

Almacen.init({
  id_producto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stock_minimo: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  stock_maximo: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  precio_compra: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  precio_venta: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fecha_ingreso: {
    type: DataTypes.DATE,
    allowNull: false
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_usuarios',
      key: 'id_usuario'
    }
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_categorias',
      key: 'id_categoria'
    }
  },
  modelo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  id_marca: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tb_marcas',
      key: 'id_marca'
    }
  },
  es_destacado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  orden_destacado: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
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
  modelName: 'Almacen',
  tableName: 'tb_almacen',
  timestamps: false
});

export default Almacen; 