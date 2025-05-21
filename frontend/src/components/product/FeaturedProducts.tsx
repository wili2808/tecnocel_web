import products from '../../data/products.json';

const FeaturedProducts = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-16 text-center text-4xl font-semibold text-primary">
          Productos Destacados
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="group bg-elevated rounded-xl p-6 text-center shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="mb-6 overflow-hidden rounded-lg">
                <img 
                  src={product.imagen_url} 
                  alt={product.nombre} 
                  className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="mb-4 text-2xl font-semibold text-primary">
                {product.nombre}
              </h3>
              <p className="mb-4 text-secondary">
                {product.descripcion}
              </p>
              <p className="text-xl font-semibold text-accent">
                ${product.precio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
