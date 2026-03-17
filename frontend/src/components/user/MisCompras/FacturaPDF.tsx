/**
 * Componente de factura PDF para descargar desde Mis Compras
 * Generado en el browser con @react-pdf/renderer sin dependencia de backend
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const METODOS: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  qr: 'QR'
};

const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1e293b'
  },
  header: { marginBottom: 16 },
  storeName: { fontSize: 20, fontWeight: 'bold', color: '#0ea5e9' },
  storeSubtitle: { fontSize: 10, color: '#64748b', marginTop: 2 },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginVertical: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  label: { color: '#64748b' },
  value: { fontWeight: 'bold' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 7,
    borderRadius: 4,
    marginBottom: 2
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0'
  },
  totalLabel: { fontSize: 11, color: '#64748b', marginRight: 20 },
  totalValue: { fontSize: 14, fontWeight: 'bold', color: '#0ea5e9' },
  footer: {
    marginTop: 36,
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center'
  }
});

interface DireccionEnvioPDF {
  calle: string;
  numero: string;
  piso: string | null;
  departamento: string | null;
  barrio: string;
  ciudad: string;
  provincia: string;
}

interface FacturaPDFProps {
  venta: {
    numero_venta: string;
    fecha_venta: string;
    total: number;
    moneda: string;
    valor_dolar: number | null;
    metodo_pago: string | null;
    observaciones?: string | null;
    estado?: string;
    envio?: {
      tipo_entrega: 'envio' | 'retiro_en_tienda';
      fyh_despacho: string | null;
      direccion_envio: DireccionEnvioPDF | null;
    } | null;
    cancelacion?: {
      motivo: string | null;
      fecha_cancelacion: string;
    } | null;
    cliente: {
      nombre_cliente: string;
      apellido_cliente: string;
      correo: string;
    };
    items: Array<{
      nombre_producto: string;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
    }>;
  };
}

const formatPrecio = (n: number, moneda: string) =>
  `${moneda} ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

export const FacturaPDF = ({ venta }: FacturaPDFProps) => (
  <Document title={`Factura ${venta.numero_venta}`}>
    <Page size="A4" style={pdfStyles.page}>

      {/* Encabezado */}
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.storeName}>TecnoCel</Text>
        <Text style={pdfStyles.storeSubtitle}>Comprobante de Compra</Text>
      </View>

      <View style={pdfStyles.divider} />

      {/* Datos de la venta */}
      <View style={{ marginBottom: 14 }}>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>N° de compra:</Text>
          <Text style={pdfStyles.value}>{venta.numero_venta}</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Fecha:</Text>
          <Text style={pdfStyles.value}>{formatFecha(venta.fecha_venta)}</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Cliente:</Text>
          <Text style={pdfStyles.value}>
            {venta.cliente.nombre_cliente} {venta.cliente.apellido_cliente}
          </Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Correo:</Text>
          <Text style={pdfStyles.value}>{venta.cliente.correo}</Text>
        </View>
        {venta.metodo_pago && (
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Método de pago:</Text>
            <Text style={pdfStyles.value}>
              {METODOS[venta.metodo_pago] || venta.metodo_pago}
            </Text>
          </View>
        )}
        {venta.valor_dolar && (
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Tipo de cambio:</Text>
            <Text style={pdfStyles.value}>
              1 USD ={' '}
              {venta.valor_dolar.toLocaleString('es-AR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}{' '}
              ARS
            </Text>
          </View>
        )}
        {venta.observaciones && (
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Observaciones:</Text>
            <Text style={pdfStyles.value}>{venta.observaciones}</Text>
          </View>
        )}
        {venta.envio && (
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Tipo de entrega:</Text>
            <Text style={pdfStyles.value}>
              {venta.envio.tipo_entrega === 'envio' ? 'Envío a domicilio' : 'Retiro en tienda'}
            </Text>
          </View>
        )}
        {venta.envio?.tipo_entrega === 'envio' && venta.envio.direccion_envio && (
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Dirección de envío:</Text>
            <Text style={pdfStyles.value}>
              {venta.envio.direccion_envio.calle} {venta.envio.direccion_envio.numero}
              {venta.envio.direccion_envio.piso ? `, Piso ${venta.envio.direccion_envio.piso}` : ''}
              {venta.envio.direccion_envio.departamento ? ` Dpto. ${venta.envio.direccion_envio.departamento}` : ''}{'\n'}
              {venta.envio.direccion_envio.barrio}, {venta.envio.direccion_envio.ciudad}, {venta.envio.direccion_envio.provincia}
            </Text>
          </View>
        )}
      </View>

      {venta.cancelacion && (
        <>
          <View style={pdfStyles.divider} />
          <View style={{ backgroundColor: '#fee2e2', padding: 10, borderRadius: 4, marginBottom: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#dc2626', marginBottom: 4 }}>
              PEDIDO CANCELADO
            </Text>
            <Text style={{ fontSize: 9, color: '#7f1d1d' }}>
              Fecha de cancelación: {formatFecha(venta.cancelacion.fecha_cancelacion)}
            </Text>
            {venta.cancelacion.motivo && (
              <Text style={{ fontSize: 9, color: '#7f1d1d', marginTop: 2 }}>
                Motivo: {venta.cancelacion.motivo}
              </Text>
            )}
          </View>
        </>
      )}

      <View style={pdfStyles.divider} />

      {/* Tabla de productos */}
      <View style={pdfStyles.tableHeader}>
        <Text style={pdfStyles.col1}>Producto</Text>
        <Text style={pdfStyles.col2}>Cant.</Text>
        <Text style={pdfStyles.col3}>P. Unit.</Text>
        <Text style={pdfStyles.col4}>Subtotal</Text>
      </View>

      {venta.items.map((item, i) => (
        <View key={i} style={pdfStyles.tableRow}>
          <Text style={pdfStyles.col1}>{item.nombre_producto}</Text>
          <Text style={pdfStyles.col2}>{item.cantidad}</Text>
          <Text style={pdfStyles.col3}>
            {formatPrecio(item.precio_unitario, venta.moneda)}
          </Text>
          <Text style={pdfStyles.col4}>
            {formatPrecio(item.subtotal, venta.moneda)}
          </Text>
        </View>
      ))}

      {/* Total */}
      <View style={pdfStyles.totalRow}>
        <Text style={pdfStyles.totalLabel}>TOTAL:</Text>
        <Text style={pdfStyles.totalValue}>
          {formatPrecio(venta.total, venta.moneda)}
        </Text>
      </View>

      <View style={pdfStyles.divider} />

      <Text style={pdfStyles.footer}>TecnoCel — Gracias por su compra</Text>
    </Page>
  </Document>
);
