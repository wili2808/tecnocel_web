import { Model, DataTypes, Optional } from 'sequelize';
import Usuario from './Usuario.js';

interface DireccionAttributes {
  id: number;
  usuario_id: number;
  calle: string;
  numero_exterior: string;
  numero_interior?: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  telefono?: string;
  predeterminada: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

// Algunos atributos son opcionales cuando se crea una instancia del modelo
interface DireccionCreationAttributes extends Optional<DireccionAttributes, 'id' | 'creado_en' | 'actualizado_en'> {}

class Direccion extends Model<DireccionAttributes, DireccionCreationAttributes> {
  // Las propiedades de instancia se definen aquí para la tipificación
  public id!: number;
  public usuario_id!: number;
  public calle!: string;
  public numero_exterior!: string;
  public numero_interior?: string;
  public colonia!: string;
  public ciudad!: string;
  public estado!: string;
  public codigo_postal!: string;
  public telefono?: string;
  public predeterminada!: boolean;
  public creado_en!: Date;
  public actualizado_en!: Date;
}

export const initDireccion = (sequelizeInstance: any) => {
  Direccion.init({
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
    calle: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    numero_exterior: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    numero_interior: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    colonia: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    ciudad: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    estado: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    codigo_postal: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    predeterminada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    tableName: 'direcciones',
    timestamps: false
  });

  Direccion.belongsTo(Usuario, { foreignKey: 'usuario_id' });
  Usuario.hasMany(Direccion, { foreignKey: 'usuario_id' });
}

export default Direccion;
