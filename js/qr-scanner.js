/**
 * Escáner QR Simplificado con jsQR
 * Educational Symposium 2025
 * 
 * FUNCIONALIDAD SIMPLIFICADA:
 * - Solo escanear códigos QR
 * - Mostrar el contenido leído
 * - Preparar para acción posterior del usuario
 * - Redirección configurable
 */

// ========================================
// CONFIGURACIÓN
// ========================================

// URL para redirección (CONFIGURABLE POR EL USUARIO)
const REDIRECT_URL = 'index.html'; // Cambia esta URL según necesites

// ========================================
// CLASE PRINCIPAL DEL ESCÁNER
// ========================================

class SimpleQRScanner {
    constructor() {
        this.isScanning = false;
        this.video = null;
        this.canvas = null;
        this.canvasContext = null;
        this.stream = null;
        this.scanInterval = null;
        
        // Control de cámaras
        this.currentCamera = 'environment'; // 'environment' (trasera) o 'user' (frontal)
        this.availableCameras = [];
        this.cameraDeviceId = null;
        
        // Referencias a elementos DOM
        this.elements = {
            startBtn: document.getElementById('start-scanner-btn'),
            stopBtn: document.getElementById('stop-scanner-btn'),
            switchCameraBtn: document.getElementById('switch-camera-btn'),
            cameraContainer: document.getElementById('camera-container'),
            scanResultContainer: document.getElementById('scan-result-container'),
            errorContainer: document.getElementById('error-container'),
            video: document.getElementById('qr-video'),
            cameraStatus: document.getElementById('camera-status'),
            cameraInfo: document.getElementById('camera-info'),
            resultTitle: document.getElementById('result-title'),
            resultMessage: document.getElementById('result-message'),
            resultDetails: document.getElementById('result-details'),
            resultIcon: document.getElementById('result-icon'),
            clearResultBtn: document.getElementById('clear-result-btn'),
            dismissErrorBtn: document.getElementById('dismiss-error-btn')
        };
        
        this.init();
    }

    /**
     * Inicializar el escáner
     */
    init() {
        console.log('Inicializando Escáner QR Simplificado...');
        
        // Verificar soporte del navegador
        if (!this.checkBrowserSupport()) {
            this.showError('Navegador no compatible', 'Tu navegador no soporta las funciones necesarias para el escáner QR.');
            return;
        }
        
        this.setupEventListeners();
        console.log('Escáner QR Simplificado inicializado correctamente');
    }

    /**
     * Verificar soporte del navegador
     */
    checkBrowserSupport() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * Detectar dispositivos de cámara disponibles
     */
    async detectCameras() {
        try {
            // Obtener lista de dispositivos de cámara
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableCameras = devices.filter(device => device.kind === 'videoinput');
            
            console.log('Cámaras detectadas:', this.availableCameras.length);
            this.availableCameras.forEach((camera, index) => {
                console.log(`Cámara ${index + 1}: ${camera.label || 'Sin nombre'}`);
            });
            
            return this.availableCameras;
        } catch (error) {
            console.warn('No se pudieron detectar las cámaras:', error);
            return [];
        }
    }

    /**
     * Obtener configuración de cámara optimizada para Android
     */
    getCameraConstraints() {
        const isAndroid = /Android/i.test(navigator.userAgent);
        const constraints = {
            video: {
                facingMode: this.currentCamera,
                width: { ideal: isAndroid ? 1280 : 1920 },
                height: { ideal: isAndroid ? 720 : 1080 },
                aspectRatio: { ideal: 16/9 }
            },
            audio: false
        };

        // Si tenemos un deviceId específico, usarlo
        if (this.cameraDeviceId) {
            constraints.video.deviceId = { exact: this.cameraDeviceId };
        }

        return constraints;
    }

    /**
     * Cambiar entre cámara frontal y trasera
     */
    async switchCamera() {
        if (!this.isScanning) {
            this.showError('Error de Cámara', 'Debe estar escaneando para cambiar de cámara');
            return;
        }

        try {
            console.log('Cambiando cámara...');
            this.updateScannerStatus('Cambiando cámara...');
            
            // Detener cámara actual
            this.stopCamera();
            
            // Cambiar modo de cámara
            this.currentCamera = this.currentCamera === 'environment' ? 'user' : 'environment';
            
            // Iniciar nueva cámara
            setTimeout(() => {
                this.startCamera();
            }, 500); // Pequeña pausa para evitar conflictos
            
        } catch (error) {
            console.error('Error al cambiar cámara:', error);
            this.handleCameraError(error);
        }
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botón de inicio
        this.elements.startBtn?.addEventListener('click', () => this.startCamera());
        
        // Botón de detener
        this.elements.stopBtn?.addEventListener('click', () => this.stopCamera());
        
        // Botón de cambio de cámara
        this.elements.switchCameraBtn?.addEventListener('click', () => this.switchCamera());
        
        // Botón de limpiar resultado
        this.elements.clearResultBtn?.addEventListener('click', () => this.clearResult());
        
        // Botón de cerrar error
        this.elements.dismissErrorBtn?.addEventListener('click', () => this.hideError());
        
        // Evento de tecla Escape para cerrar escáner
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isScanning) {
                this.stopCamera();
            }
        });
        
        // Eventos de visibilidad de página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isScanning) {
                this.stopCamera();
            }
        });
    }

    /**
     * Iniciar cámara
     */
    async startCamera() {
        console.log('Iniciando cámara...');
        
        try {
            this.updateScannerStatus('Solicitando permisos de cámara...');
            this.showCameraContainer();
            this.updateStartButton(false);
            
            // Detectar cámaras disponibles
            await this.detectCameras();
            
            // Obtener configuración optimizada
            const constraints = this.getCameraConstraints();
            
            // Solicitar acceso a la cámara
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Configurar video
            this.video = this.elements.video;
            this.video.srcObject = this.stream;
            
            // Esperar a que el video esté listo
            await new Promise((resolve, reject) => {
                this.video.onloadedmetadata = resolve;
                this.video.onerror = reject;
            });
            
            // Crear canvas para procesar imagen
            this.canvas = document.createElement('canvas');
            this.canvasContext = this.canvas.getContext('2d', { willReadFrequently: true });
            
            // Configurar dimensiones del canvas
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            this.isScanning = true;
            this.updateStartButton(true);
            this.updateCameraButton();
            this.updateCameraInfo();
            this.updateScannerStatus('Cámara activa - Apunta al código QR');
            
            // Iniciar escaneo continuo
            this.startScanning();
            
            console.log('Cámara iniciada correctamente');
            
        } catch (error) {
            console.error('Error al iniciar cámara:', error);
            this.handleCameraError(error);
        }
    }

    /**
     * Iniciar escaneo continuo
     */
    startScanning() {
        console.log('Iniciando escaneo QR...');
        
        this.scanInterval = setInterval(() => {
            if (!this.isScanning) return;
            
            try {
                // Dibujar frame actual del video en el canvas
                this.canvasContext.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                
                // Obtener datos de imagen
                const imageData = this.canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height);
                
                // Usar jsQR para escanear
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    console.log('Código QR detectado:', code.data);
                    this.onQRCodeDetected(code.data);
                }
                
            } catch (error) {
                console.warn('Error durante escaneo:', error);
            }
        }, 100); // Escanear cada 100ms
    }

    /**
     * Manejar detección de código QR
     */
    onQRCodeDetected(data) {
        console.log('Código QR detectado:', data);
        
        if (!this.isScanning) return;
        
        // Detener escáner
        this.stopCamera();
        
        // Mostrar resultado
        this.showResult(data);
        
        // Ejecutar acción posterior del usuario
        this.executeCustomAction(data);
    }

    /**
     * Mostrar resultado del escaneo
     */
    showResult(qrData) {
        // Actualizar interfaz
        this.elements.resultTitle.textContent = '✅ Código QR Detectado';
        this.elements.resultMessage.textContent = 'El código ha sido leído exitosamente';
        
        // Mostrar contenido del QR
        this.elements.resultDetails.innerHTML = `
            <div class="details-grid">
                <div class="detail-item">
                    <span class="detail-key">Contenido:</span>
                    <span class="detail-value">${this.escapeHtml(qrData)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-key">Fecha:</span>
                    <span class="detail-value">${new Date().toLocaleString('es-ES')}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-key">Longitud:</span>
                    <span class="detail-value">${qrData.length} caracteres</span>
                </div>
            </div>
        `;
        
        // Cambiar icono a éxito
        this.elements.resultIcon.className = 'fas fa-check-circle';
        
        // Mostrar contenedor de resultado
        this.showResultContainer();
        this.hideCameraContainer();
        this.updateStartButton(true);
    }

    /**
     * Detener cámara
     */
    stopCamera() {
        console.log('Deteniendo cámara...');
        
        this.isScanning = false;
        
        // Limpiar interval de escaneo
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        
        // Detener stream de cámara
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Limpiar video
        if (this.video) {
            this.video.srcObject = null;
        }
        
        this.hideCameraContainer();
        this.updateStartButton(true);
        this.updateCameraButton();
        this.updateScannerStatus('Escáner detenido');
        
        console.log('Cámara detenida');
    }

    /**
     * Limpiar resultado actual
     */
    clearResult() {
        this.hideResultContainer();
        this.updateScannerStatus('Listo para escanear');
    }

    /**
     * Ejecutar acción posterior del usuario
     * 
     * IMPORTANTE: El usuario puede definir aquí su lógica personalizada
     */
    executeCustomAction(qrData) {
        console.log('Ejecutando acción personalizada con datos:', qrData);
        
        // ========================================
        // SECCIÓN PERSONALIZABLE POR EL USUARIO
        // ========================================
        
        // Ejemplo 1: Log en consola (ya está funcionando)
        console.log('QR Data procesada:', qrData);
        
        // Ejemplo 2: Validar si es JSON y procesarlo
        try {
            const jsonData = JSON.parse(qrData);
            console.log('Datos JSON válidos:', jsonData);
            // Aquí puedes agregar tu lógica para datos JSON
        } catch (e) {
            console.log('Datos de texto plano:', qrData);
            // Aquí puedes agregar tu lógica para texto plano
        }
        
        // Ejemplo 3: Guardar en localStorage
        try {
            localStorage.setItem('ultimo_qr_scanneado', qrData);
            localStorage.setItem('ultimo_qr_timestamp', new Date().toISOString());
        } catch (e) {
            console.warn('No se pudo guardar en localStorage:', e);
        }
        
        // Ejemplo 4: Enviar a servidor (descomenta y configura según necesites)
        /*
        this.sendToServer(qrData);
        */
        
        // Ejemplo 5: Redirección simple (ya está configurada abajo)
        this.redirectToPage(qrData);
        
        // ========================================
        // FIN DE SECCIÓN PERSONALIZABLE
        // ========================================
    }

    /**
     * Enviar datos al servidor
     * 
     * DESCOMENTA Y CONFIGURA ESTA FUNCIÓN SI NECESITAS ENVIAR DATOS AL SERVIDOR
     */
    /*
    async sendToServer(qrData) {
        try {
            const response = await fetch('/api/qr-scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: qrData,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent
                })
            });
            
            if (response.ok) {
                console.log('Datos enviados al servidor exitosamente');
            } else {
                console.error('Error al enviar datos al servidor:', response.statusText);
            }
        } catch (error) {
            console.error('Error de red al enviar datos:', error);
        }
    }
    */

    /**
     * Redirección simple
     * 
     * REDIRECCIONA A LA PÁGINA CONFIGURADA EN REDIRECT_URL
     */
    redirectToPage(qrData) {
        console.log(`Redirigiendo a: ${REDIRECT_URL}`);
        
        // Ejemplo de cómo pasar datos por URL si es necesario
        const url = new URL(window.location.origin + '/' + REDIRECT_URL);
        // url.searchParams.set('qr_data', encodeURIComponent(qrData)); // Descomenta si necesitas pasar datos
        
        // Redirección simple
        setTimeout(() => {
            window.location.href = url.toString();
        }, 2000); // Esperar 2 segundos para mostrar el resultado
    }

    /**
     * Manejar errores de cámara con soporte específico para Android
     */
    handleCameraError(error) {
        console.error('Error de cámara:', error);
        
        let title = 'Error del Sistema';
        let message = 'Ocurrió un error inesperado';
        let suggestions = [];
        
        // Detectar si es Android
        const isAndroid = /Android/i.test(navigator.userAgent);
        const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        switch (error.name) {
            case 'NotAllowedError':
                title = 'Permisos Denegados';
                message = 'Se requieren permisos de cámara para usar el escáner QR.';
                suggestions = [
                    'Haz clic en el ícono de cámara en la barra de direcciones',
                    'Selecciona "Permitir" para la cámara',
                    'Recarga la página después de otorgar permisos'
                ];
                if (isMobile) {
                    suggestions.push('En Android: Configuración > Aplicaciones > Navegador > Permisos > Cámara');
                }
                break;
                
            case 'NotFoundError':
                title = 'Cámara No Disponible';
                message = 'No se encontró ninguna cámara en el dispositivo.';
                if (isMobile) {
                    suggestions = [
                        'Verifica que el dispositivo tenga cámara',
                        'Cierra otras aplicaciones que puedan estar usando la cámara',
                        'Reinicia la aplicación del navegador'
                    ];
                } else {
                    suggestions = [
                        'Conecta una cámara USB si usas computadora de escritorio',
                        'Verifica que la cámara esté funcionando en otras aplicaciones'
                    ];
                }
                break;
                
            case 'NotReadableError':
                title = 'Cámara Ocupada';
                message = 'La cámara está siendo usada por otra aplicación.';
                suggestions = [
                    'Cierra WhatsApp, Telegram u otras apps de video llamada',
                    'Cierra otras pestañas del navegador que usen cámara',
                    'Reinicia el navegador',
                    'Reinicia el dispositivo si el problema persiste'
                ];
                break;
                
            case 'OverconstrainedError':
                title = 'Configuración de Cámara';
                message = 'La cámara no soporta la resolución requerida.';
                suggestions = [
                    'Intenta con resolución más baja',
                    'Usa la cámara trasera para mejor calidad',
                    'Cierra otras aplicaciones que consuman recursos'
                ];
                break;
                
            case 'NotSupportedError':
                title = 'Navegador No Compatible';
                message = 'Tu navegador no soporta el acceso a la cámara.';
                suggestions = [
                    'Usa Chrome, Firefox o Safari actualizados',
                    'En Android usa Chrome o Firefox',
                    'En iOS usa Safari o Chrome'
                ];
                break;
                
            case 'AbortError':
                title = 'Operación Cancelada';
                message = 'El acceso a la cámara fue cancelado.';
                suggestions = [
                    'Intenta nuevamente',
                    'Verifica que no haya ventanas de confirmación bloqueadas'
                ];
                break;
                
            default:
                title = 'Error de Cámara';
                message = `Error desconocido: ${error.message || error.name}`;
                suggestions = [
                    'Recarga la página',
                    'Reinicia el navegador',
                    'Verifica que la cámara funcione en otras aplicaciones'
                ];
        }
        
        // Agregar información específica de Android
        if (isAndroid) {
            message += ' [Android detectado]';
        } else if (isMobile && !isAndroid) {
            message += ' [Dispositivo móvil detectado]';
        }
        
        // Crear mensaje con sugerencias
        let fullMessage = message;
        if (suggestions.length > 0) {
            fullMessage += '\n\nSoluciones sugeridas:\n• ' + suggestions.join('\n• ');
        }
        
        this.showError(title, fullMessage);
        this.stopCamera();
        
        // Log adicional para debugging
        console.log('Contexto del error:', {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            deviceMemory: navigator.deviceMemory,
            connectionType: navigator.connection?.effectiveType,
            isAndroid,
            isMobile,
            error: error
        });
    }

    /**
     * Actualizar estado del escáner
     */
    updateScannerStatus(message) {
        if (this.elements.cameraStatus) {
            this.elements.cameraStatus.textContent = message;
        }
    }

    /**
     * Actualizar botón de cambio de cámara
     */
    updateCameraButton() {
        if (this.elements.switchCameraBtn) {
            const isFrontCamera = this.currentCamera === 'user';
            const icon = isFrontCamera ? 'fa-camera' : 'fa-camera-retro';
            const text = isFrontCamera ? 'Frontal' : 'Trasera';
            
            this.elements.switchCameraBtn.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>Cambiar a ${text}</span>
            `;
            
            // Mostrar botón si hay cámaras disponibles O si ya estamos escaneando
            // Esto asegura que el botón aparezca inmediatamente cuando se inicia el scanner
            const shouldShowButton = this.availableCameras.length > 1 || this.isScanning;
            this.elements.switchCameraBtn.style.display = shouldShowButton ? 'flex' : 'none';
        }
    }

    /**
     * Actualizar información de cámara
     */
    updateCameraInfo() {
        if (this.elements.cameraInfo) {
            const cameraType = this.currentCamera === 'environment' ? 'Trasera' : 'Frontal';
            const cameraCount = this.availableCameras.length;
            
            this.elements.cameraInfo.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>Cámara: ${cameraType} (${cameraCount} disponible${cameraCount !== 1 ? 's' : ''})</span>
            `;
        }
    }

    /**
     * Actualizar estado del botón de inicio
     */
    updateStartButton(enabled) {
        if (this.elements.startBtn && this.elements.stopBtn) {
            this.elements.startBtn.disabled = !enabled;
            this.elements.stopBtn.disabled = enabled;
            
            if (enabled) {
                this.elements.startBtn.innerHTML = '<i class="fas fa-play"></i><span>Iniciar Escáner</span>';
                this.elements.stopBtn.innerHTML = '<i class="fas fa-stop"></i><span>Detener Escáner</span>';
            } else {
                this.elements.startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Iniciando...</span>';
                this.elements.stopBtn.innerHTML = '<i class="fas fa-stop"></i><span>Detener Escáner</span>';
            }
        }
    }

    /**
     * Mostrar/ocultar contenedores
     */
    showCameraContainer() {
        if (this.elements.cameraContainer) {
            this.elements.cameraContainer.style.display = 'block';
        }
    }

    hideCameraContainer() {
        if (this.elements.cameraContainer) {
            this.elements.cameraContainer.style.display = 'none';
        }
    }

    showResultContainer() {
        if (this.elements.scanResultContainer) {
            this.elements.scanResultContainer.style.display = 'block';
        }
    }

    hideResultContainer() {
        if (this.elements.scanResultContainer) {
            this.elements.scanResultContainer.style.display = 'none';
        }
    }

    /**
     * Mostrar/ocultar error
     */
    showError(title, message) {
        if (this.elements.errorContainer) {
            document.getElementById('error-title').textContent = title;
            
            // Manejar saltos de línea en el mensaje
            const messageElement = document.getElementById('error-message');
            const lines = message.split('\n');
            messageElement.innerHTML = '';
            
            lines.forEach((line, index) => {
                if (line.trim()) {
                    const p = document.createElement('p');
                    if (line.startsWith('• ')) {
                        p.innerHTML = `<strong>${line}</strong>`;
                        p.style.marginBottom = '4px';
                    } else if (line.includes('Soluciones sugeridas:')) {
                        p.innerHTML = `<strong>${line}</strong>`;
                        p.style.marginBottom = '8px';
                        p.style.marginTop = '8px';
                    } else {
                        p.textContent = line;
                        if (index > 0) p.style.marginBottom = '4px';
                    }
                    messageElement.appendChild(p);
                }
            });
            
            this.elements.errorContainer.style.display = 'block';
        }
    }

    hideError() {
        if (this.elements.errorContainer) {
            this.elements.errorContainer.style.display = 'none';
        }
    }

    /**
     * Escapar HTML para prevenir XSS
     */
    escapeHtml(text) {
        const map = {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
}

// ========================================
// CARGAR jsQR DESDE CDN
// ========================================

/**
 * Cargar librería jsQR desde CDN
 */
function loadJsQR() {
    return new Promise((resolve, reject) => {
        if (window.jsQR) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
        script.onload = () => {
            console.log('jsQR cargado exitosamente');
            resolve();
        };
        script.onerror = () => {
            reject(new Error('No se pudo cargar jsQR desde CDN'));
        };
        
        document.head.appendChild(script);
    });
}

// ========================================
// INICIALIZACIÓN
// ========================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Educational Symposium 2025 - Escáner QR Simplificado iniciado');
    
    try {
        // Cargar jsQR
        await loadJsQR();
        
        // Crear instancia global del escáner
        window.simpleQRScanner = new SimpleQRScanner();
        
    } catch (error) {
        console.error('Error al inicializar escáner:', error);
        // Mostrar error al usuario si es necesario
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            document.getElementById('error-title').textContent = 'Error de Librería';
            document.getElementById('error-message').textContent = 'No se pudo cargar la librería necesaria para el escáner QR.';
            errorContainer.style.display = 'block';
        }
    }
});

// ========================================
// CONFIGURACIÓN RÁPIDA PARA EL USUARIO
// ========================================

/**
 * GUÍA RÁPIDA PARA PERSONALIZAR:
 * 
 * 1. CAMBIAR URL DE REDIRECCIÓN:
 *    Modifica la variable REDIRECT_URL al inicio de este archivo
 * 
 * 2. PERSONALIZAR ACCIÓN POSTERIOR:
 *    Modifica la función executeCustomAction() para agregar tu lógica
 * 
 * 3. ENVIAR DATOS AL SERVIDOR:
 *    Descomenta y configura la función sendToServer()
 * 
 * 4. VALIDACIONES PERSONALIZADAS:
 *    Agrega validaciones en executeCustomAction() según tus necesidades
 * 
 * 5. PROCESAMIENTO DE DATOS:
 *    Personaliza cómo procesas los datos del QR según tu caso de uso
 */