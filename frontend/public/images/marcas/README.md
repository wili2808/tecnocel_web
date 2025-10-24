# Directorio de Imágenes de Marcas

Este directorio contiene los logos de las marcas disponibles en el sistema.

## Instrucciones para agregar logos

### Nomenclatura de archivos
- Los nombres de archivo deben ser **exactamente iguales** al valor del campo `logo_marca` en la base de datos
- Usar **minúsculas** para todos los nombres
- No usar espacios ni caracteres especiales
- Extensiones permitidas: `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`

### Ejemplos de nombres correctos:
```
samsung.png
apple.png
lg.png
xiaomi.png
huawei.png
motorola.png
nokia.png
sony.png
```

### Especificaciones técnicas recomendadas:
- **Formato:** PNG con fondo transparente (preferido)
- **Tamaño:** 300x300px o 512x512px (relación 1:1)
- **Peso:** Máximo 100KB por logo
- **Resolución:** 72-150 DPI

### Cómo agregar un logo nuevo:

1. **Preparar la imagen:**
   - Asegúrate de que tenga fondo transparente
   - Redimensiona a 300x300px o 512x512px
   - Optimiza el tamaño del archivo (usa TinyPNG o similar)

2. **Nombrar el archivo:**
   - Usa el nombre de la marca en minúsculas
   - Ejemplo: para la marca "Samsung" → `samsung.png`

3. **Colocar en este directorio:**
   - Copia el archivo a `frontend/public/images/marcas/`

4. **Actualizar la base de datos:**
   ```sql
   UPDATE tb_marcas
   SET logo_marca = 'samsung.png'
   WHERE nombre_marca = 'Samsung';
   ```

### Notas importantes:
- Si el logo no existe, se mostrará automáticamente un placeholder
- Los logos se cargan de forma lazy (optimización de rendimiento)
- El componente BrandCard maneja errores de carga automáticamente
- Los logos son servidos directamente por Vite sin procesamiento adicional

### Estructura esperada:
```
frontend/public/images/marcas/
├── README.md          (este archivo)
├── samsung.png
├── apple.png
├── lg.png
├── xiaomi.png
└── [otras marcas].png
```

### Troubleshooting:
- **El logo no aparece:** Verifica que el nombre del archivo coincida exactamente con el valor en `logo_marca`
- **Logo borroso:** Asegúrate de usar una resolución mínima de 300x300px
- **Carga lenta:** Optimiza el tamaño del archivo (máx 100KB recomendado)
