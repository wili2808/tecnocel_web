import { Model, DataTypes, Optional } from 'sequelize';

interface CategoriaAttributes {
  id: number;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  creado_en: Date;
  actualizado_en: Date;
}

// Algunos atributos son opcionales cuando se crea una instancia del modelo
interface CategoriaCreationAttributes extends Optional<CategoriaAttributes, 'id' | 'creado_en' | 'actualizado_en'> {}

class Categoria extends Model<CategoriaAttributes, CategoriaCreationAttributes> {
  // Las propiedades de instancia se definen aquí para la tipificación
  public id!: number;
  public nombre!: string;
  public descripcion?: string;
  public imagen_url?: string;
  public creado_en!: Date;
  public actualizado_en!: Date;
}

export const initCategoria = (sequelizeInstance: any) => {
  Categoria.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    imagen_url: {
      type: DataTypes.STRING(255),
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
    tableName: 'categorias',
    timestamps: false
  });
}

export default Categoria;
