import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/layout/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SearchProvider } from './contexts/SearchContext';
import { CarritoProvider } from './contexts/CarritoContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FavoritosGlobalProvider } from './contexts/FavoritosGlobalContext';
import { OfertasGlobalProvider } from './contexts/OfertasGlobalContext';
import { NotificacionesProvider } from './contexts/NotificacionesContext';
import { ProductProvider } from './contexts/ProductContext';
import { TipoCambioProvider } from './contexts/TipoCambioContext';
import NotificationContainer from './components/common/NotificationContainer';
import SearchSync from './components/common/SearchSync';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicOnlyRoute from './components/common/PublicOnlyRoute';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';
import ScrollToTop from './components/common/ScrollToTop/ScrollToTop';
import { useAutoLogout } from './hooks/useAutoLogout';
import { useAuth } from './contexts/AuthContext';
import './styles/global.css';

// Lazy loading de componentes
const Home = lazy(() => import('./pages/Home'));
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const UserPanel = lazy(() => import('./pages/UserPanel'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Offers = lazy(() => import('./pages/Offers/Offers'));
const Brands = lazy(() => import('./pages/Brands/Brands'));
const Contacto = lazy(() => import('./pages/Contacto'));
const VerificarEmail = lazy(() => import('./pages/Auth/VerificarEmail/VerificarEmail'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword/ResetPassword'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword/ForgotPassword'));
const ActivarCuenta = lazy(() => import('./pages/Auth/ActivarCuenta/ActivarCuenta'));
// Componentes de administración
const AdminLogin = lazy(() => import('./pages/AdminLogin/AdminLogin'));
const AdminPanel = lazy(() => import('./pages/AdminPanel/AdminPanel'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

// Componente de carga
const LoadingFallback = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
  </div>
);

// Componente wrapper para auto-logout
// Solo aplica a gerentes y admins — clientes y vendedores no tienen auto-logout
// porque sus flujos de trabajo requieren sesiones largas sin interrupciones
const AutoLogoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isGerente } = useAuth();

  const timeoutMinutes = isAdmin ? 15 : 30; // Admin: 15min, Gerente: 30min

  useAutoLogout({
    timeoutMinutes,
    enabled: isAdmin || isGerente,
    onLogout: () => {
      console.log('Usuario desconectado por inactividad');
    }
  });

  return <>{children}</>;
};

function App() {
  return (
    <HelmetProvider>
    <ErrorBoundary>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <AutoLogoutWrapper>
          <ThemeProvider>
            <NotificationProvider>
              <NotificacionesProvider>
              <FavoritosGlobalProvider>
                <OfertasGlobalProvider>
                  <TipoCambioProvider>
                  <ProductProvider>
                    <Router>
                      <ScrollToTop />
                      <SearchProvider>
                        <CarritoProvider>
                          {/* Sincronización global entre SearchContext y ProductContext */}
                          <SearchSync />
                          <Suspense fallback={<LoadingFallback />}>
                            <Routes>
                              {/* Rutas públicas que usan Layout normal */}
                              <Route element={<Layout />}>
                                <Route path="/" element={<Home />} />
                                {/* Rutas de autenticación - solo para usuarios no logueados */}
                                <Route path="/login" element={
                                  <PublicOnlyRoute>
                                    <Login />
                                  </PublicOnlyRoute>
                                } />
                                <Route path="/register" element={
                                  <PublicOnlyRoute>
                                    <Register />
                                  </PublicOnlyRoute>
                                } />
                                <Route path="/verificar-email" element={<VerificarEmail />} />
                                <Route path="/reset-password" element={<ResetPassword />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/activar-cuenta" element={<ActivarCuenta />} />
                                {/* Rutas protegidas de cliente */}
                                <Route path="/panel" element={
                                  <ProtectedRoute allowedUserTypes={['cliente']}>
                                    <UserPanel />
                                  </ProtectedRoute>
                                } />
                                <Route path="/carrito" element={
                                  <ProtectedRoute allowedUserTypes={['cliente']}>
                                    <Cart />
                                  </ProtectedRoute>
                                } />
                                <Route path="/checkout" element={
                                  <ProtectedRoute allowedUserTypes={['cliente']}>
                                    <Checkout />
                                  </ProtectedRoute>
                                } />
                                <Route path="/order-confirmation/:id_venta" element={
                                  <ProtectedRoute allowedUserTypes={['cliente']}>
                                    <OrderConfirmation />
                                  </ProtectedRoute>
                                } />
                                {/* Rutas públicas */}
                                <Route path="/ofertas" element={<Offers />} />
                                <Route path="/marcas" element={<Brands />} />
                                <Route path="/contacto" element={<Contacto />} />
                              </Route>
                              {/* Rutas públicas sin footer */}
                              <Route element={<Layout hideFooter />}>
                                <Route path="/productos" element={<ProductCatalog />} />
                                <Route path="/productos/:id" element={<ProductPage />} />
                              </Route>
                              {/* Rutas de administración (sin layout) */}
                              <Route path="/admin-login" element={
                                <PublicOnlyRoute redirectTo="/admin-panel">
                                  <AdminLogin />
                                </PublicOnlyRoute>
                              } />
                              <Route path="/admin-panel" element={
                                <ProtectedRoute allowedUserTypes={['system']}>
                                  <AdminPanel />
                                </ProtectedRoute>
                              } />
                              {/* Catch-all: 404 con Layout */}
                              <Route element={<Layout />}>
                                <Route path="*" element={<NotFound />} />
                              </Route>
                            </Routes>
                          </Suspense>
                          <NotificationContainer />
                        </CarritoProvider>
                      </SearchProvider>
                    </Router>
                  </ProductProvider>
                  </TipoCambioProvider>
                </OfertasGlobalProvider>
              </FavoritosGlobalProvider>
              </NotificacionesProvider>
            </NotificationProvider>
          </ThemeProvider>
        </AutoLogoutWrapper>
      </AuthProvider>
    </GoogleOAuthProvider>
    </ErrorBoundary>
    </HelmetProvider>
  )
}

export default App
