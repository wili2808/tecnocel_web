import { Model, DataTypes, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';

export enum RolUsuario {
  ADMINISTRADOR = 'administrador',
  EMPLEADO = 'empleado',
  CLIENTE = 'cliente'
}

interface UsuarioAttributes {
  id: number;
  email: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  telefono?: string;
  creado_en: Date;
  actualizado_en: Date;
}

// Algunos atributos son opcionales cuando se crea una instancia del modelo
interface UsuarioCreationAttributes extends Optional<UsuarioAttributes, 'id' | 'creado_en' | 'actualizado_en'> {}

class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> {
  declare id: number;
  declare email: string;
  declare contrasena: string;
  declare nombre: string;
  declare apellido: string;
  declare rol: RolUsuario;
  declare telefono?: string;
  declare creado_en: Date;
  declare actualizado_en: Date;

  // Métodos de instancia
  public async compararContrasena(contrasenaCandidata: string): Promise<boolean> {
    if (!contrasenaCandidata || !this.contrasena) {
      return false;
    }
    return bcrypt.compare(contrasenaCandidata, this.contrasena);
  }
}

export const initUsuario = (sequelizeInstance: any) => {
  Usuario.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    contrasena: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rol: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'cliente',
      validate: {
        isIn: [Object.values(RolUsuario)]
      }
    },
    telefono: {
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
    tableName: 'usuarios',
    timestamps: false,
    hooks: {
      beforeCreate: async (usuario: Usuario) => {
        if (usuario.contrasena) {
          const salt = await bcrypt.genSalt(10);
          usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
        }
      },
      beforeUpdate: async (usuario: Usuario) => {
        if (usuario.changed('contrasena') && usuario.contrasena) {
          const salt = await bcrypt.genSalt(10);
          usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
        }
      }
    }
  });
}

export default Usuario;
