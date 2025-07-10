import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class Proveedor extends Model {
}
Proveedor.init({
    id_proveedor: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_proveedor: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    celular: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    telefono: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    empresa: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    direccion: {
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
    modelName: 'Proveedor',
    tableName: 'tb_proveedores',
    timestamps: false
});
export default Proveedor;
//# sourceMappingURL=Proveedor.js.map