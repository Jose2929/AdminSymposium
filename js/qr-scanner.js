/**
 * Escáner de Códigos QR para Registro de Entrada - Educational Symposium 2025
 * Funcionalidad completa para verificación y autenticación de gafetes
 */

// Configuración global
const QRScannerConfig = {
    // URL de la librería QR Scanner (desde CDN)
    libraryUrl: 'https://unpkg.com/qr-scanner@1.4.2/qr-scanner.min.js',
    
    // Configuración de cámara
    cameraConstraints: {
        video: {
            facingMode: { exact: "environment" }, // Cámara trasera por defecto
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    },
    
    // Tiempos de configuración
    timeouts: {
        scannerStart: 10000,
        cameraAccess: 5000
    },

    // Configuración para check-in
    checkIn: {
        validEventPrefix: 'EDU2025-', // Prefijo válido para el evento
        maxRecentScans: 10, // Máximo de escaneos recientes a mostrar
        autoHideResult: true, // Auto-ocultar resultado después de 5 segundos
        autoHideDelay: 5000
    }
};

// Verificación de navegador para soporte de cámara
const browserSupport = {
    hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    hasWebRTC: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection),
    hasWorkerSupport: typeof Worker !== 'undefined'
};

/**
 * Clase principal del Escáner QR
 */
class QRCodeScanner {
    constructor() {
        this.isScanning = false;
        this.scanner = null;
        this.video = null;
        this.currentCameraStream = null;
        
        // Estadísticas de check-in
        this.scanStats = {
            total: 0,
            valid: 0,
            invalid: 0,
            recentScans: []
        };
        
        // Referencias a elementos DOM para estadísticas
        this.summaryElements = {
            scanSummary: document.getElementById('scan-summary'),
            totalScans: document.getElementById('total-scans'),
            validScans: document.getElementById('valid-scans'),
            invalidScans: document.getElementById('invalid-scans'),
            recentScans: document.getElementById('recent-scans')
        };
        
        // Referencias a elementos DOM del escáner
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
        console.log('Inicializando Escáner QR...');
        
        if (!this.checkBrowserSupport()) {
            this.showError('Navegador no compatible', 'Tu navegador no soporta las funciones necesarias para el escáner QR.');
            return;
        }
        
        this.setupEventListeners();
        console.log('Escáner QR inicializado correctamente');
    }

    /**
     * Verificar soporte del navegador
     */
    checkBrowserSupport() {
        if (!browserSupport.hasGetUserMedia) {
            console.error('getUserMedia no está soportado');
            return false;
        }
        
        if (!browserSupport.hasWorkerSupport) {
            console.error('Workers no están soportados');
            return false;
        }
        
        return true;
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botón de inicio
        this.elements.startBtn?.addEventListener('click', () => this.startScanner());
        
        // Botón de detener
        this.elements.stopBtn?.addEventListener('click', () => this.stopScanner());
        
        // Botón de limpiar resultado
        this.elements.clearResultBtn?.addEventListener('click', () => this.clearResult());
        
        // Botón de cerrar error
        this.elements.dismissErrorBtn?.addEventListener('click', () => this.hideError());
        
        // Evento de tecla Escape para cerrar escáner
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isScanning) {
                this.stopScanner();
            }
        });
        
        // Eventos de visibilidad de página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isScanning) {
                this.stopScanner();
            }
        });
    }

    /**
     * Iniciar el escáner QR
     */
    async startScanner() {
        console.log('Iniciando escáner QR...');
        
        try {
            this.updateScannerStatus('Iniciando cámara...');
            this.showCameraContainer();
            this.updateStartButton(false);
            
            // Cargar la librería QR Scanner dinámicamente
            await this.loadQRLibrary();
            
            // Inicializar el escáner
            await this.initializeScanner();
            
            this.isScanning = true;
            this.updateStartButton(true);
            this.updateScannerStatus('Cámara activa - Apunta al código QR');
            
            console.log('Escáner QR iniciado correctamente');
            
        } catch (error) {
            console.error('Error al iniciar escáner:', error);
            this.handleScannerError(error);
        }
    }

    /**
     * Cargar la librería QR Scanner desde CDN
     */
    async loadQRLibrary() {
        return new Promise((resolve, reject) => {
            if (window.QrScanner) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = QRScannerConfig.libraryUrl;
            script.onload = () => {
                console.log('Librería QR Scanner cargada');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('No se pudo cargar la librería QR Scanner'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Inicializar el escáner QR
     */
    async initializeScanner() {
        if (!window.QrScanner) {
            throw new Error('Librería QR Scanner no está disponible');
        }
        
        // Configurar worker para QR Scanner
        if (typeof window.QrScanner !== 'undefined' && window.QrScanner.WORKER_PATH) {
            // La librería qr-scanner puede usar worker si está configurado
            window.QrScanner.WORKER_PATH = QRScannerConfig.libraryUrl.replace('.min.js', '.worker.min.js');
        }
        
        // Crear instancia del escáner con configuración
        try {
            // Verificar disponibilidad de cámara primero
            await this.checkCameraAvailability();
            
            // Crear instancia del escáner
            this.scanner = new window.QrScanner(
                this.elements.video,
                (result) => this.onQRCodeDetected(result),
                {
                    onDecodeError: (error) => this.onScannerError(error),
                    maxScansPerSecond: 5, // Limitar scans para mejor rendimiento
                    highlightScanRegion: false,
                    highlightCodeOutline: false,
                    preferredCamera: 'environment' // Cámara trasera por defecto
                }
            );
            
            // Iniciar escaneo
            await this.scanner.start();
            
        } catch (error) {
            console.error('Error al inicializar QR Scanner:', error);
            throw error;
        }
    }

    /**
     * Verificar disponibilidad de cámara
     */
    async checkCameraAvailability() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            
            // Detener el stream de prueba
            stream.getTracks().forEach(track => track.stop());
            
            return true;
        } catch (error) {
            throw new Error('Cámara no disponible: ' + error.message);
        }
    }

    /**
     * Manejar detección de código QR
     */
    onQRCodeDetected(result) {
        console.log('Código QR detectado:', result);
        
        if (this.isScanning) {
            this.stopScanner();
            this.processQRCode(result);
        }
    }

    /**
     * Manejar errores del escáner
     */
    onScannerError(error) {
        console.warn('Error del escáner:', error);
        
        // Solo mostrar errores críticos
        if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
            this.handleScannerError(error);
        }
    }

    /**
     * Procesar el código QR leído (Versión mejorada para check-in)
     */
    processQRCode(result) {
        const qrData = result.data || result;
        console.log('Procesando código QR para check-in:', qrData);
        
        this.scanStats.total++;
        
        try {
            // Intentar parsear como JSON
            const parsedData = JSON.parse(qrData);
            const validation = this.validateQRCode(parsedData);
            
            if (validation.isValid) {
                this.scanStats.valid++;
                this.playSuccessSound();
                this.addToRecentScans({
                    ...parsedData,
                    timestamp: new Date().toISOString(),
                    status: 'valid'
                });
                
                this.displayResult('success', '✅ Gafete Válido', 'Verificación exitosa del gafete', parsedData);
            } else {
                this.scanStats.invalid++;
                this.playErrorSound();
                this.addToRecentScans({
                    ...parsedData,
                    timestamp: new Date().toISOString(),
                    status: 'invalid',
                    reason: validation.reason
                });
                
                this.displayResult('error', '❌ Gafete Inválido', validation.reason, parsedData);
            }
            
        } catch (e) {
            // Si no es JSON, validar como texto plano
            const validation = this.validateQRCodeText(qrData);
            
            if (validation.isValid) {
                this.scanStats.valid++;
                this.playSuccessSound();
                this.addToRecentScans({
                    contenido: qrData,
                    timestamp: new Date().toISOString(),
                    status: 'valid'
                });
                
                this.displayResult('success', '✅ Código Válido', 'Verificación exitosa', {
                    contenido: qrData,
                    tipo: 'texto_plano'
                });
            } else {
                this.scanStats.invalid++;
                this.playErrorSound();
                this.addToRecentScans({
                    contenido: qrData,
                    timestamp: new Date().toISOString(),
                    status: 'invalid',
                    reason: validation.reason
                });
                
                this.displayResult('error', '❌ Código Inválido', validation.reason, {
                    contenido: qrData
                });
            }
        }
        
        this.updateScanStats();
    }

    /**
     * Validar código QR específico para el evento
     */
    validateQRCode(data) {
        // Validar estructura JSON
        if (!data || typeof data !== 'object') {
            return { isValid: false, reason: 'Formato de datos inválido' };
        }

        // Validar campos requeridos para el evento
        const requiredFields = ['evento', 'participante', 'codigo'];
        for (const field of requiredFields) {
            if (!data[field]) {
                return { isValid: false, reason: `Campo requerido faltante: ${field}` };
            }
        }

        // Validar que sea del evento correcto
        if (!data.evento.includes('Educational Symposium 2025')) {
            return { isValid: false, reason: 'Gafete de evento diferente' };
        }

        // Validar formato del código
        if (!data.codigo.startsWith(QRScannerConfig.checkIn.validEventPrefix)) {
            return { isValid: false, reason: 'Código de evento inválido' };
        }

        // Validar fecha del evento (opcional)
        if (data.fecha) {
            const eventDate = new Date(data.fecha);
            const today = new Date();
            const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            if (eventDateOnly > todayOnly) {
                return { isValid: false, reason: 'Gafete de evento futuro' };
            }
        }

        return { isValid: true };
    }

    /**
     * Validar código QR como texto plano
     */
    validateQRCodeText(text) {
        // Validar que contenga el prefijo válido
        if (!text.startsWith(QRScannerConfig.checkIn.validEventPrefix)) {
            return { isValid: false, reason: 'Código no válido para este evento' };
        }

        // Validar longitud mínima
        if (text.length < 8) {
            return { isValid: false, reason: 'Código muy corto' };
        }

        // Validar que contenga números
        if (!/\d/.test(text)) {
            return { isValid: false, reason: 'Código debe contener números' };
        }

        return { isValid: true };
    }

    /**
     * Agregar escaneo al historial reciente
     */
    addToRecentScans(scanData) {
        this.scanStats.recentScans.unshift(scanData);
        
        // Mantener solo los últimos escaneos
        if (this.scanStats.recentScans.length > QRScannerConfig.checkIn.maxRecentScans) {
            this.scanStats.recentScans = this.scanStats.recentScans.slice(0, QRScannerConfig.checkIn.maxRecentScans);
        }
    }

    /**
     * Actualizar estadísticas mostradas
     */
    updateScanStats() {
        if (this.summaryElements.totalScans) {
            this.summaryElements.totalScans.textContent = this.scanStats.total;
        }
        if (this.summaryElements.validScans) {
            this.summaryElements.validScans.textContent = this.scanStats.valid;
        }
        if (this.summaryElements.invalidScans) {
            this.summaryElements.invalidScans.textContent = this.scanStats.invalid;
        }
        
        // Mostrar resumen si hay al menos un escaneo
        if (this.scanStats.total > 0 && this.summaryElements.scanSummary) {
            this.summaryElements.scanSummary.style.display = 'block';
        }
        
        this.updateRecentScansList();
    }

    /**
     * Actualizar lista de escaneos recientes
     */
    updateRecentScansList() {
        if (!this.summaryElements.recentScans) return;
        
        const recentScans = this.scanStats.recentScans.slice(0, 5); // Mostrar solo los últimos 5
        let html = '<div class="recent-scans-list">';
        
        recentScans.forEach((scan, index) => {
            const time = new Date(scan.timestamp).toLocaleTimeString();
            const statusClass = scan.status === 'valid' ? 'valid' : 'invalid';
            const statusIcon = scan.status === 'valid' ? '✅' : '❌';
            
            html += `
                <div class="recent-scan-item ${statusClass}">
                    <span class="scan-status">${statusIcon}</span>
                    <span class="scan-info">${scan.participante || scan.contenido?.substring(0, 20) || 'Código desconocido'}</span>
                    <span class="scan-time">${time}</span>
                </div>
            `;
        });
        
        html += '</div>';
        this.summaryElements.recentScans.innerHTML = html;
    }

    /**
     * Reproducir sonido de éxito
     */
    playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('No se pudo reproducir sonido de éxito:', error);
        }
    }

    /**
     * Reproducir sonido de error
     */
    playErrorSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
        } catch (error) {
            console.warn('No se pudo reproducir sonido de error:', error);
        }
    }

    /**
     * Mostrar resultado del escaneo (Versión mejorada para check-in)
     */
    displayResult(type, title, message, details) {
        const iconMap = {
            success: { icon: 'fas fa-check-circle', class: 'success' },
            info: { icon: 'fas fa-info-circle', class: 'info' },
            error: { icon: 'fas fa-times-circle', class: 'error' }
        };
        
        const config = iconMap[type] || iconMap.info;
        
        // Actualizar icono y clase
        this.elements.resultIcon.className = config.icon;
        this.elements.resultTitle.textContent = title;
        this.elements.resultMessage.textContent = message;
        
        // Mostrar detalles
        this.elements.resultDetails.innerHTML = this.formatDetails(details);
        
        // Mostrar contenedor
        this.showResultContainer();
        this.hideCameraContainer();
        this.updateStartButton(true);
        
        // Auto-ocultar resultado después de un tiempo para check-in
        if (QRScannerConfig.checkIn.autoHideResult && type === 'success') {
            setTimeout(() => {
                this.hideResultContainer();
            }, QRScannerConfig.checkIn.autoHideDelay);
        }
    }

    /**
     * Formatear detalles para mostrar
     */
    formatDetails(details) {
        let html = '<div class="details-grid">';
        
        Object.entries(details).forEach(([key, value]) => {
            const formattedKey = this.formatKey(key);
            const formattedValue = this.formatValue(value);
            
            html += `
                <div class="detail-item">
                    <span class="detail-key">${formattedKey}:</span>
                    <span class="detail-value">${formattedValue}</span>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    /**
     * Formatear clave para mostrar
     */
    formatKey(key) {
        return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    }

    /**
     * Formatear valor para mostrar
     */
    formatValue(value) {
        if (typeof value === 'string' && value.length > 50) {
            return value.substring(0, 50) + '...';
        }
        return value;
    }

    /**
     * Detener el escáner
     */
    async stopScanner() {
        console.log('Deteniendo escáner QR...');
        
        if (this.scanner) {
            try {
                await this.scanner.stop();
                this.scanner.destroy();
                this.scanner = null;
            } catch (error) {
                console.warn('Error al detener escáner:', error);
            }
        }
        
        // Detener stream de cámara
        if (this.currentCameraStream) {
            this.currentCameraStream.getTracks().forEach(track => track.stop());
            this.currentCameraStream = null;
        }
        
        this.isScanning = false;
        this.hideCameraContainer();
        this.updateStartButton(true);
        this.updateScannerStatus('Escáner detenido');
        
        console.log('Escáner QR detenido');
    }

    /**
     * Limpiar resultado actual
     */
    clearResult() {
        this.hideResultContainer();
        this.updateScannerStatus('Listo para escanear');
    }

    /**
     * Manejar errores del escáner
     */
    handleScannerError(error) {
        console.error('Error del escáner:', error);
        
        let title = 'Error del Sistema';
        let message = 'Ocurrió un error inesperado';
        
        switch (error.name) {
            case 'NotAllowedError':
                title = 'Permisos Denegados';
                message = 'Se requieren permisos de cámara para usar el escáner QR';
                break;
            case 'NotFoundError':
                title = 'Cámara No Disponible';
                message = 'No se encontró ninguna cámara en el dispositivo';
                break;
            case 'NotReadableError':
                title = 'Cámara Ocupada';
                message = 'La cámara está siendo usada por otra aplicación';
                break;
            case 'OverconstrainedError':
                title = 'Configuración de Cámara';
                message = 'La cámara no soporta la configuración requerida';
                break;
            default:
                message = error.message || message;
        }
        
        this.showError(title, message);
        this.stopScanner();
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
     * Mostrar/ocultar contenedor de cámara
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

    /**
     * Mostrar/ocultar contenedor de resultado
     */
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
     * Mostrar/ocultar contenedor de error
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
}

// Inicializar escáner cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Educational Symposium 2025 - QR Scanner iniciado');
    
    // Crear instancia global del escáner
    window.qrScanner = new QRCodeScanner();
});

// Manejo de errores globales
window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rechazada:', event.reason);
});