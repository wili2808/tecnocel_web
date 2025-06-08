import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import './styles/global.css';

// Lazy loading de componentes
const Home = lazy(() => import('./pages/Home'));
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));

// Componente de carga
const LoadingFallback = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/productos" element={<ProductCatalog />} />
                {/* TODO: Agregar más rutas según sea necesario */}
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
