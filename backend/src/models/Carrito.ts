import { Model, DataTypes, Optional } from 'sequelize';
import Usuario from './Usuario.js';

export enum EstadoCarrito {
  ACTIVO = 'activo',
  COMPLETADO = 'completado',
  ABANDONADO = 'abandonado'
}

interface CarritoAttributes {
  id: number;
  usuario_id: number;
  estado: EstadoCarrito;
  total: number;
  carrito_temporal_id?: string;
  creado_en: Date;
  actualizado_en: Date;
}

// Algunos atributos son opcionales cuando se crea una instancia del modelo
interface CarritoCreationAttributes extends Optional<CarritoAttributes, 'id' | 'creado_en' | 'actualizado_en'> {}

class Carrito extends Model<CarritoAttributes, CarritoCreationAttributes> {
  // Las propiedades de instancia se definen aquí para la tipificación
  public id!: number;
  public usuario_id!: number;
  public estado!: EstadoCarrito;
  public total!: number;
  public carrito_temporal_id?: string;
  public creado_en!: Date;
  public actualizado_en!: Date;
}

export const initCarrito = (sequelizeInstance: any) => {
  Carrito.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: 'id'
      }
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: EstadoCarrito.ACTIVO,
      validate: {
        isIn: [Object.values(EstadoCarrito)]
      }
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
 carrito_temporal_id: {
    type: DataTypes.STRING,
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
    tableName: 'carritos',
    timestamps: false
  });

  Carrito.belongsTo(Usuario, { foreignKey: 'usuario_id' });
  Usuario.hasMany(Carrito, { foreignKey: 'usuario_id' });
}

export default Carrito;
