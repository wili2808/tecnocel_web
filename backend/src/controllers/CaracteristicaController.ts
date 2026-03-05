import { Request, Response } from 'express';
import TipoCaracteristica from '../models/TipoCaracteristica.js';
import ProductoCaracteristica from '../models/ProductoCaracteristica.js';
import Almacen from '../models/Almacen.js';
import logger from '../services/loggerService.js';

interface AddCaracteristicaBody { id_tipo: number; valor: string; }
interface UpdateCaracteristicaBody { valor: string; }
interface CreateTipoBody {
  nombre_tipo: string; descripcion?: string; tipo_dato?: string;
  unidad_medida?: string; opciones_seleccion?: string;
}
interface UpdateTipoBody extends Partial<CreateTipoBody> { activo?: boolean; }

/**
 * Controlador para gestión de características de productos
 *
 * Maneja las operaciones CRUD de características de productos y sus tipos.
 * Permite asociar características dinámicas a productos (ej: RAM, Almacenamiento, Color)
 * mediante un sistema flexible de tipos y valores.
 *
 * @class CaracteristicaController
 */
export class CaracteristicaController {
  /**
   * Obtiene todos los tipos de características activos
   *
   * Endpoint público que retorna la lista de tipos de características disponibles
   * para asignar a productos (ej: RAM, Pantalla, Procesador). Solo retorna tipos
   * activos ordenados alfabéticamente.
   *
   * @param req - Express Request object
   * @param res - Express Response object
   * @returns 200 con { success, data, count } array de tipos de características
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/caracteristicas/tipos
   * Response: {
   *   success: true,
   *   data: [
   *     { id_tipo: 1, nombre_tipo: "RAM", tipo_dato: "numero", unidad_medida: "GB" },
   *     { id_tipo: 2, nombre_tipo: "Color", tipo_dato: "texto" }
   *   ],
   *   count: 2
   * }
   */
  static async getTiposCaracteristicas(req: Request, res: Response) {
    try {
      const tipos = await TipoCaracteristica.findAll({
        where: { activo: true },
        order: [['nombre_tipo', 'ASC']]
      });

      res.json({
        success: true,
        data: tipos,
        count: tipos.length
      });
    } catch (error) {
      logger.error('Error obteniendo tipos de características:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtiene todas las características de un producto específico
   *
   * Endpoint público que retorna las características asociadas a un producto,
   * incluyendo información del tipo de característica (nombre, tipo de dato, unidad).
   *
   * @param req - Express Request con params.id_producto
   * @param res - Express Response object
   * @returns 200 con { success, data, count } array de características del producto
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/caracteristicas/producto/123
   * Response: {
   *   success: true,
   *   data: [
   *     {
   *       id_caracteristica: 1,
   *       valor: "8",
   *       tipo: { nombre_tipo: "RAM", tipo_dato: "numero", unidad_medida: "GB" }
   *     }
   *   ],
   *   count: 1
   * }
   */
  static async getCaracteristicasProducto(req: Request, res: Response) {
    try {
      const { id_producto } = req.params;

      const caracteristicas = await ProductoCaracteristica.findAll({
        where: { id_producto },
        include: [
          {
            model: TipoCaracteristica,
            as: 'tipo',
            where: { activo: true }
          }
        ],
        order: [['fyh_creacion', 'ASC']]
      });

      res.json({
        success: true,
        data: caracteristicas,
        count: caracteristicas.length
      });
    } catch (error) {
      logger.error('Error obteniendo características del producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Agrega una característica a un producto
   *
   * Endpoint protegido que asocia un tipo de característica con un valor específico
   * a un producto. Verifica que tanto el producto como el tipo de característica existan
   * antes de crear la asociación.
   *
   * @param req - Express Request con params.id_producto y body {id_tipo, valor}
   * @param res - Express Response object
   * @returns 201 con { success, message, data } característica creada con tipo incluido
   * @returns 400 si faltan datos requeridos o ya existe la característica en el producto
   * @returns 404 si el producto o tipo de característica no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * POST /api/caracteristicas/producto/123
   * Body: { id_tipo: 1, valor: "8" }
   * Response: {
   *   success: true,
   *   message: "Característica agregada exitosamente",
   *   data: { id_caracteristica: 5, id_producto: 123, valor: "8", tipo: {...} }
   * }
   */
  static async addCaracteristicaProducto(req: Request, res: Response) {
    try {
      const { id_producto } = req.params;
      const { id_tipo, valor } = req.body as AddCaracteristicaBody;

      if (!id_tipo || !valor) {
        return res.status(400).json({
          success: false,
          message: 'El tipo y valor de la característica son requeridos'
        });
      }

      // Verificar que el producto existe
      const producto = await Almacen.findByPk(id_producto);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Verificar que el tipo existe
      const tipo = await TipoCaracteristica.findOne({
        where: { id_tipo, activo: true }
      });
      if (!tipo) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de característica no encontrado'
        });
      }

      const now = new Date();

      const caracteristica = await ProductoCaracteristica.create({
        id_producto,
        id_tipo,
        valor,
        fyh_creacion: now,
        fyh_actualizacion: now
      });

      // Incluir el tipo en la respuesta
      const caracteristicaCompleta = await ProductoCaracteristica.findByPk(
        caracteristica.id_caracteristica,
        {
          include: [{ model: TipoCaracteristica, as: 'tipo' }]
        }
      );

      logger.info(`Característica agregada al producto ${id_producto}: ${tipo.nombre_tipo} = ${valor}`);

      res.status(201).json({
        success: true,
        message: 'Característica agregada exitosamente',
        data: caracteristicaCompleta
      });
    } catch (error) {
      logger.error('Error agregando característica:', error);
      
      if (error instanceof Error && error.message.includes('Duplicate entry')) {
        return res.status(400).json({
          success: false,
          message: 'El producto ya tiene esta característica'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Actualiza el valor de una característica de producto
   *
   * Endpoint protegido que modifica el valor de una característica existente.
   * Solo actualiza el campo valor, no permite cambiar el tipo de característica.
   *
   * @param req - Express Request con params.id_caracteristica y body {valor}
   * @param res - Express Response object
   * @returns 200 con { success, message, data } característica actualizada con tipo
   * @returns 400 si no se proporciona el valor
   * @returns 404 si la característica no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * PUT /api/caracteristicas/5
   * Body: { valor: "16" }
   * Response: {
   *   success: true,
   *   message: "Característica actualizada exitosamente",
   *   data: { id_caracteristica: 5, valor: "16", tipo: {...} }
   * }
   */
  static async updateCaracteristicaProducto(req: Request, res: Response) {
    try {
      const { id_caracteristica } = req.params;
      const { valor } = req.body as UpdateCaracteristicaBody;

      if (!valor) {
        return res.status(400).json({
          success: false,
          message: 'El valor de la característica es requerido'
        });
      }

      const caracteristica = await ProductoCaracteristica.findByPk(id_caracteristica);
      
      if (!caracteristica) {
        return res.status(404).json({
          success: false,
          message: 'Característica no encontrada'
        });
      }

      await caracteristica.update({
        valor,
        fyh_actualizacion: new Date()
      });

      const caracteristicaActualizada = await ProductoCaracteristica.findByPk(
        id_caracteristica,
        {
          include: [{ model: TipoCaracteristica, as: 'tipo' }]
        }
      );

      logger.info(`Característica actualizada (ID: ${id_caracteristica}): ${valor}`);

      res.json({
        success: true,
        message: 'Característica actualizada exitosamente',
        data: caracteristicaActualizada
      });
    } catch (error) {
      logger.error('Error actualizando característica:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Elimina una característica de un producto
   *
   * Endpoint protegido que elimina permanentemente la asociación de una característica
   * con un producto. Esta operación es irreversible.
   *
   * @param req - Express Request con params.id_caracteristica
   * @param res - Express Response object
   * @returns 200 con { success, message } si la eliminación es exitosa
   * @returns 404 si la característica no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * DELETE /api/caracteristicas/5
   * Response: {
   *   success: true,
   *   message: "Característica eliminada exitosamente"
   * }
   */
  static async deleteCaracteristicaProducto(req: Request, res: Response) {
    try {
      const { id_caracteristica } = req.params;

      const caracteristica = await ProductoCaracteristica.findByPk(id_caracteristica);
      
      if (!caracteristica) {
        return res.status(404).json({
          success: false,
          message: 'Característica no encontrada'
        });
      }

      await caracteristica.destroy();

      logger.info(`Característica eliminada (ID: ${id_caracteristica})`);

      res.json({
        success: true,
        message: 'Característica eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando característica:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtiene todos los tipos de características (activos e inactivos)
   *
   * Endpoint protegido para administración que retorna todos los tipos,
   * incluyendo los desactivados.
   */
  static async getAllTipos(req: Request, res: Response) {
    try {
      const tipos = await TipoCaracteristica.findAll({
        order: [['nombre_tipo', 'ASC']]
      });

      res.json({
        success: true,
        data: tipos,
        count: tipos.length
      });
    } catch (error) {
      logger.error('Error obteniendo todos los tipos de características:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Crea un nuevo tipo de característica (requiere admin)
   *
   * Endpoint protegido que crea un nuevo tipo de característica que luego puede
   * ser asignado a productos. Permite definir el tipo de dato (texto, numero, booleano),
   * unidades de medida y opciones de selección para características categóricas.
   *
   * @param req - Express Request con body {nombre_tipo, descripcion?, tipo_dato?, unidad_medida?, opciones_seleccion?}
   * @param res - Express Response object
   * @returns 201 con { success, message, data } tipo de característica creado
   * @returns 400 si falta nombre_tipo o ya existe un tipo con ese nombre
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * POST /api/caracteristicas/tipos
   * Body: {
   *   nombre_tipo: "Almacenamiento",
   *   tipo_dato: "numero",
   *   unidad_medida: "GB",
   *   descripcion: "Capacidad de almacenamiento interno"
   * }
   * Response: {
   *   success: true,
   *   message: "Tipo de característica creado exitosamente",
   *   data: { id_tipo: 3, nombre_tipo: "Almacenamiento", ... }
   * }
   */
  static async createTipoCaracteristica(req: Request, res: Response) {
    try {
      const { nombre_tipo, descripcion, tipo_dato, unidad_medida, opciones_seleccion } = req.body as CreateTipoBody;

      if (!nombre_tipo) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del tipo es requerido'
        });
      }

      const now = new Date();

      const nuevoTipo = await TipoCaracteristica.create({
        nombre_tipo,
        descripcion: descripcion || null,
        tipo_dato: tipo_dato || 'texto',
        unidad_medida: unidad_medida || null,
        opciones_seleccion: opciones_seleccion || null,
        activo: true,
        fyh_creacion: now,
        fyh_actualizacion: now
      });

      logger.info(`Nuevo tipo de característica creado: ${nombre_tipo} (ID: ${nuevoTipo.id_tipo})`);

      res.status(201).json({
        success: true,
        message: 'Tipo de característica creado exitosamente',
        data: nuevoTipo
      });
    } catch (error) {
      logger.error('Error creando tipo de característica:', error);
      
      if (error instanceof Error && error.message.includes('Duplicate entry')) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un tipo de característica con ese nombre'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Actualiza un tipo de característica
   *
   * Endpoint protegido que permite modificar los datos de un tipo de característica.
   * Solo actualiza los campos proporcionados en el body.
   *
   * @param req - Express Request con params.id_tipo y body con campos a actualizar
   * @param res - Express Response object
   * @returns 200 con tipo actualizado
   * @returns 404 si el tipo no existe
   */
  static async updateTipoCaracteristica(req: Request, res: Response) {
    try {
      const { id_tipo } = req.params;
      const { nombre_tipo, descripcion, tipo_dato, unidad_medida, opciones_seleccion, activo } = req.body as UpdateTipoBody;

      const tipo = await TipoCaracteristica.findByPk(id_tipo);

      if (!tipo) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de característica no encontrado'
        });
      }

      const updateData: UpdateTipoBody & { fyh_actualizacion: Date } = { fyh_actualizacion: new Date() };
      if (nombre_tipo !== undefined) updateData.nombre_tipo = nombre_tipo;
      if (descripcion !== undefined) updateData.descripcion = descripcion;
      if (tipo_dato !== undefined) updateData.tipo_dato = tipo_dato;
      if (unidad_medida !== undefined) updateData.unidad_medida = unidad_medida;
      if (opciones_seleccion !== undefined) updateData.opciones_seleccion = opciones_seleccion;
      if (activo !== undefined) updateData.activo = activo;

      await tipo.update(updateData);

      logger.info(`Tipo de característica actualizado (ID: ${id_tipo}): ${tipo.nombre_tipo}`);

      res.json({
        success: true,
        message: 'Tipo de característica actualizado exitosamente',
        data: tipo
      });
    } catch (error) {
      logger.error('Error actualizando tipo de característica:', error);

      if (error instanceof Error && error.message.includes('Duplicate entry')) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un tipo de característica con ese nombre'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Desactiva un tipo de característica (soft delete)
   *
   * Endpoint protegido que cambia el estado activo a false.
   * Las características de productos existentes quedan intactas.
   *
   * @param req - Express Request con params.id_tipo
   * @param res - Express Response object
   * @returns 200 si se desactivó exitosamente
   * @returns 404 si el tipo no existe
   */
  static async deleteTipoCaracteristica(req: Request, res: Response) {
    try {
      const { id_tipo } = req.params;

      const tipo = await TipoCaracteristica.findByPk(id_tipo);

      if (!tipo) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de característica no encontrado'
        });
      }

      await tipo.update({
        activo: false,
        fyh_actualizacion: new Date()
      });

      logger.info(`Tipo de característica desactivado (ID: ${id_tipo}): ${tipo.nombre_tipo}`);

      res.json({
        success: true,
        message: 'Tipo de característica desactivado exitosamente'
      });
    } catch (error) {
      logger.error('Error desactivando tipo de característica:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}