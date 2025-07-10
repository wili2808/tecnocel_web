import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class Compra extends Model {
}
Compra.init({
    id_compra: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nro_compra: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fecha_compra: {
        type: DataTypes.DATE,
        allowNull: false
    },
    id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tb_proveedores',
            key: 'id_proveedor'
        }
    },
    comprobante: {
        type: DataTypes.STRING(255),
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
    precio_total: {
        type: DataTypes.STRING(50),
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
    modelName: 'Compra',
    tableName: 'tb_compras',
    timestamps: false
});
export default Compra;
//# sourceMappingURL=Compra.js.map