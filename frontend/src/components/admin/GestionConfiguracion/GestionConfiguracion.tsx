import React, { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { configuracionService, type Configuracion } from '../../../services/configuracionService';
import { useNotification } from '../../../contexts/NotificationContext';
import { useConfig } from '../../../contexts/ConfigContext';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminSurface, AdminLoading } from '../common';
import Input from '../../common/Input/Input';
import TextArea from '../../common/TextArea/TextArea';
import styles from './GestionConfiguracion.module.css';

let _isDirty = false;
export const isConfigDirty = () => _isDirty;

const GestionConfiguracion: React.FC = memo(() => {
  const { theme, toggleTheme } = useTheme();
  const { showNotification } = useNotification();
  const { refreshConfigs } = useConfig();
  const { tienePermiso } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);
  const configsRef = useRef<Record<string, string>>({});
  const puedeGestionar = tienePermiso('gestionar_configuracion');
  const puedePresenciaWeb = tienePermiso('gestionar_presencia_web');
  const puedeContacto = tienePermiso('gestionar_contacto');
  const puedeRedesSociales = tienePermiso('gestionar_redes_sociales');
  const puedeUbicacion = tienePermiso('gestionar_ubicacion');

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    _isDirty = true;
  }, []);

  const markClean = useCallback(() => {
    dirtyRef.current = false;
    _isDirty = false;
  }, []);

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

  const originalConfigs = useRef<Record<string, string> | null>(null);

  const hasChanges = useMemo(() => {
    if (!originalConfigs.current) return false;
    const orig = originalConfigs.current;
    return Object.keys(orig).some(key => orig[key] !== (configs[key] ?? ''));
  }, [configs]);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        _isDirty = false;
        dirtyRef.current = false;
        const data = await configuracionService.getAll();
        const configMap: Record<string, string> = {
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
          maintenance_mode: '0',
        };
        data.forEach((c: Configuracion) => {
          configMap[c.clave] = c.valor;
        });
        setConfigs(prev => ({ ...prev, ...configMap }));
        configsRef.current = { ...configMap };
        originalConfigs.current = { ...configMap };
      } catch (error) {
        console.error('Error al cargar configuraciones:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      _isDirty = false;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    markDirty();
    setConfigs(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleMaintenance = () => {
    markDirty();
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
      originalConfigs.current = { ...configs };
      markClean();
    } catch (error) {
      console.error('Error al guardar configuraciones:', error);
      showNotification('Error al guardar las configuraciones', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {loading ? (
        <AdminLoading variant="panel" title="Cargando ajustes" message="Sincronizando preferencias del sistema..." />
      ) : (
      <form onSubmit={handleSave} className={styles.configGrid}>
        
        {/* ESTADO DEL SITIO */}
        <section className={styles.configSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconBox}>
              <span className="material-icons">settings_power</span>
            </div>
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
                className={`${styles.toggleButton} ${configs.maintenance_mode === '1' ? styles.activeToggle : ''} ${!puedeGestionar ? styles.disabledToggle : ''}`}
                onClick={handleToggleMaintenance}
                disabled={!puedeGestionar}
                title={!puedeGestionar ? 'No tienes permisos para gestionar el modo mantenimiento' : ''}
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
            <div className={styles.iconBox}>
              <span className="material-icons">palette</span>
            </div>
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
        <section className={`${styles.configSection} ${!puedePresenciaWeb ? styles.sectionDisabled : ''}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconBox}>
              <span className="material-icons">public</span>
            </div>
            <h3>Presencia Web (SEO)</h3>
            {!puedePresenciaWeb && <span className={`material-icons ${styles.lockBadge}`} title="Sin permisos">lock</span>}
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
              disabled={!puedePresenciaWeb}
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
              disabled={!puedePresenciaWeb}
            />
          </AdminSurface>
        </section>

        {/* CONTACTO */}
        <section className={`${styles.configSection} ${!puedeContacto ? styles.sectionDisabled : ''}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconBox}>
              <span className="material-icons">contact_support</span>
            </div>
            <h3>Contacto y Horarios</h3>
            {!puedeContacto && <span className={`material-icons ${styles.lockBadge}`} title="Sin permisos">lock</span>}
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
                disabled={!puedeContacto}
              />
              <Input 
                id="site_phone"
                name="site_phone"
                label="Teléfono de Línea"
                value={configs.site_phone}
                onChange={handleChange}
                icon="call"
                disabled={!puedeContacto}
              />
            </div>
            <Input 
              id="site_hours"
              name="site_hours"
              label="Horarios de Atención"
              value={configs.site_hours}
              onChange={handleChange}
              icon="schedule"
              disabled={!puedeContacto}
            />
          </AdminSurface>
        </section>

        {/* REDES SOCIALES */}
        <section className={`${styles.configSection} ${!puedeRedesSociales ? styles.sectionDisabled : ''}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconBox}>
              <span className="material-icons">share</span>
            </div>
            <h3>Redes Sociales</h3>
            {!puedeRedesSociales && <span className={`material-icons ${styles.lockBadge}`} title="Sin permisos">lock</span>}
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
                disabled={!puedeRedesSociales}
              />
              <Input 
                id="instagram_url"
                name="instagram_url"
                label="URL de Instagram"
                value={configs.instagram_url}
                onChange={handleChange}
                icon="camera_alt"
                disabled={!puedeRedesSociales}
              />
            </div>
            <Input 
              id="facebook_url"
              name="facebook_url"
              label="URL de Facebook"
              value={configs.facebook_url}
              onChange={handleChange}
              icon="facebook"
              disabled={!puedeRedesSociales}
            />
          </AdminSurface>
        </section>

        {/* UBICACIÓN */}
        <section className={`${styles.configSection} ${!puedeUbicacion ? styles.sectionDisabled : ''}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.iconBox}>
              <span className="material-icons">place</span>
            </div>
            <h3>Ubicación y Mapa</h3>
            {!puedeUbicacion && <span className={`material-icons ${styles.lockBadge}`} title="Sin permisos">lock</span>}
          </div>
          <AdminSurface className={styles.configCardForm}>
            <Input 
              id="site_address"
              name="site_address"
              label="Dirección Física"
              value={configs.site_address}
              onChange={handleChange}
              icon="home"
              disabled={!puedeUbicacion}
            />
            <div className={styles.formRow}>
              <Input 
                id="map_lat"
                name="map_lat"
                label="Latitud"
                value={configs.map_lat}
                onChange={handleChange}
                icon="location_on"
                disabled={!puedeUbicacion}
              />
              <Input 
                id="map_lng"
                name="map_lng"
                label="Longitud"
                value={configs.map_lng}
                onChange={handleChange}
                icon="location_on"
                disabled={!puedeUbicacion}
              />
            </div>
            <Input 
              id="map_title"
              name="map_title"
              label="Título en el Mapa"
              value={configs.map_title}
              onChange={handleChange}
              icon="label"
              disabled={!puedeUbicacion}
            />
          </AdminSurface>
        </section>

        <div className={styles.footerActions}>
          <button type="submit" className={styles.saveButton} disabled={!hasChanges || saving}>
            <span className="material-icons">{saving ? 'sync' : 'save'}</span>
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
      )}
    </div>
  );
});

GestionConfiguracion.displayName = 'GestionConfiguracion';

export default GestionConfiguracion;
