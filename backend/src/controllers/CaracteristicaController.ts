import { Request, Response } from 'express';
import TipoCaracteristica from '../models/TipoCaracteristica.js';
import ProductoCaracteristica from '../models/ProductoCaracteristica.js';
import Almacen from '../models/Almacen.js';
import logger from '../services/loggerService.js';

export class CaracteristicaController {
  // Obtener todos los tipos de características
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

  // Obtener características de un producto específico
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

  // Agregar característica a un producto
  static async addCaracteristicaProducto(req: Request, res: Response) {
    try {
      const { id_producto } = req.params;
      const { id_tipo, valor } = req.body;

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

  // Actualizar característica de un producto
  static async updateCaracteristicaProducto(req: Request, res: Response) {
    try {
      const { id_caracteristica } = req.params;
      const { valor } = req.body;

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

  // Eliminar característica de un producto
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

  // Crear nuevo tipo de característica (admin)
  static async createTipoCaracteristica(req: Request, res: Response) {
    try {
      const { nombre_tipo, descripcion, tipo_dato, unidad_medida, opciones_seleccion } = req.body;

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
}