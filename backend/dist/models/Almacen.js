import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class Almacen extends Model {
}
Almacen.init({
    id_producto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    codigo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    stock_minimo: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    stock_maximo: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    precio_compra: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    precio_venta: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    fecha_ingreso: {
        type: DataTypes.DATE,
        allowNull: false
    },
    imagen: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tb_usuarios',
            key: 'id_usuario'
        }
    },
    id_categoria: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tb_categorias',
            key: 'id_categoria'
        }
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
    modelName: 'Almacen',
    tableName: 'tb_almacen',
    timestamps: false
});
export default Almacen;
//# sourceMappingURL=Almacen.js.map