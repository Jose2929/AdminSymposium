# Ejemplos de Códigos QR para Pruebas del Sistema de Check-in

## Códigos QR Válidos para Educational Symposium 2025

### 1. Gafete de Conferenciante Principal
```json
{
  "evento": "Educational Symposium 2025",
  "participante": "Dra. María Elena Rodríguez",
  "codigo": "EDU2025-0847",
  "institucion": "Universidad Nacional Autónoma de México",
  "fecha": "2025-11-30",
  "tipo": "Conferenciante Principal"
}
```

### 2. Gafete de Participante Regular
```json
{
  "evento": "Educational Symposium 2025",
  "participante": "Dr. Carlos Mendoza",
  "codigo": "EDU2025-0234",
  "institucion": "Instituto Tecnológico de Monterrey",
  "fecha": "2025-11-30",
  "tipo": "Participante"
}
```

### 3. Gafete de Estudiante
```json
{
  "evento": "Educational Symposium 2025",
  "participante": "Ana García",
  "codigo": "EDU2025-1567",
  "institucion": "Universidad Iberoamericana",
  "fecha": "2025-11-30",
  "tipo": "Estudiante"
}
```

### 4. Código de Texto Plano Válido
```
EDU2025-0934-MARIA-RODRIGUEZ
```

## Códigos QR Inválidos para Pruebas

### 1. Código de Otro Evento
```json
{
  "evento": "Innovation Conference 2025",
  "participante": "Dr. Carlos Mendoza",
  "codigo": "INN2025-0847"
}
```

### 2. Código Sin Prefijo Válido
```json
{
  "evento": "Educational Symposium 2025",
  "participante": "Dr. Carlos Mendoza",
  "codigo": "INVALID2025-0847"
}
```

### 3. Texto Plano Sin Prefijo
```
INVALID-CODE-WITHOUT-PREFIX
```

### 4. Código Muy Corto
```
EDU2025
```

### 5. Código Sin Números
```
EDU-VALID-BUT-WITHOUT-NUMBERS
```

### 6. Gafete de Evento Futuro
```json
{
  "evento": "Educational Symposium 2026",
  "participante": "Dr. Carlos Mendoza",
  "codigo": "EDU2026-0847",
  "fecha": "2026-11-30"
}
```

### 7. Datos Incompletos
```json
{
  "evento": "Educational Symposium 2025",
  "participante": "Dr. Carlos Mendoza"
  // Falta el campo "codigo"
}
```

### 8. Texto Plano Inválido
```
abcdefghijklmnopqrstuvwxyz
```

## Instrucciones para las Pruebas

### Cómo Generar Códigos QR:
1. Copia el texto de cualquiera de los ejemplos anteriores
2. Usa cualquier generador de códigos QR en línea (ej: qr-code-generator.com)
3. Escanea el código con el sistema de check-in

### Comportamiento Esperado:

#### Códigos Válidos:
- ✅ Sonido de éxito
- ✅ Mensaje "Gafete Válido"
- ✅ Se actualiza el contador de válidos
- ✅ Aparece en el historial reciente
- ✅ Auto-ocultado del resultado después de 5 segundos

#### Códigos Inválidos:
- ❌ Sonido de error
- ❌ Mensaje "Gafete Inválido" con razón específica
- ❌ Se actualiza el contador de inválidos
- ❌ Aparece en el historial reciente con indicador de error

### Características del Sistema:

1. **Validación Automática**: El sistema valida automáticamente:
   - Formato del código (debe comenzar con "EDU2025-")
   - Evento correcto (debe ser "Educational Symposium 2025")
   - Campos requeridos (evento, participante, codigo)
   - Fecha del evento (no puede ser futura)

2. **Interfaz Visual**:
   - Estadísticas en tiempo real
   - Historial de escaneos recientes
   - Indicadores visuales de estado
   - Auto-ocultado para mayor eficiencia

3. **Feedback Auditivo**:
   - Tono de confirmación para códigos válidos
   - Tono de error para códigos inválidos

4. **Persistencia**:
   - Las estadísticas se mantienen durante la sesión
   - Historial de escaneos recientes visible

## Notas de Implementación

- El sistema utiliza la librería qr-scanner desde CDN
- Requiere permisos de cámara para funcionar
- Compatible con navegadores modernos
- Diseño responsive para diferentes dispositivos
- Manejo robusto de errores y estados de cámara