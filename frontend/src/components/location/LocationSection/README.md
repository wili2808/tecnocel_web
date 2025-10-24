# LocationSection - Componente de Ubicación y Contacto

Componente optimizado que muestra la ubicación de la empresa en un mapa interactivo junto con información de contacto y descripción de la empresa en un diseño moderno tipo grid.

## 📋 Descripción

**LocationSection** es un componente integral que combina:
- ✅ Mapa interactivo (OpenStreetMap)
- ✅ Información de la empresa (HistorySection)
- ✅ Datos de contacto con iconos
- ✅ Diseño grid responsivo
- ✅ Animaciones suaves
- ✅ Elementos decorativos
- ✅ Soporte completo para tema oscuro
- ✅ Accesibilidad WCAG 2.1
- ✅ Personalización total

## 🚀 Uso Básico

```tsx
import LocationSection from '@/components/location/LocationSection';

function HomePage() {
  return (
    <LocationSection />
  );
}
```

## 📖 Props

Todas las props son opcionales y tienen valores por defecto.

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `title` | `string` | `"Nuestra Ubicación"` | Título principal de la sección |
| `subtitle` | `string` | `"Visítanos y descubre..."` | Subtítulo de la sección |
| `coordinates` | `{ lat: number; lng: number }` | `{ lat: -27.4514, lng: -58.9867 }` | Coordenadas del mapa (Resistencia, Chaco) |
| `locationName` | `string` | `"TecnoCel - Resistencia, Chaco"` | Nombre para el marcador del mapa |
| `showContactInfo` | `boolean` | `true` | Mostrar información de contacto |
| `description` | `string` | `undefined` | Descripción personalizada (usa default si no se proporciona) |
| `className` | `string` | `''` | Clases CSS adicionales |

## 🎨 Ejemplos de Uso

### Uso por Defecto

```tsx
<LocationSection />
```

Esto muestra:
- Título: "Nuestra Ubicación"
- Subtítulo: "Visítanos y descubre nuestros productos"
- Mapa de Resistencia, Chaco
- Información completa de contacto

### Personalización Completa

```tsx
<LocationSection
  title="Encuéntranos en el Centro"
  subtitle="Estamos a pocos metros de la Plaza 25 de Mayo"
  coordinates={{
    lat: -27.4500,
    lng: -58.9800
  }}
  locationName="TecnoCel - Sucursal Centro"
  showContactInfo={true}
  description="Nuestra sucursal principal en el corazón de Resistencia, abierta desde 2010."
/>
```

### Sin Información de Contacto

```tsx
<LocationSection
  title="Punto de Retiro"
  subtitle="Retirá tus pedidos aquí"
  showContactInfo={false}
/>
```

### Múltiples Sucursales

```tsx
// Sucursal 1
<LocationSection
  title="Sucursal Centro"
  coordinates={{ lat: -27.4514, lng: -58.9867 }}
  locationName="TecnoCel Centro"
/>

// Sucursal 2
<LocationSection
  title="Sucursal Villa Don Andrés"
  coordinates={{ lat: -27.4650, lng: -58.9950 }}
  locationName="TecnoCel Villa Don Andrés"
/>
```

## 🗺️ Componente OpenStreetMap

El mapa usa **OpenStreetMap** con **Leaflet**, una solución 100% gratuita y open source.

### Características del Mapa:
- ✅ Sin costos ni límites de uso
- ✅ Zoom interactivo
- ✅ Marcador personalizable
- ✅ Popup con información
- ✅ Scroll wheel zoom
- ✅ Tema oscuro automático

### Obtener Coordenadas

Para encontrar coordenadas de cualquier ubicación:

1. **Google Maps**:
   - Busca la ubicación
   - Click derecho → "¿Qué hay aquí?"
   - Copia las coordenadas (lat, lng)

2. **OpenStreetMap**:
   - Busca la ubicación en https://www.openstreetmap.org/
   - Click derecho → "Mostrar dirección"
   - Copia las coordenadas

```tsx
// Ejemplo con coordenadas personalizadas
<LocationSection
  coordinates={{
    lat: -27.4514,  // Latitud
    lng: -58.9867   // Longitud
  }}
/>
```

## 📞 Información de Contacto

El componente `HistorySection` (incluido internamente) muestra 4 tarjetas de contacto:

1. **📍 Ubicación**: Ciudad y provincia
2. **📞 Teléfono**: Número de contacto
3. **🕐 Horarios**: Horario de atención
4. **✉️ Email**: Correo electrónico

### Personalizar Datos de Contacto

Actualmente los datos están hardcodeados en `HistorySection.tsx`. Para personalizarlos, edita:

```tsx
// HistorySection.tsx líneas 50-85

// Ubicación
<p>Resistencia, Chaco, Argentina</p>

// Teléfono
<p>+54 362 XXX-XXXX</p>

// Horarios
<p>Lun - Vie: 9:00 - 20:00</p>
<p>Sáb: 9:00 - 13:00</p>

// Email
<p>info@tecnocel.com</p>
```

## 🎭 Características Visuales

### Animaciones

- **Título/Subtítulo**: Fade-in desde arriba
- **Grid**: Fade-in desde abajo con delay
- **Mapa al hover**: Elevación y sombra expandida
- **Label del mapa**: Icono 📍 con animación bounce
- **Tarjetas de contacto**: Elevación al hover con rotación de icono
- **Círculos decorativos**: Animación de flotación continua

### Layout Grid

Desktop (>768px):
```
┌─────────────────────────────────────────────────┐
│              TÍTULO | SUBTÍTULO                 │
│                                                 │
│  ┌─────────────┐  ┌────────────────┐           │
│  │             │  │  TecnoCel      │           │
│  │    MAPA     │  │  Descripción   │           │
│  │             │  │                │           │
│  │             │  │  📍 📞 🕐 ✉️   │           │
│  └─────────────┘  └────────────────┘           │
│  📍 Ubicación                                   │
└─────────────────────────────────────────────────┘
```

Mobile (<768px):
```
┌───────────────────┐
│ TÍTULO | SUBTÍTULO│
│                   │
│  ┌─────────────┐  │
│  │    MAPA     │  │
│  └─────────────┘  │
│  📍 Ubicación     │
│                   │
│  ┌─────────────┐  │
│  │  TecnoCel   │  │
│  │ Descripción │  │
│  │ 📍 📞 🕐 ✉️ │  │
│  └─────────────┘  │
└───────────────────┘
```

### Efectos de Hover

**Mapa**:
- Elevación: `translateY(-4px)`
- Sombra aumentada
- Borde cambia a azul cielo

**Label del mapa**:
- Desplazamiento: `translateX(4px)`
- Borde resalta

**Tarjetas de contacto**:
- Elevación: `translateY(-4px)`
- Icono: `scale(1.1)` + `rotate(5deg)`
- Sombra aumentada

## 🌗 Soporte de Tema Oscuro

El componente adapta automáticamente sus colores:

- Fondo oscuro (zinc-950)
- Bordes zinc-700
- Título con gradiente más claro
- Círculos decorativos con menor opacidad
- Tarjetas con fondo zinc-900

## ♿ Accesibilidad

- ✅ `aria-labelledby` en la sección
- ✅ `aria-hidden` en elementos decorativos
- ✅ Navegación por teclado completa
- ✅ Contraste de color AAA
- ✅ Soporte para `prefers-reduced-motion`
- ✅ Roles semánticos correctos
- ✅ Textos alternativos en iconos

## 📐 Responsive

### Desktop (>1024px)
- Grid 2 columnas (50/50)
- Mapa: 500px altura
- Gap: 48px

### Tablet (768px - 1024px)
- Grid 2 columnas con gap reducido
- Mapa: 400px altura
- Gap: 32px

### Tablet Small (<768px)
- Grid 1 columna
- Mapa: 350px altura
- Gap: 24px

### Mobile (<480px)
- Grid 1 columna
- Mapa: 300px altura
- Label y padding reducidos
- Gap: 16px

## 🔧 Personalización Avanzada

### Cambiar Color del Mapa en Tema Oscuro

```css
/* OpenStreetMap.module.css */
:global([data-theme="dark"]) .map {
  filter: invert(90%) hue-rotate(180deg);
}
```

### Cambiar Altura del Mapa

```tsx
// Opción 1: Via CSS personalizado
<LocationSection className="mi-ubicacion-custom" />

// mi-ubicacion-custom.module.css
.mi-ubicacion-custom :global(.mapContainer) {
  height: 600px;
}

// Opción 2: Editar LocationSection.module.css
.mapContainer {
  height: 600px; /* Cambiar desde 500px */
}
```

### Cambiar Iconos de Contacto

Edita `HistorySection.tsx` líneas 2-3:

```tsx
import { FiMapPin, FiPhone, FiClock, FiMail } from 'react-icons/fi';

// Cambiar por otros iconos de react-icons:
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';
```

### Agregar Más Tarjetas de Contacto

Edita `HistorySection.tsx` líneas 45-86:

```tsx
<div className={styles.contactItem}>
  <div className={styles.iconWrapper}>
    <FaWhatsapp className={styles.icon} />
  </div>
  <div className={styles.contactText}>
    <h3>WhatsApp</h3>
    <p>+54 362 XXX-XXXX</p>
  </div>
</div>
```

## 🎯 Integración con Google Maps (Opcional)

Si prefieres usar Google Maps en lugar de OpenStreetMap:

1. Obtén una API key de Google Maps
2. Agrega `VITE_GOOGLE_MAPS_API_KEY` al `.env`
3. Reemplaza `OpenStreetMap` por `GoogleMap` en `LocationSection.tsx`

```tsx
// En lugar de:
import OpenStreetMap from '../OpenStreetMap/OpenStreetMap';

// Usa:
import GoogleMap from '../GoogleMap/GoogleMap';
```

**Nota**: Google Maps tiene límites de uso y cuesta después de $200 USD/mes gratis.

## 💡 Mejores Prácticas

### ✅ DO (Hacer)

1. **Verificar coordenadas precisas**
   ```tsx
   // ✅ Coordenadas precisas de tu ubicación real
   coordinates={{ lat: -27.4514, lng: -58.9867 }}
   ```

2. **Nombre descriptivo en el marcador**
   ```tsx
   // ✅ Incluye nombre del negocio y ciudad
   locationName="TecnoCel - Resistencia, Chaco"
   ```

3. **Actualizar datos de contacto reales**
   - Teléfono funcional
   - Email activo
   - Horarios correctos

4. **Probar en móvil**
   - Verificar que el mapa sea interactivo
   - Zoom funcional
   - Tamaño adecuado

### ❌ DON'T (Evitar)

1. **Coordenadas incorrectas**
   ```tsx
   // ❌ No uses coordenadas aproximadas o inventadas
   coordinates={{ lat: 0, lng: 0 }}
   ```

2. **Información desactualizada**
   ```tsx
   // ❌ No dejes horarios incorrectos
   <p>Lun - Dom: 24 horas</p> // Si no es verdad
   ```

3. **Múltiples mapas en una página**
   ```tsx
   // ❌ Evitar múltiples mapas (afecta rendimiento)
   <LocationSection />
   <LocationSection />
   <LocationSection />
   ```

## 📊 Estructura de Archivos

```
location/
├── LocationSection/
│   ├── LocationSection.tsx        ← Componente principal
│   ├── LocationSection.module.css ← Estilos del grid y layout
│   ├── index.ts                   ← Export
│   └── README.md                  ← Esta documentación
│
├── HistorySection/
│   ├── HistorySection.tsx         ← Info de empresa y contacto
│   ├── HistorySection.module.css  ← Estilos de tarjetas
│   └── index.ts
│
└── OpenStreetMap/
    ├── OpenStreetMap.tsx          ← Componente del mapa
    ├── OpenStreetMap.module.css   ← Estilos del mapa
    └── index.ts
```

## 🔄 Historial de Cambios

### v2.0.0 (Actual)
- ✅ Rediseño completo con grid layout
- ✅ Props personalizables
- ✅ HistorySection con información de contacto
- ✅ Animaciones modernas
- ✅ Elementos decorativos
- ✅ OpenStreetMap (gratuito)
- ✅ Tema oscuro completo
- ✅ Responsive mejorado
- ✅ Accesibilidad AAA
- ✅ Documentación JSDoc
- ✅ README completo

### v1.0.0 (Anterior)
- ✅ Layout básico
- ✅ Mapa simple
- ✅ Información estática

## 🚀 Ejemplos Reales

### E-commerce (TecnoCel)

```tsx
<LocationSection
  title="Nuestra Tienda"
  subtitle="Visitanos y conocé todos nuestros productos"
  coordinates={{ lat: -27.4514, lng: -58.9867 }}
  locationName="TecnoCel - Resistencia, Chaco"
  showContactInfo={true}
/>
```

### Restaurante

```tsx
<LocationSection
  title="¿Dónde Encontrarnos?"
  subtitle="Te esperamos en el centro de la ciudad"
  coordinates={{ lat: -27.4514, lng: -58.9867 }}
  locationName="Restaurante Los Sabores - Centro"
  description="Comida casera desde 1995. Especialidad en parrilla y pastas."
/>
```

### Oficina

```tsx
<LocationSection
  title="Nuestras Oficinas"
  subtitle="Agenda tu cita previa"
  coordinates={{ lat: -27.4514, lng: -58.9867 }}
  locationName="Estudio Contable - Resistencia"
  showContactInfo={true}
/>
```

### Punto de Retiro

```tsx
<LocationSection
  title="Punto de Retiro"
  subtitle="Retirá tus compras online aquí"
  coordinates={{ lat: -27.4514, lng: -58.9867 }}
  locationName="Punto de Retiro TecnoCel"
  showContactInfo={false}
  description="Horario de retiro: Lunes a Viernes 10:00 - 18:00hs"
/>
```

## 📱 Testing

Para probar el componente:

```bash
cd frontend
npm run dev
```

Navega a: **http://localhost:5173/**

El LocationSection aparecerá al final de la home después del CTASection.

### Checklist de Testing

- [ ] Mapa se carga correctamente
- [ ] Marcador aparece en ubicación correcta
- [ ] Zoom funciona (scroll + botones)
- [ ] Popup del marcador muestra info
- [ ] Información de contacto es correcta
- [ ] Responsive funciona (mobile/tablet/desktop)
- [ ] Animaciones se reproducen
- [ ] Tema oscuro funciona
- [ ] Hover effects funcionan
- [ ] Accesibilidad con teclado OK

## 🆘 Troubleshooting

### El mapa no se carga

**Problema**: Pantalla blanca o error en consola

**Solución**:
```bash
# Verificar que leaflet esté instalado
npm list react-leaflet leaflet

# Si no está:
npm install react-leaflet@^4.2.1 leaflet @types/leaflet
```

### Coordenadas incorrectas

**Problema**: El marcador aparece en lugar equivocado

**Solución**:
- Verifica latitud/longitud en Google Maps
- Formato: `{ lat: -27.4514, lng: -58.9867 }`
- Nota: latitud negativa para sur, longitud negativa para oeste

### Tema oscuro no funciona en el mapa

**Problema**: El mapa no invierte colores

**Solución**:
Verifica en `OpenStreetMap.module.css` líneas 27-34:

```css
:global([data-theme="dark"]) .map {
  filter: invert(90%) hue-rotate(180deg);
}
```

### Animaciones no funcionan

**Problema**: Todo aparece sin animación

**Solución**:
- Usuario puede tener `prefers-reduced-motion` activado
- Esto es correcto y respeta preferencias de accesibilidad
- Las animaciones se desactivan automáticamente

## 📄 Licencia

Parte del proyecto TecnoCel Web - Uso interno

---

**Desarrollado con ❤️ por el equipo de TecnoCel**
