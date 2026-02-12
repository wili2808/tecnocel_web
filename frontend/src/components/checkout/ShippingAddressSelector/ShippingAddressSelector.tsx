/**
 * Componente para seleccionar dirección de envío
 * Solo se muestra si el tipo de entrega es "envío"
 */
import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { direccionService } from '../../../services/direccionService';
import DireccionModal from '../../user/DireccionModal/DireccionModal';
import type { DireccionFormData } from '../../user/DireccionModal/DireccionModal';
import type { DireccionEnvio } from '../../../types/checkout';
import styles from './ShippingAddressSelector.module.css';

interface ShippingAddressSelectorProps {
  selectedDireccionId: number | null;
  onSelectDireccion: (id: number) => void;
  error?: string;
}

export const ShippingAddressSelector = memo<ShippingAddressSelectorProps>(({
  selectedDireccionId,
  onSelectDireccion,
  error
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [direcciones, setDirecciones] = useState<DireccionEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Cargar direcciones
  const cargarDirecciones = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await direccionService.getDirecciones(user.id);
      setDirecciones(data as DireccionEnvio[]);
    } catch (error) {
      showNotification('Error al cargar direcciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, showNotification]);

  useEffect(() => {
    cargarDirecciones();
  }, [cargarDirecciones]);

  // Auto-seleccionar dirección predeterminada
  useEffect(() => {
    if (direcciones.length > 0 && !selectedDireccionId) {
      const predeterminada = direcciones.find(d => d.es_predeterminada);
      if (predeterminada) {
        onSelectDireccion(predeterminada.id_direccion);
      } else {
        // Si no hay predeterminada, seleccionar la primera
        onSelectDireccion(direcciones[0].id_direccion);
      }
    }
  }, [direcciones, selectedDireccionId, onSelectDireccion]);

  // Guardar nueva dirección
  const handleGuardarDireccion = useCallback(async (formData: DireccionFormData) => {
    if (!user?.id) return;

    try {
      const nuevaDireccion = await direccionService.createDireccion(
        user.id,
        formData
      );
      showNotification('Dirección agregada exitosamente', 'success');
      await cargarDirecciones();
      setModalOpen(false);

      // Auto-seleccionar la nueva dirección
      if (nuevaDireccion.id_direccion) {
        onSelectDireccion(nuevaDireccion.id_direccion);
      }
    } catch (error) {
      showNotification('Error al guardar dirección', 'error');
      throw error;
    }
  }, [user?.id, cargarDirecciones, onSelectDireccion, showNotification]);

  // Memoizar si hay direcciones
  const hayDirecciones = useMemo(() => direcciones.length > 0, [direcciones.length]);

  if (loading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>
          <span className="material-icons">home</span>
          Dirección de Envío
        </h3>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando direcciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className="material-icons">home</span>
          Dirección de Envío
        </h3>
        {hayDirecciones && (
          <button
            onClick={() => setModalOpen(true)}
            className={styles.btnAdd}
            type="button"
          >
            <span className="material-icons">add</span>
            Nueva
          </button>
        )}
      </div>

      {!hayDirecciones ? (
        <div className={styles.emptyState}>
          <span className="material-icons">location_off</span>
          <p>No tienes direcciones registradas</p>
          <p className={styles.emptySubtext}>
            Agrega una dirección para continuar con el envío
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className={styles.btnPrimary}
            type="button"
          >
            <span className="material-icons">add</span>
            Agregar Dirección
          </button>
        </div>
      ) : (
        <div className={styles.addressList}>
          {direcciones.map((direccion) => (
            <label
              key={direccion.id_direccion}
              className={`${styles.addressCard} ${
                selectedDireccionId === direccion.id_direccion ? styles.selected : ''
              }`}
            >
              <input
                type="radio"
                name="direccion"
                value={direccion.id_direccion}
                checked={selectedDireccionId === direccion.id_direccion}
                onChange={() => onSelectDireccion(direccion.id_direccion)}
                className={styles.radio}
              />

              <div className={styles.addressContent}>
                <div className={styles.addressHeader}>
                  <strong>{direccion.nombre_direccion}</strong>
                  {direccion.es_predeterminada && (
                    <span className={styles.badge}>Predeterminada</span>
                  )}
                </div>

                <div className={styles.addressDetails}>
                  <p>
                    {direccion.calle} #{direccion.numero}
                    {direccion.piso && `, Piso ${direccion.piso}`}
                    {direccion.departamento && ` ${direccion.departamento}`}
                  </p>
                  <p>{direccion.barrio}, {direccion.ciudad}</p>
                  <p>{direccion.provincia}</p>
                  {direccion.referencia && (
                    <p className={styles.reference}>
                      <span className="material-icons">info</span>
                      {direccion.referencia}
                    </p>
                  )}
                  <p className={styles.phone}>
                    <span className="material-icons">phone</span>
                    {direccion.telefono_contacto}
                  </p>
                </div>
              </div>

              {selectedDireccionId === direccion.id_direccion && (
                <span className={`material-icons ${styles.checkIcon}`}>check_circle</span>
              )}
            </label>
          ))}
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      <DireccionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleGuardarDireccion}
        title="Nueva Dirección de Envío"
      />
    </div>
  );
});

ShippingAddressSelector.displayName = 'ShippingAddressSelector';

export default ShippingAddressSelector;
