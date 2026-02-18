/**
 * Componente ProductoForm - Formulario para crear/editar productos
 * Maneja campos del producto, selección de categoría/marca y subida de imágenes
 */
import { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import adminProductService from '../../../services/adminProductService';
import ProductoImageUploader from './ProductoImageUploader';
import ProductoCaracteristicas from './ProductoCaracteristicas';
import ProductoOfertas from './ProductoOfertas';
import type {
  Product,
  Category,
  Marca,
  ProductoFormData,
  ImagenPreview,
  CaracteristicaLocal,
} from '../../../types/product';
import styles from './ProductoForm.module.css';

interface ProductoFormProps {
  modo: 'crear' | 'editar';
  producto?: Product | null;
  onGuardado: () => void;
  onCancelar: () => void;
}

const INITIAL_FORM: ProductoFormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  id_categoria: 0,
  id_marca: undefined,
  modelo: '',
  precio_compra: '',
  precio_venta: '',
  stock: 0,
  stock_minimo: undefined,
  stock_maximo: undefined,
  fecha_ingreso: new Date().toISOString().split('T')[0],
  es_destacado: false,
  orden_destacado: 0,
};

const ProductoForm = ({ modo, producto, onGuardado, onCancelar }: ProductoFormProps) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<ProductoFormData>(INITIAL_FORM);
  const [imagenes, setImagenes] = useState<ImagenPreview[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<CaracteristicaLocal[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);

  // Cargar categorías y marcas al montar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [cats, mrs] = await Promise.all([
          adminProductService.obtenerCategorias(),
          adminProductService.obtenerMarcas(),
        ]);
        setCategorias(Array.isArray(cats) ? cats : []);
        setMarcas(Array.isArray(mrs) ? mrs : []);
      } catch (err: any) {
        showNotification('Error al cargar categorías y marcas', 'error');
      } finally {
        setLoadingDatos(false);
      }
    };
    cargarDatos();
  }, []);

  // Cargar datos del producto en modo edición
  useEffect(() => {
    if (modo === 'editar' && producto) {
      setFormData({
        codigo: producto.codigo || '',
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        id_categoria: producto.id_categoria || 0,
        id_marca: producto.id_marca || undefined,
        modelo: producto.modelo || '',
        precio_compra: producto.precio_compra || '',
        precio_venta: producto.precio_venta || '',
        stock: producto.stock || 0,
        stock_minimo: producto.stock_minimo ?? undefined,
        stock_maximo: producto.stock_maximo ?? undefined,
        fecha_ingreso: producto.fecha_ingreso
          ? producto.fecha_ingreso.split('T')[0]
          : new Date().toISOString().split('T')[0],
        es_destacado: producto.es_destacado || false,
        orden_destacado: producto.orden_destacado || 0,
      });

      // Cargar imágenes existentes
      if (producto.imagenes && producto.imagenes.length > 0) {
        const imagenesExistentes: ImagenPreview[] = producto.imagenes.map((img) => ({
          preview: img.url || '',
          url_imagen: img.url || '',
          alt_text: img.alt_text || '',
          es_existente: true,
        }));
        setImagenes(imagenesExistentes);
      }
    }
  }, [modo, producto]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (['stock', 'stock_minimo', 'stock_maximo', 'orden_destacado', 'id_categoria'].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? (name === 'id_categoria' ? 0 : undefined) : parseInt(value),
      }));
      return;
    }

    if (name === 'id_marca') {
      setFormData((prev) => ({
        ...prev,
        id_marca: value === '' || value === '0' ? undefined : parseInt(value),
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.codigo.trim()) {
      showNotification('El código del producto es requerido', 'error');
      return;
    }
    if (!formData.nombre.trim()) {
      showNotification('El nombre del producto es requerido', 'error');
      return;
    }
    if (!formData.id_categoria) {
      showNotification('Selecciona una categoría', 'error');
      return;
    }
    if (!formData.precio_compra || parseFloat(formData.precio_compra) <= 0) {
      showNotification('El precio de compra debe ser mayor a 0', 'error');
      return;
    }
    if (!formData.precio_venta || parseFloat(formData.precio_venta) <= 0) {
      showNotification('El precio de venta debe ser mayor a 0', 'error');
      return;
    }

    try {
      setLoading(true);

      // 1. Subir imágenes nuevas (las que tienen File)
      const nuevasFiles = imagenes.filter((img) => img.file).map((img) => img.file!);
      let imagenesSubidas: { url_imagen: string; alt_text: string }[] = [];

      if (nuevasFiles.length > 0) {
        imagenesSubidas = await adminProductService.subirImagenes(nuevasFiles);
      }

      // 2. Combinar imágenes existentes + nuevas subidas
      const todasImagenes: { url_imagen: string; alt_text?: string }[] = [];

      // Respetar el orden del array de imagenes
      let subidasIndex = 0;
      imagenes.forEach((img) => {
        if (img.es_existente && img.url_imagen) {
          // Extraer solo el nombre del archivo de la URL completa
          // La BD guarda el nombre, no la URL (ej: "imagen.webp", no "http://...imagen.webp")
          const urlParts = img.url_imagen.split('/');
          const fileName = urlParts[urlParts.length - 1];
          todasImagenes.push({ url_imagen: fileName, alt_text: img.alt_text });
        } else if (img.file && subidasIndex < imagenesSubidas.length) {
          todasImagenes.push({
            url_imagen: imagenesSubidas[subidasIndex].url_imagen,
            alt_text: img.alt_text || imagenesSubidas[subidasIndex].alt_text,
          });
          subidasIndex++;
        }
      });

      // 3. Construir payload
      // Solo incluir imagenes si hubo cambios (nuevas subidas o reordenamiento)
      const hayNuevasImagenes = nuevasFiles.length > 0;
      const imagenesOriginales = producto?.imagenes || [];
      const hayCambiosImagenes =
        hayNuevasImagenes ||
        imagenes.length !== imagenesOriginales.length ||
        imagenes.some((img, i) => {
          if (!img.es_existente) return true;
          const orig = imagenesOriginales[i];
          if (!orig) return true;
          return img.alt_text !== (orig.alt_text || '') || img.url_imagen !== orig.url;
        });

      const payload: ProductoFormData = {
        ...formData,
        imagenes: hayCambiosImagenes ? todasImagenes : undefined,
        caracteristicas:
          caracteristicas.length > 0 ? caracteristicas.map((c) => ({ id_tipo: c.id_tipo, valor: c.valor })) : [],
      };

      // 4. Crear o actualizar
      if (modo === 'crear') {
        await adminProductService.crearProducto(payload);
        showNotification('Producto creado exitosamente', 'success');
      } else if (producto) {
        await adminProductService.actualizarProducto(producto.id_producto, payload);
        showNotification('Producto actualizado exitosamente', 'success');
      }

      onGuardado();
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al guardar producto';
      showNotification(mensaje, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingDatos) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h2 className={styles.title}>
              <span className="material-icons">{modo === 'crear' ? 'add_box' : 'edit'}</span>
              {modo === 'crear' ? 'Crear Nuevo Producto' : 'Editar Producto'}
            </h2>
            <p className={styles.subtitle}>
              {modo === 'crear'
                ? 'Completa la información para agregar un producto al catálogo'
                : `Editando: ${producto?.nombre || ''}`}
            </p>
          </div>
          <button className={styles.backButton} onClick={onCancelar} type="button">
            <span className="material-icons">arrow_back</span>
            <span>Volver a lista</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Sección: Información Básica */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>
            <span className="material-icons">info</span>
            Información Básica
          </legend>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="codigo" className={styles.label}>
                Código *
              </label>
              <input
                type="text"
                id="codigo"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ej: PROD-001"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="nombre" className={styles.label}>
                Nombre *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ej: iPhone 15 Pro Max"
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="modelo" className={styles.label}>
                Modelo
              </label>
              <input
                type="text"
                id="modelo"
                name="modelo"
                value={formData.modelo || ''}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ej: A3101"
              />
            </div>
            <div className={styles.formGroupFull}>
              <label htmlFor="descripcion" className={styles.label}>
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion || ''}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="Descripción detallada del producto..."
                rows={3}
              />
            </div>
          </div>
        </fieldset>

        {/* Sección: Clasificación */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>
            <span className="material-icons">category</span>
            Clasificación
          </legend>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="id_categoria" className={styles.label}>
                Categoría *
              </label>
              <select
                id="id_categoria"
                name="id_categoria"
                value={formData.id_categoria}
                onChange={handleChange}
                className={styles.select}
                required
              >
                <option value={0}>Seleccionar categoría...</option>
                {categorias.map((cat) => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nombre_categoria}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="id_marca" className={styles.label}>
                Marca
              </label>
              <select
                id="id_marca"
                name="id_marca"
                value={formData.id_marca || ''}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="">Sin marca</option>
                {marcas.map((marca) => (
                  <option key={marca.id_marca} value={marca.id_marca}>
                    {marca.nombre_marca}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* Sección: Características / Especificaciones */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>
            <span className="material-icons">tune</span>
            Características / Especificaciones
          </legend>
          <ProductoCaracteristicas
            modo={modo}
            idProducto={producto?.id_producto}
            caracteristicas={caracteristicas}
            onCaracteristicasChange={setCaracteristicas}
          />
        </fieldset>

        {/* Sección: Precios */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>
            <span className="material-icons">payments</span>
            Precios
          </legend>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="precio_compra" className={styles.label}>
                Precio de Compra (BOB) *
              </label>
              <input
                type="number"
                id="precio_compra"
                name="precio_compra"
                value={formData.precio_compra}
                onChange={handleChange}
                className={styles.input}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="precio_venta" className={styles.label}>
                Precio de Venta (BOB) *
              </label>
              <input
                type="number"
                id="precio_venta"
                name="precio_venta"
                value={formData.precio_venta}
                onChange={handleChange}
                className={styles.input}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          {formData.precio_compra && formData.precio_venta && (
            <p className={styles.helpText}>
              Margen:{' '}
              {(
                ((parseFloat(formData.precio_venta) - parseFloat(formData.precio_compra)) /
                  parseFloat(formData.precio_compra)) *
                100
              ).toFixed(1)}
              %
            </p>
          )}
        </fieldset>

        {/* Sección: Inventario */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>
            <span className="material-icons">inventory</span>
            Inventario
          </legend>
          <div className={styles.formRow3}>
            <div className={styles.formGroup}>
              <label htmlFor="stock" className={styles.label}>
                Stock Actual *
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className={styles.input}
                min="0"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="stock_minimo" className={styles.label}>
                Stock Mínimo
              </label>
              <input
                type="number"
                id="stock_minimo"
                name="stock_minimo"
                value={formData.stock_minimo ?? ''}
                onChange={handleChange}
                className={styles.input}
                min="0"
                placeholder="Opcional"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="stock_maximo" className={styles.label}>
                Stock Máximo
              </label>
              <input
                type="number"
                id="stock_maximo"
                name="stock_maximo"
                value={formData.stock_maximo ?? ''}
                onChange={handleChange}
                className={styles.input}
                min="0"
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="fecha_ingreso" className={styles.label}>
                Fecha de Ingreso *
              </label>
              <input
                type="date"
                id="fecha_ingreso"
                name="fecha_ingreso"
                value={formData.fecha_ingreso}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
          </div>
        </fieldset>

        {/* Sección: Destacado */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>
            <span className="material-icons">star</span>
            Destacado
          </legend>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="es_destacado"
                checked={formData.es_destacado}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span>Marcar como producto destacado</span>
            </label>
          </div>
          {formData.es_destacado && (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="orden_destacado" className={styles.label}>
                  Orden de Destacado
                </label>
                <input
                  type="number"
                  id="orden_destacado"
                  name="orden_destacado"
                  value={formData.orden_destacado ?? 0}
                  onChange={handleChange}
                  className={styles.input}
                  min="0"
                />
                <p className={styles.helpText}>Menor número = mayor prioridad</p>
              </div>
            </div>
          )}
        </fieldset>

        {/* Sección: Ofertas (solo en edición) */}
        {modo === 'editar' && producto && (
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>
              <span className="material-icons">local_offer</span>
              Ofertas Asociadas
            </legend>
            <ProductoOfertas idProducto={producto.id_producto} />
          </fieldset>
        )}

        {/* Sección: Imágenes */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>
            <span className="material-icons">photo_library</span>
            Imágenes del Producto
          </legend>
          <ProductoImageUploader imagenes={imagenes} onChange={setImagenes} />
        </fieldset>

        {/* Acciones del formulario */}
        <div className={styles.formFooter}>
          <button type="button" onClick={onCancelar} className={styles.cancelButton}>
            Cancelar
          </button>
          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? (
              <>
                <span className="material-icons">hourglass_empty</span>
                {modo === 'crear' ? 'Creando...' : 'Guardando...'}
              </>
            ) : (
              <>
                <span className="material-icons">{modo === 'crear' ? 'add_box' : 'save'}</span>
                {modo === 'crear' ? 'Crear Producto' : 'Guardar Cambios'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductoForm;
