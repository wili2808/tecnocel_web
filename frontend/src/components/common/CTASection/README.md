# CTASection - Componente Call To Action

Componente optimizado de "Llamada a la Acción" diseñado para convertir visitantes en clientes mediante acciones específicas y directas.

## Descripción

Un **CTA (Call To Action)** es un elemento estratégico de diseño web que guía al usuario hacia una acción específica. Este componente incluye:

- Múltiples variantes visuales (primary, secondary, accent, gradient)
- Animaciones suaves y modernas
- Elementos decorativos flotantes
- Soporte completo para tema oscuro
- Diseño responsive mobile-first
- Accesibilidad WCAG 2.1
- Botón primario y secundario opcional
- Iconos personalizables
- Navegación interna con React Router

## Uso Básico

```tsx
import CTASection from '@/components/common/CTASection';

function HomePage() {
  return (
    <CTASection
      title="¿Listo para mejorar tu tecnología?"
      description="Contáctanos para una cotización personalizada"
      buttonText="Solicitar Cotización"
      buttonLink="/contacto"
    />
  );
}
```

## Props

### Requeridas

| Prop | Tipo | Descripción |
|------|------|-------------|
| `title` | `string` | Título principal del CTA |
| `description` | `string` | Descripción o subtítulo |
| `buttonText` | `string` | Texto del botón principal |
| `buttonLink` | `string` | Ruta o URL del botón |

### Opcionales

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'accent' \| 'gradient'` | `'primary'` | Variante visual del CTA |
| `icon` | `'arrow' \| 'cart' \| 'mail' \| 'phone' \| 'none'` | `'arrow'` | Icono del botón principal |
| `secondaryButtonText` | `string` | `undefined` | Texto del botón secundario |
| `secondaryButtonLink` | `string` | `undefined` | Ruta del botón secundario |
| `external` | `boolean` | `false` | Si el enlace es externo |
| `className` | `string` | `''` | Clases CSS adicionales |

## Variantes

### 1. Primary (Default)
Fondo degradado azul cielo suave, ideal para secciones estándar.

```tsx
<CTASection
  variant="primary"
  title="Título"
  description="Descripción"
  buttonText="Acción"
  buttonLink="/link"
/>
```

### 2. Secondary
Fondo degradado púrpura, para secciones alternativas.

```tsx
<CTASection
  variant="secondary"
  title="Título"
  description="Descripción"
  buttonText="Acción"
  buttonLink="/link"
/>
```

### 3. Accent
Fondo degradado cyan vibrante, para destacar ofertas.

```tsx
<CTASection
  variant="accent"
  title="¡Ofertas Especiales!"
  description="Aprovecha nuestros descuentos"
  buttonText="Ver Ofertas"
  buttonLink="/ofertas"
/>
```

### 4. Gradient (Recomendado)
Fondo con gradiente animado multicolor, máximo impacto visual.

```tsx
<CTASection
  variant="gradient"
  title="¿Listo para el siguiente paso?"
  description="Únete a miles de clientes satisfechos"
  buttonText="Comenzar Ahora"
  buttonLink="/registro"
  icon="arrow"
/>
```

## Iconos Disponibles

| Icono | Cuándo usar |
|-------|-------------|
| `arrow` | Navegación general, "siguiente paso" |
| `cart` | Agregar al carrito, comprar |
| `mail` | Contacto, suscripción, email |
| `phone` | Llamadas, soporte telefónico |
| `none` | Sin icono |

## Ejemplos de Uso

### CTA Simple

```tsx
<CTASection
  title="¿Necesitas ayuda?"
  description="Nuestro equipo está listo para atenderte"
  buttonText="Contactar"
  buttonLink="/contacto"
  icon="phone"
/>
```

### CTA con Dos Botones

```tsx
<CTASection
  title="Descubre nuestros productos"
  description="Tecnología de última generación a tu alcance"
  buttonText="Ver Catálogo"
  buttonLink="/catalogo"
  secondaryButtonText="Ofertas"
  secondaryButtonLink="/ofertas"
  variant="gradient"
  icon="cart"
/>
```

### CTA con Enlace Externo

```tsx
<CTASection
  title="Síguenos en redes sociales"
  description="Mantente al día con nuestras últimas novedades"
  buttonText="Seguir en Instagram"
  buttonLink="https://instagram.com/tecnocel"
  external={true}
  variant="accent"
  icon="none"
/>
```

### CTA para Newsletter

```tsx
<CTASection
  title="Recibe ofertas exclusivas"
  description="Suscríbete a nuestro boletín y recibe descuentos especiales"
  buttonText="Suscribirme"
  buttonLink="/newsletter"
  icon="mail"
  variant="secondary"
/>
```

## Características Visuales

### Animaciones

- **Entrada**: Fade-in con desplazamiento desde abajo
- **Título**: Fade-in desde arriba con delay
- **Descripción**: Fade-in desde arriba con delay mayor
- **Botones**: Fade-in desde abajo con delay
- **Círculos decorativos**: Animación de flotación continua
- **Hover en botón**: Efecto de brillo deslizante
- **Gradiente**: Animación de desplazamiento (variante gradient)

### Efectos de Hover

- Elevación del botón (translateY)
- Escala sutil (scale)
- Sombra expandida
- Icono se desplaza a la derecha
- Cambio de color suave

### Elementos Decorativos

Dos círculos con gradiente radial flotando en el fondo:
- Círculo 1: Superior derecha (azul cielo)
- Círculo 2: Inferior izquierda (cyan)

## Soporte de Tema Oscuro

El componente adapta automáticamente sus colores al tema oscuro:

- Fondo oscuro con gradiente zinc
- Bordes ajustados por variante
- Botones con colores optimizados
- Círculos decorativos con opacidad reducida

## Accesibilidad

- Etiquetas ARIA apropiadas
- Navegación por teclado completa
- Contraste de color AAA
- Soporte para `prefers-reduced-motion`
- Roles semánticos correctos
- Enlaces externos con `rel="noopener noreferrer"`

## Responsive

### Desktop (>768px)
- Padding: 96px vertical
- Título: 36px
- Descripción: 18px
- Botones: lado a lado

### Tablet (480px - 768px)
- Padding: 64px vertical
- Título: 30px
- Descripción: 16px
- Botones: lado a lado con wrap

### Mobile (<480px)
- Padding: 48px vertical
- Título: 24px
- Descripción: 14px
- Botones: apilados verticalmente
- Botones de ancho completo

## Personalización

### Clases CSS Personalizadas

```tsx
<CTASection
  title="Título"
  description="Descripción"
  buttonText="Acción"
  buttonLink="/link"
  className="mi-clase-custom"
/>
```

### Estilos Override

```css
/* En tu archivo CSS Module */
.miCTAPersonalizado :global(.ctaSection) {
  padding: 120px 0;
}

.miCTAPersonalizado :global(.title) {
  font-size: 48px;
}
```

## Mejores Prácticas

### DO (Hacer)

1. **Usar un CTA por página/sección**
   - Evita confundir al usuario con múltiples acciones

2. **Texto claro y accionable**
   ```tsx
   buttonText="Solicitar Cotización" //  Específico
   ```

3. **Ubicación estratégica**
   - Después de mostrar beneficios
   - Al final de secciones importantes

4. **Variante según contexto**
   - `gradient`: Máxima conversión
   - `primary`: Estándar profesional
   - `accent`: Ofertas/promociones

### DON'T (Evitar)

1. **Texto genérico**
   ```tsx
   buttonText="Clic aquí" //  Poco descriptivo
   ```

2. **Múltiples CTAs competiendo**
   ```tsx
   //  Evitar
   <CTASection ... />
   <CTASection ... />
   <CTASection ... />
   ```

3. **Descripciones muy largas**
   - Máximo 2 líneas
   - Ir al grano

## Métricas de Conversión

Para trackear el rendimiento:

```tsx
<CTASection
  title="Título"
  description="Descripción"
  buttonText="Acción"
  buttonLink="/link"
  className="cta-home-principal" // Para analytics
/>
```

Luego en Google Analytics:
```js
// Trackear clics en el CTA
gtag('event', 'cta_click', {
  'event_category': 'engagement',
  'event_label': 'home_principal'
});
```

## Psicología del CTA

### Elementos que mejoran conversión:

1. **Urgencia**: "Solo hoy", "Últimas unidades"
2. **Beneficio claro**: Qué gana el usuario
3. **Acción específica**: Qué va a pasar al hacer clic
4. **Contraste visual**: Destaca del resto
5. **Espacio en blanco**: No saturar alrededor

### Ejemplo optimizado:

```tsx
<CTASection
  variant="gradient"
  title="¡Última oportunidad!"
  description="50% OFF en toda la tienda. Solo por 24 horas."
  buttonText="Aprovechar Descuento"
  buttonLink="/ofertas"
  icon="cart"
  secondaryButtonText="Ver Términos"
  secondaryButtonLink="/terminos-oferta"
/>
```

## Historial de Cambios

### v2.0.0 (Actual)
- Múltiples variantes visuales
- Animaciones modernas
- Botón secundario opcional
- Iconos personalizables
- React Router Link integration
- Elementos decorativos
- Gradiente animado
- Documentación completa

### v1.0.0 (Anterior)
- CTA básico con un botón
- Estilos simples
- Responsive básico

## Licencia

Parte del proyecto TecnoCel Web - Uso interno

---

**Desarrollado con por el equipo de TecnoCel**