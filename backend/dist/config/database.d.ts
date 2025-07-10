/**
 * Configuración y conexión a la base de datos MySQL
 * Este archivo maneja la conexión a la base de datos y la inicialización de datos básicos
 */
import { Sequelize } from 'sequelize';
/**
 * Configuración de la conexión a la base de datos MySQL
 * Se utilizan variables de entorno con valores por defecto
 */
declare const sequelize: Sequelize;
/**
 * Función para inicializar la conexión a la base de datos
 * - Establece la conexión
 * - Sincroniza los modelos
 * - Crea datos iniciales si es necesario
 */
export declare const initDatabase: () => Promise<void>;
export default sequelize;
