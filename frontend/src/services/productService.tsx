import axiosInstance from '../api/axiosConfig';

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
