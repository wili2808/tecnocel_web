import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/layout/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SearchProvider } from './contexts/SearchContext';
import { CarritoProvider } from './contexts/CarritoContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FavoritosGlobalProvider } from './contexts/FavoritosGlobalContext';
import { OfertasGlobalProvider } from './contexts/OfertasGlobalContext';
import { ProductProvider } from './contexts/ProductContext';
import NotificationContainer from './components/common/NotificationContainer';
import { useAutoLogout } from './hooks/useAutoLogout';
import './styles/global.css';

// Lazy loading de componentes
const Home = lazy(() => import('./pages/Home'));
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const UserPanel = lazy(() => import('./pages/UserPanel'));
const Cart = lazy(() => import('./pages/Cart'));
const Offers = lazy(() => import('./pages/Offers/Offers'));
const Brands = lazy(() => import('./pages/Brands/Brands'));
const ButtonDemo = lazy(() => import('./pages/ButtonDemo'));

// Componente de carga
const LoadingFallback = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
  </div>
);

// Componente wrapper para auto-logout
const AutoLogoutWrapper = ({ children }: { children: React.ReactNode }) => {
  useAutoLogout({
    timeoutMinutes: 30,
    enabled: true,
    onLogout: () => {
      console.log('Usuario desconectado por inactividad');
    }
  });

  return <>{children}</>;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <AutoLogoutWrapper>
          <ThemeProvider>
            <NotificationProvider>
              <FavoritosGlobalProvider>
                <OfertasGlobalProvider>
                  <ProductProvider>
                    <Router>
                      <SearchProvider>
                        <CarritoProvider>
                          <Suspense fallback={<LoadingFallback />}>
                            <Routes>
                              {/* Rutas que usan Layout normal */}
                              <Route element={<Layout />}>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/panel" element={<UserPanel />} />
                                <Route path="/carrito" element={<Cart />} />
                                <Route path="/ofertas" element={<Offers />} />
                                <Route path="/marcas" element={<Brands />} />
                                <Route path="/button-demo" element={<ButtonDemo />} />
                              </Route>
                              {/* Rutas sin footer */}
                              <Route element={<Layout hideFooter />}>
                                <Route path="/productos" element={<ProductCatalog />} />
                                <Route path="/productos/:id" element={<ProductPage />} />
                              </Route>
                            </Routes>
                          </Suspense>
                          <NotificationContainer />
                        </CarritoProvider>
                      </SearchProvider>
                    </Router>
                  </ProductProvider>
                </OfertasGlobalProvider>
              </FavoritosGlobalProvider>
            </NotificationProvider>
          </ThemeProvider>
        </AutoLogoutWrapper>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App
