import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class ProductoImagen extends Model {
  declare id_imagen: number;
  declare id_producto: number;
  declare url_imagen: string;
  declare alt_text: string | null;
  declare es_principal: boolean;
  declare orden: number;
  declare fyh_creacion: Date;
}

ProductoImagen.init({
  id_imagen: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_almacen',
      key: 'id_producto'
    }
  },
  url_imagen: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  alt_text: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  es_principal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  orden: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'ProductoImagen',
  tableName: 'tb_producto_imagenes',
  timestamps: false
});

export default ProductoImagen;