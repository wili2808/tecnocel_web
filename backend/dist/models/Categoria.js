import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class Categoria extends Model {
}
Categoria.init({
    id_categoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_categoria: {
        type: DataTypes.STRING(255),
        allowNull: false
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
    modelName: 'Categoria',
    tableName: 'tb_categorias',
    timestamps: false
});
export default Categoria;
//# sourceMappingURL=Categoria.js.map