/**
 * Página principal de Checkout
 * Orquesta el flujo completo de confirmación de compra con envío/retiro
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from '../../contexts/CarritoContext';
import { useNotification } from '../../contexts/NotificationContext';
import DeliveryTypeSelector from '../../components/checkout/DeliveryTypeSelector';
import ShippingAddressSelector from '../../components/checkout/ShippingAddressSelector';
import StorePickupInfo from '../../components/checkout/StorePickupInfo';
import PaymentMethodSelector from '../../components/checkout/PaymentMethodSelector';
import CheckoutSummary from '../../components/checkout/CheckoutSummary';
import PriceChangeAlert from '../../components/cart/PriceChangeAlert/PriceChangeAlert';
import type { TipoEntrega } from '../../types/checkout';
import styles from './Checkout.module.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { estado, confirmarCompra } = useCarrito();
  const { showNotification } = useNotification();

  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('envio');
  const [selectedDireccionId, setSelectedDireccionId] = useState<number | null>(null);
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<string | null>('efectivo');
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [errors, setErrors] = useState<{ direccion?: string; metodoPago?: string }>({});
  const [mostrarAlertaPrecio, setMostrarAlertaPrecio] = useState(false);

  // Redirigir si carrito vacío
  useEffect(() => {
    if (estado.items.length === 0 && !estado.cargando) {
      showNotification('Tu carrito está vacío', 'info');
      navigate('/carrito');
    }
  }, [estado.items.length, estado.cargando, navigate, showNotification]);

  // Limpiar error de dirección cuando cambia tipo de entrega
  useEffect(() => {
    if (tipoEntrega === 'retiro') {
      setErrors(prev => ({ ...prev, direccion: undefined }));
    }
  }, [tipoEntrega]);

  const validarFormulario = useCallback((): boolean => {
    const newErrors: { direccion?: string; metodoPago?: string } = {};

    if (tipoEntrega === 'envio' && !selectedDireccionId) {
      newErrors.direccion = 'Selecciona una dirección de envío';
    }

    if (!selectedMetodoPago) {
      newErrors.metodoPago = 'Selecciona un método de pago';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [tipoEntrega, selectedDireccionId, selectedMetodoPago]);

  const handleConfirmarCompra = useCallback(async () => {
    if (!validarFormulario()) {
      showNotification('Completa todos los campos requeridos', 'warning');
      return;
    }

    setProcesando(true);

    try {
      const venta = await confirmarCompra({
        observaciones: observaciones || `Compra con ${tipoEntrega === 'envio' ? 'envío a domicilio' : 'retiro en local'}`,
        moneda: 'BOB'
      });

      showNotification('¡Compra realizada exitosamente!', 'success');
      navigate(`/order-confirmation/${venta.id_venta}`);
    } catch (error: any) {
      console.error('Error al confirmar compra:', error);

      if (error.response?.data?.codigo === 'PRECIOS_CAMBIARON') {
        setMostrarAlertaPrecio(true);
      } else {
        showNotification(
          error.response?.data?.mensaje || 'Error al procesar la compra',
          'error'
        );
      }
    } finally {
      setProcesando(false);
    }
  }, [validarFormulario, observaciones, tipoEntrega, confirmarCompra, navigate, showNotification]);

  const handleAceptarCambioPrecio = useCallback(async () => {
    setMostrarAlertaPrecio(false);
    setProcesando(true);

    try {
      const venta = await confirmarCompra({
        observaciones: observaciones || `Compra con ${tipoEntrega === 'envio' ? 'envío a domicilio' : 'retiro en local'}`,
        moneda: 'BOB',
        aceptar_cambio_precio: true
      });

      showNotification('¡Compra realizada exitosamente!', 'success');
      navigate(`/order-confirmation/${venta.id_venta}`);
    } catch (error: any) {
      showNotification(
        error.response?.data?.mensaje || 'Error al procesar la compra',
        'error'
      );
    } finally {
      setProcesando(false);
    }
  }, [observaciones, tipoEntrega, confirmarCompra, navigate, showNotification]);

  if (estado.cargando) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/carrito')} className={styles.backButton} type="button">
          <span className="material-icons">arrow_back</span>
          Volver al carrito
        </button>
        <h1 className={styles.title}>Finalizar Compra</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.checkoutForm}>
          {/* Tipo de entrega */}
          <DeliveryTypeSelector
            tipoEntrega={tipoEntrega}
            onChangeTipo={setTipoEntrega}
          />

          {/* Dirección o info de retiro según tipo */}
          {tipoEntrega === 'envio' ? (
            <ShippingAddressSelector
              selectedDireccionId={selectedDireccionId}
              onSelectDireccion={setSelectedDireccionId}
              error={errors.direccion}
            />
          ) : (
            <StorePickupInfo />
          )}

          {/* Método de pago */}
          <PaymentMethodSelector
            selectedMetodo={selectedMetodoPago}
            onSelectMetodo={setSelectedMetodoPago}
            error={errors.metodoPago}
          />

          {/* Observaciones */}
          <div className={styles.observacionesSection}>
            <h3 className={styles.sectionTitle}>
              <span className="material-icons">note</span>
              Notas del Pedido (Opcional)
            </h3>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Instrucciones especiales de entrega, horarios preferidos, etc."
              className={styles.textarea}
              rows={4}
              maxLength={500}
            />
            <span className={styles.charCount}>{observaciones.length}/500</span>
          </div>
        </div>

        {/* Resumen */}
        <div className={styles.summarySection}>
          <CheckoutSummary
            items={estado.items}
            tipoEntrega={tipoEntrega}
          />

          <button
            onClick={handleConfirmarCompra}
            disabled={procesando}
            className={styles.btnConfirmar}
            type="button"
          >
            {procesando ? (
              <>
                <div className={styles.btnSpinner}></div>
                Procesando...
              </>
            ) : (
              <>
                <span className="material-icons">check_circle</span>
                Confirmar Compra
              </>
            )}
          </button>

          <div className={styles.securityInfo}>
            <span className="material-icons">security</span>
            <p>Compra protegida y segura</p>
          </div>
        </div>
      </div>

      {/* Alerta de cambio de precio */}
      {mostrarAlertaPrecio && estado.items_con_cambio_precio && (
        <div className={styles.alertOverlay}>
          <PriceChangeAlert
            itemsConCambio={estado.items_con_cambio_precio}
            diferencia_total={estado.diferencia_total || 0}
            onAceptar={handleAceptarCambioPrecio}
            onCancelar={() => setMostrarAlertaPrecio(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Checkout;
