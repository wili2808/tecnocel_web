import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class Carrito extends Model {
}
Carrito.init({
    id_carrito: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nro_venta: {
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
    modelName: 'Carrito',
    tableName: 'tb_carrito',
    timestamps: false
});
export default Carrito;
//# sourceMappingURL=Carrito.js.map