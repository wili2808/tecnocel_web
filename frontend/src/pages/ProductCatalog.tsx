import React, { useState, useEffect } from 'react';
import productService from '../services/productService';

interface Product {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion: string;
  imagen_url: string;
  precio: number;
  existencias: number;
  es_personalizable: boolean;
  sizes?: string[];
  colors?: string[];
}

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getProducts();
        setProducts(data);
      } catch (error: any) {
        setError(error.response?.data?.message || error.message || 'Error fetching products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="product-catalog" style={{ padding: '2rem' }}>
      <div className="products-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '2rem'
      }}>
        {products.map(product => (
          <div key={product.id} className="product-card" style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <img
              src={product.imagen_url}
              alt={product.nombre}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}
            />
            <h3 style={{ marginBottom: '0.5rem' }}>{product.nombre}</h3>
            <p style={{ color: '#666', marginBottom: '0.5rem' }}>{product.descripcion}</p>
            <p style={{ fontWeight: 'bold', color: '#2c5282' }}>
              ${product.precio.toLocaleString()}
            </p>
            {product.sizes && (
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Tallas: {product.sizes.join(', ')}
              </p>
            )}
            {product.colors && (
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Colores: {product.colors.join(', ')}
              </p>
            )}
            <button
              style={{
                backgroundColor: '#2c5282',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Ver Detalles
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCatalog;
