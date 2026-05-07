import React, { memo, useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { configuracionService, type Configuracion } from '../../../services/configuracionService';
import { useNotification } from '../../../contexts/NotificationContext';
import { useConfig } from '../../../contexts/ConfigContext';
import { AdminSurface, AdminLoading } from '../common';
import Input from '../../common/Input/Input';
import TextArea from '../../common/TextArea/TextArea';
import styles from './GestionConfiguracion.module.css';

/**
 * Componente de Gestión de Configuración (Refactorizado v2)
 * Utiliza componentes atómicos (Input, TextArea) y componentes de superficie del admin.
 */
const GestionConfiguracion: React.FC = memo(() => {
  const { theme, toggleTheme } = useTheme();
  const { showNotification } = useNotification();
  const { refreshConfigs } = useConfig();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<Record<string, string>>({
    site_title: '',
    site_description: '',
    whatsapp_number: '',
    instagram_url: '',
    facebook_url: '',
    site_email: '',
    site_phone: '',
    site_hours: '',
    site_address: '',
    map_lat: '',
    map_lng: '',
    map_title: '',
    maintenance_mode: '0'
  });

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const data = await configuracionService.getAll();
        const configMap: Record<string, string> = {};
        data.forEach((c: Configuracion) => {
          configMap[c.clave] = c.valor;
        });
        setConfigs(prev => ({ ...prev, ...configMap }));
      } catch (error) {
        console.error('Error al cargar configuraciones:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfigs(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleMaintenance = () => {
    setConfigs(prev => ({
      ...prev,
      maintenance_mode: prev.maintenance_mode === '1' ? '0' : '1'
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await configuracionService.updateMultiple(configs);
      showNotification('Configuraciones guardadas correctamente', 'success');
      await refreshConfigs();
    } catch (error) {
      console.error('Error al guardar configuraciones:', error);
      showNotification('Error al guardar las configuraciones', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminLoading variant="page" title="Cargando ajustes" message="Sincronizando preferencias del sistema..." />;
  }

  return (
    <div className={styles.configContainer}>
      <div className={styles.configHeader}>
        <h2 className={styles.configTitle}>Ajustes del Sistema</h2>
        <p className={styles.configSubtitle}>Administra la identidad de tu marca, SEO, contactos y ubicación.</p>
      </div>

      <form onSubmit={handleSave} className={styles.configGrid}>
        
        {/* ESTADO DEL SITIO */}
        <section className={styles.configSection}>
          <div className={styles.sectionHeader}>
            <span className="material-icons">settings_power</span>
            <h3>Estado del Sitio</h3>
          </div>
          <AdminSurface className={`${styles.configCard} ${configs.maintenance_mode === '1' ? styles.maintenanceActive : ''}`}>
            <div className={styles.cardInfo}>
              <h4>Modo Mantenimiento</h4>
              <p>Si se activa, los clientes verán una página de mantenimiento y no podrán realizar compras.</p>
            </div>
            <div className={styles.cardActions}>
              <button 
                type="button" 
                className={`${styles.toggleButton} ${configs.maintenance_mode === '1' ? styles.activeToggle : ''}`}
                onClick={handleToggleMaintenance}
              >
                <span className="material-icons">
                  {configs.maintenance_mode === '1' ? 'construction' : 'check_circle'}
                </span>
                <span>{configs.maintenance_mode === '1' ? 'Activo' : 'Inactivo'}</span>
              </button>
            </div>
          </AdminSurface>
        </section>

        {/* APARIENCIA */}
        <section className={styles.configSection}>
          <div className={styles.sectionHeader}>
            <span className="material-icons">palette</span>
            <h3>Apariencia del Panel</h3>
          </div>
          <AdminSurface className={styles.configCard}>
            <div className={styles.cardInfo}>
              <h4>Tema Visual</h4>
              <p>Cambia entre el modo claro y oscuro para el dashboard administrativo.</p>
            </div>
            <div className={styles.cardActions}>
              <button 
                type="button" 
                className={`${styles.themeButton} ${theme === 'light' ? styles.activeTheme : ''}`}
                onClick={() => theme !== 'light' && toggleTheme()}
              >
                <span className="material-icons">light_mode</span>
                <span>Claro</span>
              </button>
              <button 
                type="button" 
                className={`${styles.themeButton} ${theme === 'dark' ? styles.activeTheme : ''}`}
                onClick={() => theme !== 'dark' && toggleTheme()}
              >
                <span className="material-icons">dark_mode</span>
                <span>Oscuro</span>
              </button>
            </div>
          </AdminSurface>
        </section>

        {/* PRESENCIA WEB */}
        <section className={styles.configSection}>
          <div className={styles.sectionHeader}>
            <span className="material-icons">public</span>
            <h3>Presencia Web (SEO)</h3>
          </div>
          <AdminSurface className={styles.configCardForm}>
            <Input 
              id="site_title"
              name="site_title"
              label="Título del Sitio"
              value={configs.site_title}
              onChange={handleChange}
              placeholder="Ej: TecnoCel - Tecnología y Celulares"
              icon="title"
            />
            <TextArea 
              id="site_description"
              name="site_description"
              label="Descripción Meta"
              value={configs.site_description}
              onChange={handleChange}
              placeholder="Describe tu tienda para los buscadores..."
              icon="description"
              rows={3}
            />
          </AdminSurface>
        </section>

        {/* CONTACTO */}
        <section className={styles.configSection}>
          <div className={styles.sectionHeader}>
            <span className="material-icons">contact_support</span>
            <h3>Contacto y Horarios</h3>
          </div>
          <AdminSurface className={styles.configCardForm}>
            <div className={styles.formRow}>
              <Input 
                id="site_email"
                name="site_email"
                type="email"
                label="Correo Electrónico"
                value={configs.site_email}
                onChange={handleChange}
                icon="email"
              />
              <Input 
                id="site_phone"
                name="site_phone"
                label="Teléfono de Línea"
                value={configs.site_phone}
                onChange={handleChange}
                icon="call"
              />
            </div>
            <Input 
              id="site_hours"
              name="site_hours"
              label="Horarios de Atención"
              value={configs.site_hours}
              onChange={handleChange}
              icon="schedule"
            />
          </AdminSurface>
        </section>

        {/* REDES SOCIALES */}
        <section className={styles.configSection}>
          <div className={styles.sectionHeader}>
            <span className="material-icons">share</span>
            <h3>Redes Sociales</h3>
          </div>
          <AdminSurface className={styles.configCardForm}>
            <div className={styles.formRow}>
              <Input 
                id="whatsapp_number"
                name="whatsapp_number"
                label="WhatsApp (Solo números)"
                value={configs.whatsapp_number}
                onChange={handleChange}
                icon="phone_iphone"
              />
              <Input 
                id="instagram_url"
                name="instagram_url"
                label="URL de Instagram"
                value={configs.instagram_url}
                onChange={handleChange}
                icon="camera_alt"
              />
            </div>
            <Input 
              id="facebook_url"
              name="facebook_url"
              label="URL de Facebook"
              value={configs.facebook_url}
              onChange={handleChange}
              icon="facebook"
            />
          </AdminSurface>
        </section>

        {/* UBICACIÓN */}
        <section className={styles.configSection}>
          <div className={styles.sectionHeader}>
            <span className="material-icons">place</span>
            <h3>Ubicación y Mapa</h3>
          </div>
          <AdminSurface className={styles.configCardForm}>
            <Input 
              id="site_address"
              name="site_address"
              label="Dirección Física"
              value={configs.site_address}
              onChange={handleChange}
              icon="home"
            />
            <div className={styles.formRow}>
              <Input 
                id="map_lat"
                name="map_lat"
                label="Latitud"
                value={configs.map_lat}
                onChange={handleChange}
                icon="location_on"
              />
              <Input 
                id="map_lng"
                name="map_lng"
                label="Longitud"
                value={configs.map_lng}
                onChange={handleChange}
                icon="location_on"
              />
            </div>
            <Input 
              id="map_title"
              name="map_title"
              label="Título en el Mapa"
              value={configs.map_title}
              onChange={handleChange}
              icon="label"
            />
          </AdminSurface>
        </section>

        <div className={styles.footerActions}>
          <button type="submit" className={styles.saveButton} disabled={saving}>
            <span className="material-icons">{saving ? 'sync' : 'save'}</span>
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  );
});

GestionConfiguracion.displayName = 'GestionConfiguracion';

export default GestionConfiguracion;
