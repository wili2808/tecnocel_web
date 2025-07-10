import HeroSection from '../components/layout/HeroSection';
import FeaturedProducts from '../components/product/FeaturedProducts';
import CTASection from '../components/common/CTASection';
import LocationSection from '../components/location/LocationSection';
import { useFeaturedProducts } from '../hooks';

const Home = () => {
  const { featuredProducts, loading, error } = useFeaturedProducts();

  return (
    <>
      <HeroSection />
      <FeaturedProducts
        products={featuredProducts}
        title="Productos Destacados"
        loading={loading}
        error={error}
      />
      <CTASection />
      <LocationSection />
    </>
  );
};

export default Home;
