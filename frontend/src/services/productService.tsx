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
};

export default productService;
