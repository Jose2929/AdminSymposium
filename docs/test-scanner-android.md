# Guía de Testing para Scanner QR - Dispositivos Android

## 🧪 Plan de Pruebas para Android

Esta guía detalla las pruebas específicas para verificar el funcionamiento del scanner QR en dispositivos Android.

---

## 📋 Lista de Verificación Pre-Testing

### ✅ Requisitos del Dispositivo
- [ ] Dispositivo Android 7.0 o superior
- [ ] Chrome 88+ o Firefox 85+ instalado
- [ ] Cámara funcional verificada
- [ ] Conexión a internet estable
- [ ] Permisos de cámara habilitados/deshabilitados según el caso de prueba

### ✅ Preparación del Ambiente
- [ ] Navegador actualizado
- [ ] Otras aplicaciones de cámara cerradas
- [ ] Sitio web del scanner accesible

---

## 🧪 Casos de Prueba Específicos

### 1. **Prueba de Funcionalidad Básica**
**Objetivo**: Verificar que el scanner funciona correctamente

**Pasos**:
1. Abrir `pages/check-in.html` en Chrome Android
2. Hacer clic en "Iniciar Escáner"
3. Permitir permisos de cámara cuando se soliciten
4. Verificar que la cámara trasera se active
5. Escanear un código QR de prueba
6. Verificar que se muestra el resultado correctamente

**Resultado Esperado**: 
- ✅ Cámara se activa sin errores
- ✅ Se puede cambiar a cámara frontal
- ✅ Código QR se detecta correctamente
- ✅ Resultado se muestra con formato correcto

---

### 2. **Prueba de Cambio de Cámara**
**Objetivo**: Verificar funcionalidad de cambio entre cámaras

**Pasos**:
1. Iniciar escáner con cámara trasera (environment)
2. Hacer clic en "Cambiar a Frontal"
3. Verificar que la cámara frontal se activa
4. Hacer clic en "Cambiar a Trasera"
5. Verificar que vuelve a la cámara trasera

**Resultado Esperado**:
- ✅ Botón de cambio visible cuando hay múltiples cámaras
- ✅ Cambio de cámara funciona sin errores
- ✅ Información de cámara se actualiza correctamente
- ✅ Calidad de imagen es aceptable en ambas cámaras

---

### 3. **Prueba de Manejo de Errores - Sin Permisos**
**Objetivo**: Verificar manejo de errores cuando se deniegan permisos

**Pasos**:
1. Ir a Configuración Android > Apps > Chrome > Permisos
2. Denegar permiso de cámara
3. Abrir el scanner
4. Intentar iniciar cámara
5. Verificar mensaje de error y sugerencias

**Resultado Esperado**:
- ✅ Mensaje claro: "Permisos Denegados"
- ✅ Sugerencias específicas para Android incluidas
- ✅ Ruta de configuración mencionada: Configuración > Apps > Chrome > Permisos

---

### 4. **Prueba de Manejo de Errores - Cámara Ocupada**
**Objetivo**: Verificar cuando otra app usa la cámara

**Pasos**:
1. Abrir WhatsApp o Telegram
2. Iniciar videollamada (esto ocupa la cámara)
3. Abrir el scanner en otra ventana/tab
4. Intentar iniciar cámara
5. Verificar manejo de error

**Resultado Esperado**:
- ✅ Mensaje claro: "Cámara Ocupada"
- ✅ Sugerencias incluyen cerrar WhatsApp/Telegram
- ✅ Instrucciones específicas para Android

---

### 5. **Prueba de Múltiples Cámaras**
**Objetivo**: Verificar detección de múltiples cámaras

**Pasos**:
1. Iniciar scanner
2. Verificar información de cámara muestra cantidad correcta
3. Verificar botón de cambio está visible
4. Contar cámaras detectadas vs cámaras reales del dispositivo

**Resultado Esperado**:
- ✅ Detecta todas las cámaras disponibles (frontal + trasera)
- ✅ Información muestra "2 cámaras disponibles"
- ✅ Botón de cambio está visible

---

### 6. **Prueba de Resolución y Calidad**
**Objetivo**: Verificar configuración específica de Android

**Pasos**:
1. Iniciar scanner en Android
2. Verificar en DevTools la resolución de video (si es posible)
3. Escanear código QR desde diferentes distancias
4. Evaluar calidad de detección

**Resultado Esperado**:
- ✅ Resolución alrededor de 1280x720 (optimizada para Android)
- ✅ Detección funciona desde distancia normal (20-30cm)
- ✅ Performance aceptable (sin lag significativo)

---

### 7. **Prueba de Errores de Navegador**
**Objetivo**: Verificar compatibilidad con navegadores Android

**Navegadores a Probar**:
- [ ] Chrome (principal)
- [ ] Firefox
- [ ] Samsung Internet
- [ ] Opera

**Resultado Esperado**:
- ✅ Chrome: Funciona completamente
- ✅ Firefox: Funciona completamente  
- ✅ Otros navegadores: Funciona o muestra mensaje específico

---

## 🚨 Problemas Comunes en Android y Soluciones

### Problema: "Camera not supported"
**Causa**: Navegador antiguo o restricciones de seguridad
**Solución**: Actualizar Chrome o usar Firefox

### Problema: Permisos no persisten
**Causa**: Configuración de permisos de Android
**Solución**: Verificar Configuración > Apps > [Navegador] > Permisos > Cámara

### Problema: Cámara se ve volteada
**Causa**: Configuración de orientación en algunos dispositivos
**Solución**: Usar cámara trasera para mejor compatibilidad

### Problema: Performance lenta
**Causa**: Dispositivo de gama baja o múltiples apps abiertas
**Solución**: Cerrar otras apps, usar modo de bajo rendimiento

---

## 📊 Métricas de Testing

### Performance Esperado:
- **Tiempo de inicio**: < 3 segundos
- **Cambio de cámara**: < 1 segundo
- **Detección de QR**: < 2 segundos
- **Memoria RAM**: < 50MB adicional

### Compatibilidad:
- **Android 7-8**: Básico ✅
- **Android 9-11**: Completo ✅
- **Android 12+**: Completo ✅

---

## 🔍 Debugging en Android

### Habilitar DevTools:
1. Chrome Android > Configuración > Configuración de sitios web
2. Habilitar "Depuración remota"
3. Conectar a PC via USB y usar Chrome DevTools

### Logs Importantes:
```javascript
// Verificar en consola
console.log('Cámaras detectadas:', window.simpleQRScanner.availableCameras);
console.log('Cámara actual:', window.simpleQRScanner.currentCamera);
console.log('Es Android:', /Android/i.test(navigator.userAgent));
```

---

## ✅ Checklist Final de Testing

### Funcionalidad Core:
- [ ] Scanner inicia sin errores
- [ ] Cambio de cámara funciona
- [ ] Detección de QR funciona
- [ ] Manejo de errores es claro
- [ ] UI es responsive y usable

### Android Específico:
- [ ] Configuración de Android detectada
- [ ] Permisos de Android manejados
- [ ] Sugerencias específicas para Android
- [ ] Performance aceptable en dispositivos de gama baja

### Experiencia de Usuario:
- [ ] Mensajes de error son claros
- [ ] Botones son accesibles
- [ ] Información de cámara es útil
- [ ] Proceso de scanning es fluido

---

**Fecha de testing**: 2025-11-24  
**Dispositivos recomendados**: Samsung Galaxy A-series, Xiaomi Redmi, Huawei P-series  
**Versiones Android**: 8.1, 9.0, 10, 11, 12