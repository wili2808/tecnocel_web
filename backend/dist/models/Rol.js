import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class Rol extends Model {
}
Rol.init({
    id_rol: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    rol: {
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
    modelName: 'Rol',
    tableName: 'tb_roles',
    timestamps: false
});
export default Rol;
//# sourceMappingURL=Rol.js.map