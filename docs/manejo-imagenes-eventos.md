# Funcionalidad de Fotos de Ponentes en Eventos

## Descripción General

Se ha implementado un sistema simplificado de manejo de fotos de ponentes para la sección de eventos del panel de administración. Este sistema permite cargar, recortar y guardar fotos de ponentes en formato base64 con presentación circular.

## Funcionalidades Implementadas

### 1. Carga de Fotos de Ponentes
- **Campo de archivo**: Input tipo file que acepta imágenes (JPG, PNG, GIF)
- **Validación**: Verificación de tipo de archivo y tamaño máximo (5MB)
- **Vista previa circular**: Muestra la imagen cargada inmediatamente en formato circular
- **Notificaciones**: Mensajes de error y éxito para guiar al usuario

### 2. Editor Simplificado
- **Recorte básico**: Modal con cropper simple para recortar la foto
- **Aspectos predefinidos**: Libre, Circular (1:1), Retrato (3:4)
- **Zoom**: Control deslizable para ajustar el zoom del cropper
- **Vista previa circular**: Preview en tiempo real del resultado del recorte

### 3. Vista Previa en Tabla
- **Columna de foto**: Nueva columna "Foto" en la tabla de eventos
- **Imágenes circulares**: Las fotos se muestran en círculos pequeños (40px)
- **Placeholder**: Ícono de usuario cuando no hay foto cargada
- **Hover effects**: Efectos de interacción en las imágenes

### 4. Almacenamiento
- **Campo específico**: Se guarda en `imagenPonente` en Firebase
- **Formato base64**: Las imágenes se guardan en formato base64
- **Edición de eventos existentes**: Carga automáticamente la foto si existe
- **Eliminación**: Botón para remover foto y empezar de nuevo

## Estructura de Archivos Modificados

### 1. pages/admin-panel.html
- Agregado campo de carga de foto del ponente en el modal de eventos
- Agregados botones simples de edición (Recortar/Eliminar)
- Agregado modal simplificado de recorte (`cropImageModal`)
- Agregada columna "Foto" en la tabla de eventos
- Incluidas librerías Cropper.js

### 2. js/admin-panel.js
- Función `setupImageEventListeners()` simplificada
- Función `handleImageUpload()` para validar y cargar archivos
- Función `showImagePreview()` para mostrar vista previa circular
- Función `loadExistingImage()` para cargar foto existente
- Función `clearImagePreview()` para limpiar formulario
- Función `openCropModal()` y `applyCrop()` para recorte
- Función `renderEventos()` actualizada para mostrar fotos circulares
- Integración con saveEvento() para guardar en campo `imagenPonente`

### 3. styles/admin.css
- Estilos para imágenes circulares (`.ponente-image-circle`)
- Estilos para tabla (`.ponente-image-circle-table`)
- Estilos para placeholder (`.ponente-placeholder`)
- Estilos para contenedor de vista previa (`.ponente-image-container`)
- Responsive design para dispositivos móviles
- Animaciones y transiciones suaves

## Librerías Externas Utilizadas

### Cropper.js v1.6.1
- **CSS**: `https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css`
- **JS**: `https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js`
- **Propósito**: Cropper simplificado para recorte de fotos

## Flujo de Uso

### Para Crear Nuevo Evento con Foto de Ponente:
1. Abrir modal "Nuevo Evento"
2. Llenar datos básicos del evento
3. Hacer clic en "Seleccionar archivo" en el campo "Foto del Ponente"
4. Elegir imagen desde el dispositivo
5. La foto se muestra automáticamente en formato circular
6. Usar botón "Recortar" si necesita ajustar
7. Guardar evento (la foto se guarda en base64)

### Para Editar Evento Existente:
1. Hacer clic en botón "Editar" en la tabla de eventos
2. Los datos del evento se cargan automáticamente
3. Si tiene foto del ponente, se muestra automáticamente en círculo
4. Puede usar botón "Recortar" si necesita ajustar
5. Guardar cambios

### Vista Previa en Tabla:
- **Columna "Foto"**: Muestra foto circular del ponente
- **Si no hay foto**: Muestra ícono de usuario placeholder
- **Hover**: Las imágenes tienen efecto de zoom al pasar el mouse

## Validaciones Implementadas

### Validación de Archivos:
- Solo acepta archivos de imagen (`image/*`)
- Tamaño máximo: 5MB
- Notificaciones de error claras

### Validación de Formato:
- Conversión automática a base64 para almacenamiento
- Compresión JPEG con calidad 0.9 para optimizar tamaño

## Características de Presentación

### Vista Previa en Modal:
- **Tamaño**: 120px x 120px
- **Forma**: Círculo perfecto
- **Borde**: 4px blanco con sombra
- **Hover**: Efecto de escala (1.05x)

### Vista Previa en Tabla:
- **Tamaño**: 40px x 40px
- **Forma**: Círculo perfecto
- **Borde**: 2px blanco con sombra
- **Hover**: Efecto de escala (1.1x)

### Placeholder:
- **Tamaño**: 40px x 40px
- **Forma**: Círculo gris claro
- **Ícono**: FontAwesome user icon
- **Color**: Gris (#6c757d)

## Responsividad

El sistema es responsive:
- **Desktop**: Todas las funcionalidades disponibles, imágenes en tamaño completo
- **Tablet**: Controles adaptados al tamaño de pantalla
- **Móvil**: Imágenes más pequeñas (100px vista previa, 35px tabla)

## Almacenamiento en Firebase

Las fotos se almacenan como:
```javascript
{
  // ... otros campos del evento
  imagenPonente: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

## Características Técnicas

### Rendimiento:
- Compresión automática a 400x400px máximo
- Destrucción de cropper al cerrar modal para liberar memoria
- Optimizado para fotos de perfil (formato circular)

### Seguridad:
- Validación de tipos de archivo en cliente
- Limitación de tamaño de archivo
- Sanitización de datos antes de guardar

### Experiencia de Usuario:
- Feedback visual inmediato
- Presentación clara en formato circular
- Notificaciones informativas
- Controles simplificados e intuitivos

## Solución de Problemas

### Si la foto no se carga:
- Verificar que el archivo sea una imagen válida
- Comprobar que el tamaño sea menor a 5MB
- Verificar conexión a internet (para librerías CDN)

### Si el cropper no funciona:
- Verificar que Cropper.js se haya cargado correctamente
- Comprobar que la imagen tenga dimensiones válidas
- Asegurarse de que el modal esté completamente visible

### Si la foto no se muestra en la tabla:
- Verificar que el campo `imagenPonente` exista en Firebase
- Comprobar que la imagen base64 sea válida
- Refrescar la página para recargar datos