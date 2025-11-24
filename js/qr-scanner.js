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
        
        // Referencias a elementos DOM
        this.elements = {
            startBtn: document.getElementById('start-scanner-btn'),
            stopBtn: document.getElementById('stop-scanner-btn'),
            cameraContainer: document.getElementById('camera-container'),
            scanResultContainer: document.getElementById('scan-result-container'),
            errorContainer: document.getElementById('error-container'),
            video: document.getElementById('qr-video'),
            cameraStatus: document.getElementById('camera-status'),
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
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botón de inicio
        this.elements.startBtn?.addEventListener('click', () => this.startCamera());
        
        // Botón de detener
        this.elements.stopBtn?.addEventListener('click', () => this.stopCamera());
        
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
            
            // Solicitar acceso a la cámara
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment', // Cámara trasera por defecto
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            // Configurar video
            this.video = this.elements.video;
            this.video.srcObject = this.stream;
            
            // Esperar a que el video esté listo
            await new Promise((resolve) => {
                this.video.onloadedmetadata = resolve;
            });
            
            // Crear canvas para procesar imagen
            this.canvas = document.createElement('canvas');
            this.canvasContext = this.canvas.getContext('2d');
            
            // Configurar dimensiones del canvas
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            this.isScanning = true;
            this.updateStartButton(true);
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
     * Manejar errores de cámara
     */
    handleCameraError(error) {
        console.error('Error de cámara:', error);
        
        let title = 'Error del Sistema';
        let message = 'Ocurrió un error inesperado';
        
        switch (error.name) {
            case 'NotAllowedError':
                title = 'Permisos Denegados';
                message = 'Se requieren permisos de cámara para usar el escáner QR. Por favor, permite el acceso a la cámara.';
                break;
            case 'NotFoundError':
                title = 'Cámara No Disponible';
                message = 'No se encontró ninguna cámara en el dispositivo';
                break;
            case 'NotReadableError':
                title = 'Cámara Ocupada';
                message = 'La cámara está siendo usada por otra aplicación. Cierra otras aplicaciones que puedan estar usando la cámara.';
                break;
            case 'OverconstrainedError':
                title = 'Configuración de Cámara';
                message = 'La cámara no soporta la configuración requerida';
                break;
            default:
                message = error.message || message;
        }
        
        this.showError(title, message);
        this.stopCamera();
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
            document.getElementById('error-message').textContent = message;
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