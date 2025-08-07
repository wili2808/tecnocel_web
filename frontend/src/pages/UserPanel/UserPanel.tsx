import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useFavoritosProductos } from '../../hooks/useFavoritosProductos';
import { useNotification } from '../../contexts/NotificationContext';
import ProductCard from '../../components/product/ProductCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import userPanelStyles from './UserPanel.module.css';

// Definir las opciones del menú del panel
const MENU_OPTIONS = [
    { id: 'profile', label: 'Información Personal', icon: 'person' },
    { id: 'account', label: 'Datos de Cuenta', icon: 'account_circle' },
    { id: 'security', label: 'Seguridad', icon: 'security' },
    { id: 'purchases', label: 'Mis Compras', icon: 'shopping_bag' },
    { id: 'favorites', label: 'Favoritos', icon: 'favorite' },
    { id: 'addresses', label: 'Direcciones', icon: 'location_on' },
    { id: 'support', label: 'Soporte', icon: 'help' },
];

// Componente de elemento del menú
const MenuOption = ({
    option,
    isActive,
    onClick
}: {
    option: typeof MENU_OPTIONS[0];
    isActive: boolean;
    onClick: () => void;
}) => (
    <button
        className={`${userPanelStyles.menuOption} ${isActive ? userPanelStyles.activeOption : ''}`}
        onClick={onClick}
        aria-label={option.label}
    >
        <span className="material-icons">{option.icon}</span>
        <span className={userPanelStyles.menuLabel}>{option.label}</span>
    </button>
);

// Componente de la sección de favoritos
const FavoritesSection = () => {
    const {
        productos,
        loading,
        error,
        removeFromFavoritos,
        hasMore,
        loadMore
    } = useFavoritosProductos();
    const { showNotification } = useNotification();

    const handleRemoveFromFavorites = async (productId: number) => {
        try {
            const success = await removeFromFavoritos(productId);
            if (success) {
                showNotification('Producto removido de favoritos', 'success', 3000);
            } else {
                showNotification('Error al remover el producto de favoritos', 'error', 5000);
            }
        } catch (error) {
            console.error('Error al remover de favoritos:', error);
            showNotification('Error al remover el producto de favoritos', 'error', 5000);
        }
    };

    // Debug: Verificar datos de productos
    console.log('FavoritesSection - Productos cargados:', productos.map(p => ({
        id: p.id_producto,
        nombre: p.nombre,
        imagen_url: p.imagen_url,
        imagenes_count: p.imagenes?.length || 0,
        imagenes: p.imagenes
    })));

    if (loading && productos.length === 0) {
        return (
            <div className={userPanelStyles.contentSection}>
                <h2 className={userPanelStyles.sectionTitle}>Favoritos</h2>
                <div className={userPanelStyles.loadingContainer}>
                    <LoadingSpinner />
                    <p>Cargando tus productos favoritos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={userPanelStyles.contentSection}>
                <h2 className={userPanelStyles.sectionTitle}>Favoritos</h2>
                <div className={userPanelStyles.errorContainer}>
                    <span className="material-icons">error_outline</span>
                    <p>Error al cargar favoritos: {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className={userPanelStyles.retryButton}
                    >
                        <span className="material-icons">refresh</span>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (productos.length === 0) {
        return (
            <div className={userPanelStyles.contentSection}>
                <h2 className={userPanelStyles.sectionTitle}>Favoritos</h2>
                <div className={userPanelStyles.emptyState}>
                    <span className="material-icons">favorite_border</span>
                    <h3>No tienes productos favoritos</h3>
                    <p>Explora nuestro catálogo y agrega productos a tus favoritos</p>
                    <a href="/productos" className={userPanelStyles.exploreButton}>
                        <span className="material-icons">storefront</span>
                        Explorar productos
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className={userPanelStyles.contentSection}>
            <h2 className={userPanelStyles.sectionTitle}>
                Favoritos
                <span className={userPanelStyles.itemCount}>({productos.length})</span>
            </h2>

            <div className={userPanelStyles.favoritesGrid}>
                {productos.map((producto) => (
                    <div key={producto.id_producto} className={userPanelStyles.favoriteItem}>
                        <ProductCard
                            id_producto={producto.id_producto}
                            nombre={producto.nombre}
                            descripcion={producto.descripcion}
                            imagen_url={producto.imagen_url}
                            imagenes={producto.imagenes}
                            precio_venta={producto.precio_venta}
                            stock={producto.stock}
                            precio_original={producto.precio_original}
                            precio_oferta={producto.precio_oferta}
                            descuento_porcentaje={producto.descuento_porcentaje}
                            en_oferta={producto.en_oferta}
                            className={userPanelStyles.favoriteCard}
                        />
                        <button
                            onClick={() => handleRemoveFromFavorites(producto.id_producto)}
                            className={userPanelStyles.removeButton}
                            title="Quitar de favoritos"
                            aria-label={`Quitar ${producto.nombre} de favoritos`}
                        >
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className={userPanelStyles.loadMoreContainer}>
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className={userPanelStyles.loadMoreButton}
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner />
                                Cargando...
                            </>
                        ) : (
                            <>
                                <span className="material-icons">expand_more</span>
                                Cargar más
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

// Componente de contenido dinámico
const ContentSection = ({ activeSection, user }: { activeSection: string; user: any }) => {
    const renderContent = () => {
        switch (activeSection) {
            case 'profile':
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Información Personal</h2>
                        <div className={userPanelStyles.profileInfo}>
                            <div className={userPanelStyles.profileCard}>
                                <div className={userPanelStyles.profileHeader}>
                                    <span className="material-icons">account_circle</span>
                                    <h3>{user?.nombre_cliente} {user?.apellido_cliente}</h3>
                                </div>
                                <div className={userPanelStyles.profileDetails}>
                                    <p><strong>Email:</strong> {user?.email_cliente}</p>
                                    <p><strong>Teléfono:</strong> {user?.celular_cliente || 'No especificado'}</p>
                                    <p><strong>Fecha de registro:</strong> {user?.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString() : 'No disponible'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'account':
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Datos de Cuenta</h2>
                        <div className={userPanelStyles.accountInfo}>
                            <p>Configuración de cuenta en desarrollo...</p>
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Seguridad</h2>
                        <div className={userPanelStyles.securityInfo}>
                            <p>Configuración de seguridad en desarrollo...</p>
                        </div>
                    </div>
                );
            case 'purchases':
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Mis Compras</h2>
                        <div className={userPanelStyles.purchasesInfo}>
                            <p>Historial de compras en desarrollo...</p>
                        </div>
                    </div>
                );

            case 'favorites':
                return <FavoritesSection />;
            case 'addresses':
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Direcciones</h2>
                        <div className={userPanelStyles.addressesInfo}>
                            <p>Gestión de direcciones en desarrollo...</p>
                        </div>
                    </div>
                );
            case 'support':
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Soporte</h2>
                        <div className={userPanelStyles.supportInfo}>
                            <p>Centro de soporte en desarrollo...</p>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Bienvenido</h2>
                        <p>Selecciona una opción del menú para comenzar.</p>
                    </div>
                );
        }
    };

    return (
        <div className={userPanelStyles.contentArea}>
            {renderContent()}
        </div>
    );
};

/**
 * Componente principal del panel de usuario
 */
const UserPanel = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('profile');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleBackToHome = () => {
        navigate('/');
    };

    // Verificar si el usuario está autenticado
    if (!user) {
        return (
            <div className={userPanelStyles.userPanel}>
                <div className={userPanelStyles.container}>
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Acceso Denegado</h2>
                        <p>Debes iniciar sesión para acceder al panel de usuario.</p>
                        <button
                            onClick={() => navigate('/login')}
                            className={userPanelStyles.retryButton}
                        >
                            <span className="material-icons">login</span>
                            Ir al Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${userPanelStyles.userPanel} ${userPanelStyles.themeAware}`}>
            <div className={userPanelStyles.container}>
                {/* Sidebar del panel */}
                <aside className={userPanelStyles.sidebar}>
                    <div className={userPanelStyles.sidebarHeader}>
                        <button
                            className={userPanelStyles.backButton}
                            onClick={handleBackToHome}
                            aria-label="Volver al inicio"
                        >
                            <span className="material-icons">arrow_back</span>
                            <span>Volver al inicio</span>
                        </button>
                    </div>

                    <div className={userPanelStyles.userInfo}>
                        <div className={userPanelStyles.userAvatar}>
                            <span className="material-icons">account_circle</span>
                        </div>
                        <div className={userPanelStyles.userDetails}>
                            <h3 className={userPanelStyles.userName}>
                                {user?.nombre_cliente} {user?.apellido_cliente}
                            </h3>
                        </div>
                    </div>

                    <nav className={userPanelStyles.sidebarNav}>
                        <div className={userPanelStyles.menuOptions}>
                            {MENU_OPTIONS.map(option => (
                                <MenuOption
                                    key={option.id}
                                    option={option}
                                    isActive={activeSection === option.id}
                                    onClick={() => setActiveSection(option.id)}
                                />
                            ))}
                        </div>

                        <div className={userPanelStyles.logoutSection}>
                            <button
                                className={userPanelStyles.logoutButton}
                                onClick={handleLogout}
                                aria-label="Cerrar sesión"
                            >
                                <span className="material-icons">logout</span>
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* Área de contenido principal */}
                <main className={userPanelStyles.mainContent}>
                    <ContentSection activeSection={activeSection} user={user} />
                </main>
            </div>
        </div>
    );
};

export default UserPanel; 