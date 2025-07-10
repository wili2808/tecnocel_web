import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class DetalleCompra extends Model {
}
DetalleCompra.init({
    id_detalle_compra: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nro_compra: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_producto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tb_almacen',
            key: 'id_producto'
        }
    },
    cantidad: {
        type: DataTypes.INTEGER,
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
    modelName: 'DetalleCompra',
    tableName: 'tb_detalle_compras',
    timestamps: false
});
export default DetalleCompra;
//# sourceMappingURL=DetalleCompra.js.map