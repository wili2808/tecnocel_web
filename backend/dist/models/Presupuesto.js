import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class Presupuesto extends Model {
}
Presupuesto.init({
    id_presupuesto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nro_presupuesto: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tb_clientes',
            key: 'id_cliente'
        }
    },
    total_pagado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    fyh_creacion: {
        type: DataTypes.DATE,
        allowNull: true
    },
    moneda: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    valor_dolar: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    estado: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Presupuesto',
    tableName: 'tb_presupuestos',
    timestamps: false
});
export default Presupuesto;
//# sourceMappingURL=Presupuesto.js.map