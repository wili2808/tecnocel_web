import axiosInstance from '../api/axiosConfig';

// Definición del tipo Product (ajustar según ProductCardProps si es necesario)
export interface Product {
  id_producto: number;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  precio_venta: number;
  stock: number;
  // Puedes agregar más campos si es necesario
}

const productService = {
  getProducts: async () => {
    try {
      const response = await axiosInstance.get('/almacen/productos');
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  getFeaturedProducts: async () => {
    try {
      const response = await axiosInstance.get('/almacen/productos/destacados');
      return response.data;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  },

  getCategorias: async () => {
    try {
      const response = await axiosInstance.get('/almacen/categorias');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
};

export default productService;
