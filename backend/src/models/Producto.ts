import { Model, DataTypes, Optional } from 'sequelize';
import Categoria from './Categoria.js';

interface ProductoAttributes {
  id: number;
  categoria_id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  existencias: number;
  imagen_url?: string;
  es_personalizable: boolean;
  opciones_personalizacion?: any;
  creado_en: Date;
  actualizado_en: Date;
}

// Algunos atributos son opcionales cuando se crea una instancia del modelo
interface ProductoCreationAttributes extends Optional<ProductoAttributes, 'id' | 'creado_en' | 'actualizado_en'> {}

class Producto extends Model<ProductoAttributes, ProductoCreationAttributes> {
  // Las propiedades de instancia se definen aquí para la tipificación
  public id!: number;
  public categoria_id?: number;
  public nombre!: string;
  public descripcion?: string;
  public precio!: number;
  public existencias!: number;
  public imagen_url?: string;
  public es_personalizable!: boolean;
  public opciones_personalizacion?: any;
  public creado_en!: Date;
  public actualizado_en!: Date;
}

export const initProducto = (sequelizeInstance: any) => {
  Producto.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Categoria,
        key: 'id'
      }
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    existencias: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    imagen_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    es_personalizable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    opciones_personalizacion: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    creado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    actualizado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize: sequelizeInstance,
    tableName: 'productos',
    timestamps: false
  });

  Producto.belongsTo(Categoria, { foreignKey: 'categoria_id' });
  Categoria.hasMany(Producto, { foreignKey: 'categoria_id' });
}

export default Producto;
