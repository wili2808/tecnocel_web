import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/layout/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SearchProvider } from './contexts/SearchContext';
import { CarritoProvider } from './contexts/CarritoContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FavoritosGlobalProvider } from './contexts/FavoritosGlobalContext';
import { OfertasGlobalProvider } from './contexts/OfertasGlobalContext';
import { NotificacionesProvider } from './contexts/NotificacionesContext';
import { ProductProvider } from './contexts/ProductContext';
import { TipoCambioProvider } from './contexts/TipoCambioContext';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import NotificationContainer from './components/common/NotificationContainer';
import SearchSync from './components/common/SearchSync';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicOnlyRoute from './components/common/PublicOnlyRoute';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';
import ScrollToTop from './components/common/ScrollToTop/ScrollToTop';
import LoadingScreen from './components/common/LoadingScreen/LoadingScreen';
import { useAutoLogout } from './hooks/useAutoLogout';
import './styles/global.css';

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
const AdminLogin = lazy(() => import('./pages/AdminLogin/AdminLogin'));
const AdminPanel = lazy(() => import('./pages/AdminPanel/AdminPanel'));
const Maintenance = lazy(() => import('./pages/Maintenance/Maintenance'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

const LoadingFallback = () => (
  <LoadingScreen variant="page" message="Cargando sección..." />
);

const AutoLogoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isGerente } = useAuth();

  const timeoutMinutes = isAdmin ? 15 : 30;

  useAutoLogout({
    timeoutMinutes,
    enabled: isAdmin || isGerente,
    onLogout: () => {
      console.log('Usuario desconectado por inactividad');
    }
  });

  return <>{children}</>;
};

import MaintenanceGuard from './components/common/MaintenanceGuard';

function App() {
  return (
    <HelmetProvider>
    <ErrorBoundary>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <AutoLogoutWrapper>
          <ConfigProvider>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </ConfigProvider>
        </AutoLogoutWrapper>
      </AuthProvider>
    </GoogleOAuthProvider>
    </ErrorBoundary>
    </HelmetProvider>
  )
}

function AppContent() {
  const { loading: configLoading } = useConfig();

  if (configLoading) {
    return <LoadingScreen message="Preparando tienda..." />;
  }

  return (
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
                  <SearchSync />
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/mantenimiento" element={<Maintenance />} />
                      <Route element={<MaintenanceGuard><Layout /></MaintenanceGuard>}>
                        <Route path="/" element={<Home />} />
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
                        <Route path="/ofertas" element={<Offers />} />
                        <Route path="/marcas" element={<Brands />} />
                        <Route path="/contacto" element={<Contacto />} />
                      </Route>
                      <Route element={<MaintenanceGuard><Layout hideFooter /></MaintenanceGuard>}>
                        <Route path="/productos" element={<ProductCatalog />} />
                        <Route path="/productos/:id" element={<ProductPage />} />
                        <Route path="/panel" element={
                          <ProtectedRoute allowedUserTypes={['cliente']}>
                            <UserPanel />
                          </ProtectedRoute>
                        } />
                      </Route>
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
  )
}

export default App
