/**
 * Componente Direcciones - Gestión CRUD de direcciones del usuario
 * Muestra lista de direcciones con opciones para crear, editar y eliminar
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { direccionService, type CreateDireccionData } from '../../../services/direccionService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import DireccionModal, { type DireccionFormData } from './DireccionModal';
import styles from './Direcciones.module.css';

interface Direccion extends DireccionFormData {
    id_direccion: number;
}

const Direcciones = () => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(true);
    const [direcciones, setDirecciones] = useState<Direccion[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDireccion, setEditingDireccion] = useState<Direccion | undefined>();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [direccionToDelete, setDireccionToDelete] = useState<number | null>(null);

    useEffect(() => {
        cargarDirecciones();
    }, []);

    const cargarDirecciones = async () => {
        if (!user?.id_cliente) return;

        try {
            setLoading(true);
            const data = await direccionService.getDirecciones(user.id_cliente);
            setDirecciones(data as Direccion[]);
        } catch (error: any) {
            showNotification('Error al cargar direcciones', 'error');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNuevaDireccion = () => {
        setEditingDireccion(undefined);
        setModalOpen(true);
    };

    const handleEditarDireccion = (direccion: Direccion) => {
        setEditingDireccion(direccion);
        setModalOpen(true);
    };

    const handleGuardarDireccion = async (formData: DireccionFormData) => {
        if (!user?.id_cliente) return;

        try {
            // Convertir DireccionFormData a CreateDireccionData
            const direccionData: CreateDireccionData = {
                nombre_direccion: formData.nombre_direccion,
                calle: formData.calle,
                numero: formData.numero,
                piso: formData.piso,
                departamento: formData.departamento,
                barrio: formData.barrio,
                ciudad: formData.ciudad,
                provincia: formData.provincia,
                codigo_postal: formData.codigo_postal,
                referencia: formData.referencia,
                telefono_contacto: formData.telefono_contacto,
                es_predeterminada: formData.es_predeterminada,
                es_facturacion: formData.es_facturacion
            };

            if (editingDireccion) {
                await direccionService.updateDireccion(
                    editingDireccion.id_direccion,
                    direccionData
                );
                showNotification('Dirección actualizada correctamente', 'success');
            } else {
                await direccionService.createDireccion(user.id_cliente, direccionData);
                showNotification('Dirección creada correctamente', 'success');
            }
            await cargarDirecciones();
        } catch (error: any) {
            showNotification(
                error.response?.data?.error || 'Error al guardar dirección',
                'error'
            );
            throw error;
        }
    };

    const handleEliminarDireccion = (id: number) => {
        setDireccionToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmarEliminar = async () => {
        if (!direccionToDelete) return;

        try {
            await direccionService.deleteDireccion(direccionToDelete);
            showNotification('Dirección eliminada correctamente', 'success');
            await cargarDirecciones();
        } catch (error: any) {
            showNotification(
                error.response?.data?.error || 'Error al eliminar dirección',
                'error'
            );
        } finally {
            setDeleteModalOpen(false);
            setDireccionToDelete(null);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>Mis Direcciones</h2>
                    <p className={styles.subtitle}>Gestiona tus direcciones de envío</p>
                </div>
                <button onClick={handleNuevaDireccion} className={styles.btnAdd}>
                    <span className="material-icons">add</span>
                    Nueva Dirección
                </button>
            </div>

            {direcciones.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className="material-icons">location_on</span>
                    <h3>No hay direcciones registradas</h3>
                    <p>Agrega una dirección para facilitar tus compras</p>
                    <button onClick={handleNuevaDireccion} className={styles.btnPrimary}>
                        <span className="material-icons">add</span>
                        Agregar Primera Dirección
                    </button>
                </div>
            ) : (
                <div className={styles.direccionesGrid}>
                    {direcciones.map((direccion) => (
                        <div key={direccion.id_direccion} className={styles.direccionCard}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.direccionNombre}>
                                    {direccion.nombre_direccion}
                                </h3>
                                <div className={styles.badges}>
                                    {direccion.es_predeterminada && (
                                        <span className={`${styles.badge} ${styles.badgePrimary}`}>
                                            Predeterminada
                                        </span>
                                    )}
                                    {direccion.es_facturacion && (
                                        <span className={`${styles.badge} ${styles.badgeSecondary}`}>
                                            Facturación
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.direccionInfo}>
                                    <span className="material-icons">location_on</span>
                                    <div>
                                        <p>
                                            {direccion.calle} #{direccion.numero}
                                            {direccion.piso && `, Piso ${direccion.piso}`}
                                            {direccion.departamento && ` ${direccion.departamento}`}
                                        </p>
                                        <p>
                                            {direccion.barrio}, {direccion.ciudad}
                                        </p>
                                        <p>
                                            {direccion.provincia}
                                            {direccion.codigo_postal && ` - CP: ${direccion.codigo_postal}`}
                                        </p>
                                        {direccion.referencia && (
                                            <p className={styles.referencia}>
                                                <span className="material-icons">info</span>
                                                {direccion.referencia}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.contactoInfo}>
                                    <div className={styles.contactoItem}>
                                        <span className="material-icons">phone</span>
                                        <span>{direccion.telefono_contacto}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <button
                                    onClick={() => handleEditarDireccion(direccion)}
                                    className={styles.btnEdit}
                                >
                                    <span className="material-icons">edit</span>
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleEliminarDireccion(direccion.id_direccion)}
                                    className={styles.btnDelete}
                                >
                                    <span className="material-icons">delete</span>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de crear/editar */}
            <DireccionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleGuardarDireccion}
                direccion={editingDireccion}
                title={editingDireccion ? 'Editar Dirección' : 'Nueva Dirección'}
            />

            {/* Modal de confirmación de eliminación */}
            {deleteModalOpen && (
                <div className={styles.deleteModal} onClick={() => setDeleteModalOpen(false)}>
                    <div className={styles.deleteModalContent} onClick={(e) => e.stopPropagation()}>
                        <span className="material-icons">warning</span>
                        <h3>¿Eliminar dirección?</h3>
                        <p>Esta acción no se puede deshacer</p>
                        <div className={styles.deleteModalActions}>
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className={styles.btnSecondary}
                            >
                                Cancelar
                            </button>
                            <button onClick={confirmarEliminar} className={styles.btnDanger}>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Direcciones;
