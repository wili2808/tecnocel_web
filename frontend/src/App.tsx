import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SearchProvider } from './contexts/SearchContext';
import './styles/global.css';

// Lazy loading de componentes
const Home = lazy(() => import('./pages/Home'));
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));

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
          <SearchProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Rutas que usan Layout normal */}
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>
                {/* Rutas sin footer */}
                <Route element={<Layout hideFooter />}>
                  <Route path="/productos" element={<ProductCatalog />} />
                </Route>
                {/* Rutas de autenticación sin layout */}
              </Routes>
            </Suspense>
          </SearchProvider>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
