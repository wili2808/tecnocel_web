/**
 * Componente de demostración para el Button
 * Muestra todas las variantes, tamaños y funcionalidades disponibles
 * Útil para desarrollo y testing del componente
 */
import React, { useState } from 'react';
import Button from './Button';
import styles from './ButtonDemo.module.css';

const ButtonDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleDemoClick = () => {
    console.log('Botón de demostración clickeado');
  };

  const handleLoadingClick = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const toggleDisabled = () => {
    setIsDisabled(!isDisabled);
  };

  return (
    <div className={styles.demoContainer}>
      <h2 className={styles.demoTitle}>🎨 Button Component - Demostración Completa</h2>
      
      {/* ============================================================================
          VARIANTES PRINCIPALES
          ============================================================================ */}
      
      <section className={styles.demoSection}>
        <h3 className={styles.sectionTitle}>Variantes Principales</h3>
        <div className={styles.buttonGrid}>
          <Button variant="primary" onClick={handleDemoClick}>
            Primary
          </Button>
          <Button variant="secondary" onClick={handleDemoClick}>
            Secondary
          </Button>
          <Button variant="ghost" onClick={handleDemoClick}>
            Ghost
          </Button>
          <Button variant="outline" onClick={handleDemoClick}>
            Outline
          </Button>
          <Button variant="text" onClick={handleDemoClick}>
            Text
          </Button>
          <Button variant="link" onClick={handleDemoClick}>
            Link
          </Button>
        </div>
      </section>

      {/* ============================================================================
          VARIANTES DE ESTADO
          ============================================================================ */}
      
      <section className={styles.demoSection}>
        <h3 className={styles.sectionTitle}>Variantes de Estado</h3>
        <div className={styles.buttonGrid}>
          <Button variant="success" onClick={handleDemoClick}>
            Success
          </Button>
          <Button variant="warning" onClick={handleDemoClick}>
            Warning
          </Button>
          <Button variant="danger" onClick={handleDemoClick}>
            Danger
          </Button>
        </div>
      </section>

      {/* ============================================================================
          TAMAÑOS
          ============================================================================ */}
      
      <section className={styles.demoSection}>
        <h3 className={styles.sectionTitle}>Tamaños</h3>
        <div className={styles.buttonGrid}>
          <Button size="xs" onClick={handleDemoClick}>
            Extra Small
          </Button>
          <Button size="sm" onClick={handleDemoClick}>
            Small
          </Button>
          <Button size="md" onClick={handleDemoClick}>
            Medium (Default)
          </Button>
          <Button size="lg" onClick={handleDemoClick}>
            Large
          </Button>
          <Button size="xl" onClick={handleDemoClick}>
            Extra Large
          </Button>
        </div>
      </section>

      {/* ============================================================================
          BOTONES CON ICONOS
          ============================================================================ */}
      
      <section className={styles.demoSection}>
        <h3 className={styles.sectionTitle}>Botones con Iconos</h3>
        <div className={styles.buttonGrid}>
          <Button icon="shopping_cart" onClick={handleDemoClick}>
            Carrito
          </Button>
          <Button icon="favorite" variant="outline" onClick={handleDemoClick}>
            Favorito
          </Button>
          <Button icon="delete" variant="danger" onClick={handleDemoClick}>
            Eliminar
          </Button>
          <Button icon="edit" variant="secondary" onClick={handleDemoClick}>
            Editar
          </Button>
          <Button icon="download" variant="success" onClick={handleDemoClick}>
            Descargar
          </Button>
          <Button icon="share" variant="ghost" onClick={handleDemoClick}>
            Compartir
          </Button>
        </div>
      </section>

      {/* ============================================================================
          ICONOS A LA DERECHA
          ============================================================================ */}
      
      <section className={styles.demoSection}>
        <h3 className={styles.sectionTitle}>Iconos a la Derecha</h3>
        <div className={styles.buttonGrid}>
          <Button icon="arrow_forward" iconPosition="right" onClick={handleDemoClick}>
            Continuar
          </Button>
          <Button icon="open_in_new" iconPosition="right" variant="outline" onClick={handleDemoClick}>
            Abrir
          </Button>
          <Button icon="send" iconPosition="right" variant="primary" onClick={handleDemoClick}>
            Enviar
          </Button>
        </div>
      </section>

      {/* ============================================================================
          ESTADOS ESPECIALES
          ============================================================================ */}
      
      <section className={styles.demoSection}>
        <h3 className={styles.sectionTitle}>Estados Especiales</h3>
        <div className={styles.buttonGrid}>
          <Button 
            loading={isLoading} 
            onClick={handleLoadingClick}
            variant="primary"
          >
            {isLoading ? 'Cargando...' : 'Click para Cargar'}
          </Button>
          <Button 
            disabled={isDisabled} 
            onClick={handleDemoClick}
            variant="secondary"
          >
            {isDisabled ? 'Deshabilitado' : 'Habilitado'}
          </Button>
          <Button 
            onClick={toggleDisabled}
            variant="outline"
          >
            {isDisabled ? 'Habilitar' : 'Deshabilitar'}
          </Button>
        </div>
      </section>

      {/* ============================================================================
          MODIFICADORES ESPECIALES
          ============================================================================ */}
      
      <section className={styles.demoSection}>
        <h3 className={styles.sectionTitle}>Modificadores Especiales</h3>
        <div className={styles.buttonGrid}>
          <Button fullWidth onClick={handleDemoClick}>
            Ancho Completo
          </Button>
          <Button rounded onClick={handleDemoClick}>
            Redondeado
          </Button>
          <Button elevated onClick={handleDemoClick}>
            Elevado
          </Button>
          <Button glass onClick={handleDemoClick}>
            Glassmorphism
          </Button>
        </div>
      </section>

      {/* ============================================================================
          BOTONES DE FORMULARIO
          ============================================================================ */}
      
      <section className={styles.demoSection}>
        <h3 className={styles.sectionTitle}>Botones de Formulario</h3>
        <div className={styles.buttonGrid}>
          <Button type="submit" variant="primary">
            Enviar
          </Button>
          <Button type="reset" variant="secondary">
            Resetear
          </Button>
          <Button type="button" variant="outline">
            Acción
          </Button>
        </div>
      </section>

      {/* ============================================================================
          BOTONES DE ENLACE
          ============================================================================ */}
      
      <section className={styles.demoSection}>
        <h3 className={styles.sectionTitle}>Botones de Enlace</h3>
        <div className={styles.buttonGrid}>
          <Button href="/productos" variant="primary">
            Ver Productos
          </Button>
          <Button href="/ofertas" variant="outline">
            Ver Ofertas
          </Button>
          <Button 
            href="https://github.com" 
            target="_blank" 
            variant="ghost"
          >
            GitHub (Externo)
          </Button>
        </div>
      </section>

      {/* ============================================================================
          COMBINACIONES AVANZADAS
          ============================================================================ */}
      
      <section className={styles.demoSection}>
        <h3 className={styles.sectionTitle}>Combinaciones Avanzadas</h3>
        <div className={styles.buttonGrid}>
          <Button 
            icon="star" 
            variant="warning" 
            size="lg" 
            elevated 
            rounded
            onClick={handleDemoClick}
          >
            Destacado
          </Button>
          <Button 
            icon="verified" 
            variant="success" 
            size="lg" 
            glass
            onClick={handleDemoClick}
          >
            Verificado
          </Button>
          <Button 
            icon="trending_up" 
            variant="primary" 
            size="xl" 
            fullWidth
            elevated
            onClick={handleDemoClick}
          >
            CTA Principal
          </Button>
        </div>
      </section>

      {/* ============================================================================
          INFORMACIÓN DEL COMPONENTE
          ============================================================================ */}
      
      <section className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>ℹ️ Información del Componente</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <h4>🎨 Variantes</h4>
            <p>9 variantes visuales diferentes</p>
          </div>
          <div className={styles.infoCard}>
            <h4>📏 Tamaños</h4>
            <p>5 tamaños predefinidos</p>
          </div>
          <div className={styles.infoCard}>
            <h4>🔧 Funcionalidades</h4>
            <p>Botones, enlaces y formularios</p>
          </div>
          <div className={styles.infoCard}>
            <h4>📱 Responsive</h4>
            <p>Adaptable a todos los dispositivos</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ButtonDemo;
