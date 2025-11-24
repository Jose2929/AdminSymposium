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
        
        // Propiedades para manejo de múltiples cámaras
        this.currentCameraIndex = 0;
        this.availableCameras = [];
        this.currentFacingMode = 'environment'; // 'user' para frontal, 'environment' para trasera
        
        // Nueva propiedad para el selector de cámara
        this.selectedCamera = 'environment'; // Por defecto cámara trasera
        
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
            dismissErrorBtn: document.getElementById('dismiss-error-btn'),
            // Nuevos elementos para cambio de cámara y entrada manual
            cameraToggleBtn: document.getElementById('camera-toggle-btn'),
            manualCodeInput: document.getElementById('manual-code-input'),
            submitManualBtn: document.getElementById('submit-manual-btn'),
            // Elementos para el toggle de modos
            modeButtons: document.querySelectorAll('.mode-btn'),
            manualMode: document.getElementById('manual-mode'),
            scannerControls: document.querySelector('.scanner-controls'),
            // Elementos para títulos dinámicos
            headerTitleText: document.getElementById('header-title-text'),
            scannerTitleText: document.getElementById('scanner-title-text'),
            // Nuevos elementos para el selector de cámara
            cameraSelector: document.querySelector('.camera-selector-section'),
            cameraOptions: document.querySelectorAll('.camera-option'),
            cameraRadios: document.querySelectorAll('input[name="camera-selection"]')
        };
        
        // Estado del modo actual
        this.currentMode = 'scanner';
        
        this.init();
    }

    /**
     * Inicializar el escáner
     */
    async init() {
        console.log('Inicializando Escáner QR Simplificado...');
        
        // Verificar soporte del navegador
        if (!this.checkBrowserSupport()) {
            this.showError('Navegador no compatible', 'Tu navegador no soporta las funciones necesarias para el escáner QR.');
            return;
        }
        
        this.setupEventListeners();
        
        // Detectar cámaras disponibles al inicializar
        await this.initializeCameraDetection();
        
        // Establecer modo inicial (escáner por defecto)
        this.toggleScannerMode('scanner');
        
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
        // Botón de inicio - usar nueva función con selección de cámara
        this.elements.startBtn?.addEventListener('click', () => this.startCameraWithSelection());
        
        // Botón de detener
        this.elements.stopBtn?.addEventListener('click', () => this.stopCamera());
        
        // Botón de limpiar resultado
        this.elements.clearResultBtn?.addEventListener('click', () => this.clearResult());
        
        // Botón de cerrar error
        this.elements.dismissErrorBtn?.addEventListener('click', () => this.hideError());
        
        // Nuevos event listeners para funcionalidades adicionales
        this.elements.cameraToggleBtn?.addEventListener('click', () => this.toggleCamera());
        this.elements.submitManualBtn?.addEventListener('click', () => this.processManualInput());
        
        // Event listeners para selector de cámara
        this.elements.cameraOptions?.forEach(option => {
            option.addEventListener('click', (e) => {
                const cameraType = option.getAttribute('data-camera');
                this.selectCamera(cameraType);
            });
        });
        
        // Event listeners para radios de cámara
        this.elements.cameraRadios?.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectCamera(e.target.value);
                }
            });
        });
        
        // Event listeners para toggle de modos
        this.elements.modeButtons?.forEach(button => {
            button.addEventListener('click', (e) => {
                const mode = e.currentTarget.getAttribute('data-mode');
                this.toggleScannerMode(mode);
            });
        });
        
        // Event listener para entrada manual con tecla Enter
        this.elements.manualCodeInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.processManualInput();
            }
        });
        
        // Validación en tiempo real del campo de entrada manual
        this.elements.manualCodeInput?.addEventListener('input', (e) => {
            this.validateManualInput(e.target);
        });
        
        // Evitar paste de caracteres no válidos
        this.elements.manualCodeInput?.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const validText = pastedText.replace(/[^0-9]/g, '').substring(0, 5);
            e.target.value = validText;
            this.validateManualInput(e.target);
        });
        
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
            
            // Obtener dispositivos de cámara disponibles
            await this.loadAvailableCameras();
            
            // Solicitar acceso a la cámara usando dispositivo específico
            const videoConstraints = await this.getCurrentVideoConstraints();
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints
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
            
            // Mostrar botón de cambio de cámara si hay múltiples dispositivos
            this.updateCameraToggleButton();
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

    // ========================================
    // NUEVAS FUNCIONALIDADES PARA CÁMARA MÚLTIPLE Y ENTRADA MANUAL
    // ========================================

    /**
     * Cargar dispositivos de cámara disponibles
     */
    async loadAvailableCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableCameras = devices.filter(device => device.kind === 'videoinput');
            console.log('Cámaras disponibles:', this.availableCameras);
        } catch (error) {
            console.warn('No se pudieron enumerar dispositivos de cámara:', error);
            this.availableCameras = [];
        }
    }

    /**
     * Obtener constraints de video para la cámara actual
     */
    async getCurrentVideoConstraints() {
        if (this.availableCameras.length > 0 && this.currentCameraIndex < this.availableCameras.length) {
            // Usar dispositivo específico
            return {
                deviceId: { exact: this.availableCameras[this.currentCameraIndex].deviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            };
        } else {
            // Usar facingMode como fallback
            return {
                facingMode: this.currentFacingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            };
        }
    }

    /**
     * Actualizar botón de cambio de cámara
     */
    updateCameraToggleButton() {
        if (!this.elements.cameraToggleBtn) return;
        
        const hasMultipleCameras = this.availableCameras.length > 1;
        
        // Usar clase CSS para mostrar/ocultar
        if (hasMultipleCameras) {
            this.elements.cameraToggleBtn.classList.remove('hidden');
            this.elements.cameraToggleBtn.style.display = 'flex';
            
            // Actualizar tooltip
            const nextFacing = this.currentFacingMode === 'environment' ? 'frontal' : 'trasera';
            this.elements.cameraToggleBtn.title = `Cambiar a cámara ${nextFacing}`;
            this.elements.cameraToggleBtn.ariaLabel = `Cambiar a cámara ${nextFacing}`;
        } else {
            this.elements.cameraToggleBtn.classList.add('hidden');
            this.elements.cameraToggleBtn.style.display = 'none';
        }
    }

    /**
     * Alternar entre cámaras frontal y trasera
     */
    async toggleCamera() {
        if (!this.isScanning || this.availableCameras.length <= 1) return;
        
        console.log('Cambiando cámara...');
        
        try {
            // Cambiar el facing mode
            this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
            
            // Actualizar estado del botón
            this.elements.cameraToggleBtn.style.opacity = '0.6';
            this.elements.cameraToggleBtn.style.pointerEvents = 'none';
            this.updateScannerStatus('Cambiando cámara...');
            
            // Reiniciar cámara con nueva configuración
            const currentData = null; // No guardamos datos del QR actual
            
            this.stopCamera();
            await this.startCamera();
            
        } catch (error) {
            console.error('Error al cambiar cámara:', error);
            // Revertir cambio en caso de error
            this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
            this.updateScannerStatus('Error al cambiar cámara');
        } finally {
            // Restaurar estado del botón
            setTimeout(() => {
                if (this.elements.cameraToggleBtn) {
                    this.elements.cameraToggleBtn.style.opacity = '1';
                    this.elements.cameraToggleBtn.style.pointerEvents = 'auto';
                }
            }, 500);
        }
    }

    /**
     * Procesar entrada manual de código
     */
    processManualInput() {
        const input = this.elements.manualCodeInput;
        const button = this.elements.submitManualBtn;
        
        if (!input || !button) return;
        
        const code = input.value.trim();
        
        if (code.length !== 5) {
            // Mostrar mensaje de error visual
            this.showInputError(input, 'El código debe tener exactamente 5 dígitos');
            return;
        }
        
        if (!/^\d{5}$/.test(code)) {
            this.showInputError(input, 'Solo se permiten números');
            return;
        }
        
        // Deshabilitar botón y campo durante procesamiento
        button.disabled = true;
        input.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Procesando...</span>';
        
        console.log('Procesando código manual:', `AST-${code}`);
        
        // Simular procesamiento
        setTimeout(() => {
            // Mostrar resultado como si fuera escaneado (con prefijo AST-)
            this.onQRCodeDetected(`AST-${code}`);
            
            // Limpiar campo
            input.value = '';
            
            // Restaurar estado de controles
            button.disabled = false;
            input.disabled = false;
            button.innerHTML = '<i class="fas fa-paper-plane"></i><span>Enviar</span>';
            
            // Volver al modo escáner
            this.toggleScannerMode('scanner');
            
            // Restaurar estilos
            input.style.borderColor = '';
            input.style.animation = '';
            
        }, 1000);
    }

    /**
     * Alternar entre modos escáner QR y entrada manual
     */
    toggleScannerMode(mode) {
        if (this.currentMode === mode) return;
        
        console.log('Cambiando modo a:', mode);
        
        this.currentMode = mode;
        
        // Actualizar títulos dinámicamente
        this.updateModeTitle(mode);
        
        // Actualizar botones de toggle
        this.elements.modeButtons?.forEach(btn => {
            const btnMode = btn.getAttribute('data-mode');
            if (btnMode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Mostrar/ocultar controles según el modo
        if (mode === 'manual') {
            // Detener escáner si está activo
            if (this.isScanning) {
                this.stopCamera();
            }
            
            // Mostrar modo manual
            this.elements.scannerControls?.setAttribute('style', 'display: none !important');
            this.elements.manualMode?.setAttribute('style', 'display: block !important');
            this.hideResultContainer();
            this.hideError();
            
            // Ocultar botón de cambio de cámara en modo manual
            if (this.elements.cameraToggleBtn) {
                this.elements.cameraToggleBtn.classList.add('hidden');
            }
            
        } else {
            // Mostrar modo escáner
            this.elements.scannerControls?.setAttribute('style', 'display: flex !important');
            this.elements.manualMode?.setAttribute('style', 'display: none !important');
            
            // Mostrar botón de cambio de cámara si hay múltiples cámaras
            this.updateCameraToggleButton();
            
            // Re-aplicar selección de cámara (mantener persistencia)
            if (this.selectedCamera) {
                this.selectCamera(this.selectedCamera);
            }
        }
        
        // Actualizar estado de botones
        this.updateStartButton(true);
        this.updateScannerStatus(mode === 'scanner' ? 'Listo para escanear' : 'Modo de entrada manual');
    }

    /**
     * Validar entrada manual en tiempo real
     */
    validateManualInput(input) {
        let value = input.value;
        
        // Remover cualquier carácter que no sea número
        value = value.replace(/[^0-9]/g, '');
        
        // Limitar a 5 caracteres
        if (value.length > 5) {
            value = value.substring(0, 5);
        }
        
        // Actualizar valor si se cambió
        if (value !== input.value) {
            input.value = value;
        }
        
        // Validar longitud y mostrar feedback visual
        if (value.length === 5) {
            input.parentElement.style.borderColor = 'var(--success-green)';
            input.parentElement.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
        } else if (value.length > 0) {
            input.parentElement.style.borderColor = 'var(--secondary-blue)';
            input.parentElement.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
        } else {
            input.parentElement.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            input.parentElement.style.boxShadow = 'none';
        }
        
        // Habilitar/deshabilitar botón de envío
        if (this.elements.submitManualBtn) {
            this.elements.submitManualBtn.disabled = value.length !== 5;
        }
    }

    /**
     * Actualizar títulos dinámicamente según el modo
     */
    updateModeTitle(mode) {
        if (!this.elements.headerTitleText || !this.elements.scannerTitleText) return;
        
        const scannerTitle = mode === 'scanner' ? 'Escáner de Código QR' : 'Entrada Manual de Código';
        const headerTitle = mode === 'scanner' ? 'Escáner de Código QR' : 'Entrada Manual';
        
        this.elements.headerTitleText.textContent = headerTitle;
        this.elements.scannerTitleText.textContent = scannerTitle;
        
        console.log('Títulos actualizados para modo:', mode);
    }

    /**
     * Mostrar error en el campo de entrada
     */
    showInputError(input, message) {
        // Remover mensajes de error anteriores
        const existingError = input.parentElement.querySelector('.input-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Mostrar error visual
        input.parentElement.style.borderColor = '#ef4444';
        input.parentElement.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.2)';
        input.style.animation = 'shake 0.3s';
        
        // Agregar mensaje de error
        const errorElement = document.createElement('div');
        errorElement.className = 'input-error';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #ef4444;
            font-size: 12px;
            margin-top: 4px;
            text-align: center;
            font-weight: 500;
        `;
        
        input.parentElement.appendChild(errorElement);
        
        // Restaurar estilos después de la animación
        setTimeout(() => {
            input.style.animation = '';
            input.parentElement.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            input.parentElement.style.boxShadow = 'none';
            
            // Remover mensaje de error después de un momento
            setTimeout(() => {
                if (errorElement.parentElement) {
                    errorElement.remove();
                }
            }, 2000);
        }, 300);
    }

    // ========================================
    // NUEVAS FUNCIONES PARA SELECTOR DE CÁMARA
    // ========================================

    /**
     * Inicializar detección de cámaras disponibles
     */
    async initializeCameraDetection() {
        try {
            console.log('Inicializando detección de cámaras...');
            
            // Primero solicitar permisos para poder detectar las cámaras
            await navigator.mediaDevices.getUserMedia({ video: true });
            
            // Enumerar dispositivos
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableCameras = devices.filter(device => device.kind === 'videoinput');
            
            console.log('Cámaras detectadas:', this.availableCameras);
            
            // Actualizar selector según cámaras disponibles
            this.updateCameraSelector();
            
            // Detener el stream temporal usado para permisos
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            tempStream.getTracks().forEach(track => track.stop());
            
        } catch (error) {
            console.warn('No se pudieron detectar cámaras automáticamente:', error);
            // Usar predeterminadas en caso de error
            this.updateCameraSelector();
        }
    }

    /**
     * Detectar cámaras disponibles
     */
    async detectAvailableCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            return videoDevices.map(device => ({
                deviceId: device.deviceId,
                label: device.label || 'Cámara sin nombre',
                facing: device.label.toLowerCase().includes('back') || 
                        device.label.toLowerCase().includes('rear') ? 'environment' : 'user'
            }));
        } catch (error) {
            console.log('Error detectando cámaras:', error);
            return [];
        }
    }

    /**
     * Actualizar selector según cámaras disponibles
     */
    updateCameraSelector() {
        const rearOption = document.querySelector('[data-camera="environment"]');
        const frontOption = document.querySelector('[data-camera="user"]');
        
        if (!rearOption || !frontOption) return;
        
        // Determinar qué cámaras están disponibles
        const hasRear = this.availableCameras.some(camera => 
            !camera.label || 
            camera.label.toLowerCase().includes('back') || 
            camera.label.toLowerCase().includes('rear') ||
            camera.label.toLowerCase().includes('environment')
        );
        
        const hasFront = this.availableCameras.some(camera => 
            camera.label && 
            (camera.label.toLowerCase().includes('front') || 
             camera.label.toLowerCase().includes('user'))
        );
        
        // Mostrar/ocultar opciones según disponibilidad
        if (hasRear) {
            rearOption.classList.remove('hidden');
            rearOption.style.display = 'flex';
        } else {
            rearOption.classList.add('hidden');
            rearOption.style.display = 'none';
        }
        
        if (hasFront) {
            frontOption.classList.remove('hidden');
            frontOption.style.display = 'flex';
        } else {
            frontOption.classList.add('hidden');
            frontOption.style.display = 'none';
        }
        
        // Auto-seleccionar primera opción disponible
        if (hasRear) {
            this.selectCamera('environment');
        } else if (hasFront) {
            this.selectCamera('user');
        }
        
        console.log('Selector actualizado:', { hasRear, hasFront, selected: this.selectedCamera });
    }

    /**
     * Seleccionar cámara específica
     */
    selectCamera(cameraType) {
        console.log('Seleccionando cámara:', cameraType);
        
        this.selectedCamera = cameraType;
        this.currentFacingMode = cameraType;
        
        // Actualizar estado visual de las opciones
        this.elements.cameraOptions?.forEach(option => {
            const optionCamera = option.getAttribute('data-camera');
            if (optionCamera === cameraType) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
        
        // Actualizar radio buttons
        this.elements.cameraRadios?.forEach(radio => {
            if (radio.value === cameraType) {
                radio.checked = true;
            } else {
                radio.checked = false;
            }
        });
        
        console.log('Cámara seleccionada:', { cameraType, selectedCamera: this.selectedCamera });
    }

    /**
     * Obtener cámara seleccionada
     */
    getSelectedCamera() {
        return this.selectedCamera || 'environment';
    }

    /**
     * Iniciar cámara con selección específica
     */
    async startCameraWithSelection() {
        console.log('Iniciando cámara con selección:', this.getSelectedCamera());
        
        try {
            this.updateScannerStatus('Solicitando permisos de cámara...');
            this.showCameraContainer();
            this.updateStartButton(false);
            
            // Obtener dispositivos de cámara disponibles
            await this.loadAvailableCameras();
            
            // Usar la cámara seleccionada en las constraints
            const videoConstraints = this.getSelectedVideoConstraints();
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints
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
            
            console.log('Cámara iniciada correctamente con selección:', this.getSelectedCamera());
            
        } catch (error) {
            console.error('Error al iniciar cámara:', error);
            this.handleCameraError(error);
        }
    }

    /**
     * Obtener constraints de video para la cámara seleccionada
     */
    getSelectedVideoConstraints() {
        const selectedCamera = this.getSelectedCamera();
        
        // Usar dispositivo específico si está disponible
        if (this.availableCameras.length > 0) {
            const targetCamera = this.availableCameras.find(camera => {
                const label = camera.label.toLowerCase();
                if (selectedCamera === 'environment') {
                    return label.includes('back') || label.includes('rear') || label.includes('environment');
                } else {
                    return label.includes('front') || label.includes('user');
                }
            });
            
            if (targetCamera) {
                return {
                    deviceId: { exact: targetCamera.deviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                };
            }
        }
        
        // Usar facingMode como fallback
        return {
            facingMode: selectedCamera,
            width: { ideal: 1280 },
            height: { ideal: 720 }
        };
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
        
        // Inicializar con await para el detector de cámaras
        await window.simpleQRScanner.init();
        
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