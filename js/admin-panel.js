class AdminPanel {
    constructor() {
        this.currentSection = 'info';
        this.eventos = [];
        this.participantes = [];
        this.asistencia = [];
        this.info = {};
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.showSection('info');
    }

    setupEventListeners() {
        // Navegación del sidebar
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // Navegación del menú hamburguesa móvil
        document.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                
                // Cerrar el menú hamburguesa después de seleccionar una opción
                const mobileMenu = document.getElementById('mobileMenu');
                const mobileMenuToggle = document.getElementById('mobileMenuToggle');
                if (mobileMenu && mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });

        // Botón actualizar
        document.getElementById('refreshBtn').addEventListener('click', async () => {
            this.showToast('Actualizando datos...', 'info');
            await this.refreshData();
        });

        // Formulario de información
        document.getElementById('infoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveInfo();
        });

        // Formulario de evento
        document.getElementById('saveEventoBtn').addEventListener('click', () => {
            this.saveEvento();
        });

        // Formulario de participante
        document.getElementById('saveParticipanteBtn').addEventListener('click', () => {
            this.saveParticipante();
        });

        // Búsqueda de participantes
        document.getElementById('searchParticipante').addEventListener('input', (e) => {
            this.filterParticipantes(e.target.value);
        });

        document.getElementById('clearSearch').addEventListener('click', () => {
            document.getElementById('searchParticipante').value = '';
            this.renderParticipantes();
        });

        // Limpiar modales al cerrarse
        document.getElementById('eventoModal').addEventListener('hidden.bs.modal', () => {
            this.clearEventoForm();
        });

        document.getElementById('participanteModal').addEventListener('hidden.bs.modal', () => {
            this.clearParticipanteForm();
        });
    }

    async loadData() {
        try {
            console.log('🚀 Iniciando carga de datos...');
            this.showToast('Cargando datos...', 'info');
            
            const data = await window.firebaseManager.getAllData();
            
            console.log('📊 Datos completos de Firebase:', data);
            
            this.info = data.info || {};
            this.eventos = Array.isArray(data.eventos) ? data.eventos : [];
            
            // Convertir participantes de objeto a array
            this.participantes = this.convertParticipantesToArray(data.participantes);
            this.asistencia = Array.isArray(data.asistencia) ? data.asistencia : [];

            console.log('📈 Estado después de cargar:');
            console.log('  - Eventos:', this.eventos);
            console.log('  - Participantes:', this.participantes);
            console.log('  - Asistencia:', this.asistencia);

            this.renderInfo();
            this.renderEventos();
            this.renderParticipantes();
            this.renderAsistencia();
            this.populateEventoSelect();

            this.showToast('Datos cargados correctamente', 'success');
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.showToast('Error al cargar los datos: ' + error.message, 'error');
        }
    }

    /**
     * Función de actualización automática para después de operaciones CRUD
     * Esta función se ejecuta automáticamente cada vez que se actualiza o elimina un dato
     */
    async refreshData() {
        try {
            console.log('🔄 Actualizando datos automáticamente...');
            
            const data = await window.firebaseManager.getAllData();
            
            // Actualizar datos locales
            this.info = data.info || {};
            this.eventos = Array.isArray(data.eventos) ? data.eventos : [];
            this.participantes = this.convertParticipantesToArray(data.participantes);
            this.asistencia = Array.isArray(data.asistencia) ? data.asistencia : [];

            console.log('📈 Estado después de actualizar:');
            console.log('  - Eventos:', this.eventos.length);
            console.log('  - Participantes:', this.participantes.length);
            console.log('  - Asistencia:', this.asistencia.length);

            // Re-renderizar todas las secciones sin mostrar toast de carga
            this.renderInfo();
            this.renderEventos();
            this.renderParticipantes();
            this.renderAsistencia();
            this.populateEventoSelect();

            console.log('✅ Datos actualizados correctamente');
        } catch (error) {
            console.error('❌ Error actualizando datos:', error);
            // No mostrar toast de error para evitar spam en actualizaciones automáticas
        }
    }

    showSection(sectionName) {
        // Actualizar navegación del sidebar
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`.sidebar [data-section="${sectionName}"]`).classList.add('active');

        // Actualizar navegación del menú hamburguesa móvil
        document.querySelectorAll('.menu-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`.menu-link[data-section="${sectionName}"]`).classList.add('active');

        // Mostrar sección correspondiente
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });
        document.getElementById(`${sectionName}-section`).classList.remove('d-none');

        // Actualizar título
        const titles = {
            'info': 'Información General',
            'eventos': 'Gestión de Eventos',
            'participantes': 'Gestión de Participantes',
            'asistencia': 'Registro de Asistencia'
        };
        document.getElementById('sectionTitle').textContent = titles[sectionName];

        this.currentSection = sectionName;
    }

    renderInfo() {
        if (!this.info) return;

        document.getElementById('titulo').value = this.info.titulo || '';
        document.getElementById('fecha').value = this.info.fecha || '';
        document.getElementById('lugar').value = this.info.lugar || '';
        document.getElementById('escuela').value = this.info.escuela || '';
        document.getElementById('horario').value = this.info.horario || '';
        document.getElementById('descripcion').value = this.info.descripcion || '';
        document.getElementById('ponente1').value = this.info.ponente1 || '';
        document.getElementById('ponente2').value = this.info.ponente2 || '';
        document.getElementById('ponente3').value = this.info.ponente3 || '';
        document.getElementById('correo').value = this.info.correo || '';
        document.getElementById('telefono').value = this.info.telefono || '';
    }

    renderEventos() {
        const tbody = document.querySelector('#eventosTable tbody');
        tbody.innerHTML = '';

        console.log('🎯 Renderizando eventos...');

        for (let i = 0; i < this.eventos.length; i++) {
            const evento = this.eventos[i];
            
            if (!evento) {
                console.log(`  ❌ Evento ${i} es null/undefined`);
                continue;
            }

            console.log(`  ✅ Evento ${i}:`, evento);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${evento.fecha || ''}</td>
                <td>${evento.nombre || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="adminPanel.editEvento(${i})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteEvento(${i})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        }
    }

    renderParticipantes() {
        const tbody = document.querySelector('#participantesTable tbody');
        tbody.innerHTML = '';

        console.log('🎯 Renderizando participantes...');
        console.log('  📋 Array participantes completo:', this.participantes);
        console.log('  📏 Length del array:', this.participantes.length);

        if (this.participantes.length === 0) {
            console.log('  ⚠️ Array de participantes está vacío');
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">No hay participantes</td></tr>';
            return;
        }

        for (let i = 0; i < this.participantes.length; i++) {
            const participante = this.participantes[i];
            
            console.log(`  🔍 Revisando índice ${i}:`, participante);
            
            if (!participante) {
                console.log(`  ❌ Participante ${i} es null/undefined`);
                continue;
            }

            console.log(`  ✅ Procesando participante ${i}:`, participante);
            
            // Encontrar el evento correspondiente
            const eventoIndex = participante.evento;
            const evento = this.eventos[eventoIndex] || {};
            
            console.log(`  🎫 Evento correspondiente (índice ${eventoIndex}):`, evento);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${participante.nombre || ''}</td>
                <td>${evento.nombre || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="adminPanel.editParticipante(${i})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteParticipante(${i})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        }
    }

    convertParticipantesToArray(participantesObj) {
        console.log('🔄 Convirtiendo participantes a array...');
        console.log('📥 Objeto participantes recibido:', participantesObj);
        
        if (!participantesObj || typeof participantesObj !== 'object') {
            console.log('⚠️ Participantes no es un objeto válido, retornando array vacío');
            return [];
        }

        const array = [];
        const keys = Object.keys(participantesObj);
        
        console.log('🔑 Keys encontradas:', keys);
        
        keys.forEach((key, index) => {
            const participante = participantesObj[key];
            if (participante) {
                console.log(`✅ Participante ${index} (key: ${key}):`, participante);
                // Agregar el ID de Firebase al objeto
                array[index] = {
                    ...participante,
                    firebaseId: key
                };
            }
        });
        
        console.log('📤 Array de participantes resultante:', array);
        return array;
    }

    renderAsistencia() {
        const tbody = document.querySelector('#asistenciaTable tbody');
        tbody.innerHTML = '';

        this.asistencia.forEach((registro) => {
            if (!registro) return;

            const evento = this.eventos[registro.evento] || {};
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${registro.nombre || ''}</td>
                <td>${evento.nombre || 'N/A'}</td>
                <td>${registro.fecha || ''}</td>
                <td>${registro.hora || ''}</td>
                <td><span class="badge bg-success">Presente</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    populateEventoSelect() {
        const select = document.getElementById('participanteEvento');
        select.innerHTML = '<option value="">Seleccionar evento...</option>';

        console.log('🎫 Poblando select de eventos...');

        for (let i = 0; i < this.eventos.length; i++) {
            const evento = this.eventos[i];
            
            if (!evento) continue;

            console.log(`  ✅ Agregando evento ${i}:`, evento.nombre);
            
            const option = document.createElement('option');
            option.value = i;
            option.textContent = evento.nombre;
            select.appendChild(option);
        }
    }

    async saveInfo() {
        try {
            const formData = {
                titulo: document.getElementById('titulo').value,
                fecha: document.getElementById('fecha').value,
                lugar: document.getElementById('lugar').value,
                escuela: document.getElementById('escuela').value,
                horario: document.getElementById('horario').value,
                descripcion: document.getElementById('descripcion').value,
                ponente1: document.getElementById('ponente1').value,
                ponente2: document.getElementById('ponente2').value,
                ponente3: document.getElementById('ponente3').value,
                correo: document.getElementById('correo').value,
                telefono: document.getElementById('telefono').value
            };

            await window.firebaseManager.setInfo(formData);
            this.info = formData;
            this.showToast('Información guardada correctamente', 'success');
            
            // Actualizar datos automáticamente después de guardar
            await this.refreshData();
        } catch (error) {
            console.error('Error guardando info:', error);
            this.showToast('Error al guardar la información', 'error');
        }
    }

    async saveEvento() {
        try {
            const eventoData = {
                fecha: document.getElementById('eventoFecha').value,
                nombre: document.getElementById('eventoNombre').value
            };

            const eventoId = document.getElementById('eventoId').value;

            if (eventoId) {
                await window.firebaseManager.updateEvento(eventoId, eventoData);
                this.eventos[eventoId] = eventoData;
                this.showToast('Evento actualizado correctamente', 'success');
            } else {
                const newId = await window.firebaseManager.addEvento(eventoData);
                this.eventos[newId] = eventoData;
                this.showToast('Evento agregado correctamente', 'success');
            }

            // Actualizar datos automáticamente después de guardar
            await this.refreshData();
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('eventoModal'));
            modal.hide();
        } catch (error) {
            console.error('Error guardando evento:', error);
            this.showToast('Error al guardar el evento', 'error');
        }
    }

    async saveParticipante() {
        try {
            const participanteData = {
                nombre: document.getElementById('participanteNombre').value,
                evento: parseInt(document.getElementById('participanteEvento').value)
            };

            const firebaseId = document.getElementById('participanteId').value;

            console.log('💾 Guardando participante:', { firebaseId, participanteData });

            if (firebaseId) {
                // Editando participante existente usando firebaseId
                console.log('🔄 Actualizando participante con firebaseId:', firebaseId);
                await window.firebaseManager.updateParticipante(firebaseId, participanteData);
                this.showToast('Participante actualizado correctamente', 'success');
            } else {
                // Creando nuevo participante
                console.log('➕ Creando nuevo participante');
                const newId = await window.firebaseManager.addParticipante(participanteData);
                console.log('✨ Nuevo participante creado con ID:', newId);
                this.showToast('Participante agregado correctamente', 'success');
            }

            // Actualizar datos automáticamente después de guardar
            await this.refreshData();
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('participanteModal'));
            modal.hide();
        } catch (error) {
            console.error('Error guardando participante:', error);
            this.showToast('Error al guardar el participante', 'error');
        }
    }

    editEvento(index) {
        const evento = this.eventos[index];
        if (!evento) return;

        document.getElementById('eventoId').value = index;
        document.getElementById('eventoFecha').value = evento.fecha;
        document.getElementById('eventoNombre').value = evento.nombre;
        document.getElementById('eventoModalTitle').textContent = 'Editar Evento';

        const modal = new bootstrap.Modal(document.getElementById('eventoModal'));
        modal.show();
    }

    editParticipante(index) {
        const participante = this.participantes[index];
        if (!participante) return;

        console.log('🔧 Editando participante:', index, participante);
        
        // Guardar el firebaseId en lugar del índice
        document.getElementById('participanteId').value = participante.firebaseId;
        document.getElementById('participanteNombre').value = participante.nombre;
        document.getElementById('participanteEvento').value = participante.evento;
        document.getElementById('participanteModalTitle').textContent = 'Editar Participante';

        const modal = new bootstrap.Modal(document.getElementById('participanteModal'));
        modal.show();
    }

    async deleteEvento(index) {
        if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) {
            return;
        }

        try {
            await window.firebaseManager.deleteEvento(index);
            this.showToast('Evento eliminado correctamente', 'success');
            
            // Actualizar datos automáticamente después de eliminar
            await this.refreshData();
        } catch (error) {
            console.error('Error eliminando evento:', error);
            this.showToast('Error al eliminar el evento', 'error');
        }
    }

    async deleteParticipante(index) {
        if (!confirm('¿Estás seguro de que deseas eliminar este participante?')) {
            return;
        }

        try {
            const participante = this.participantes[index];
            if (!participante || !participante.firebaseId) {
                console.error('❌ No se puede eliminar: participante no encontrado o sin firebaseId');
                this.showToast('Error al eliminar el participante', 'error');
                return;
            }

            console.log('🗑️ Eliminando participante:', { index, firebaseId: participante.firebaseId });
            await window.firebaseManager.deleteParticipante(participante.firebaseId);
            
            this.showToast('Participante eliminado correctamente', 'success');
            
            // Actualizar datos automáticamente después de eliminar
            await this.refreshData();
        } catch (error) {
            console.error('Error eliminando participante:', error);
            this.showToast('Error al eliminar el participante', 'error');
        }
    }

    filterParticipantes(searchTerm) {
        const filtered = window.firebaseManager.searchParticipantes(this.participantes, searchTerm);
        const tbody = document.querySelector('#participantesTable tbody');
        tbody.innerHTML = '';

        filtered.forEach((participante) => {
            if (!participante) return;

            const index = this.participantes.indexOf(participante);
            const evento = this.eventos[participante.evento] || {};
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${participante.nombre || ''}</td>
                <td>${evento.nombre || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="adminPanel.editParticipante(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteParticipante(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    clearEventoForm() {
        document.getElementById('eventoForm').reset();
        document.getElementById('eventoId').value = '';
        document.getElementById('eventoModalTitle').textContent = 'Nuevo Evento';
    }

    clearParticipanteForm() {
        document.getElementById('participanteForm').reset();
        document.getElementById('participanteId').value = '';
        document.getElementById('participanteModalTitle').textContent = 'Nuevo Participante';
    }

    // ========================================
    // FUNCIONES DE MANEJO DE FECHAS (dd/mm/yyyy)
    // ========================================

    /**
     * Validar formato de fecha dd/mm/yyyy
     */
    validateDateFormat(dateString) {
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = dateString.match(regex);
        
        if (!match) {
            return false;
        }

        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);

        // Validar rangos
        if (day < 1 || day > 31) return false;
        if (month < 1 || month > 12) return false;
        if (year < 1900 || year > 2100) return false;

        // Validar días por mes
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        // Verificar si es año bisiesto
        if (month === 2 && (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0))) {
            daysInMonth[1] = 29;
        }

        return day <= daysInMonth[month - 1];
    }

    /**
     * Convertir fecha de dd/mm/yyyy a formato Date
     */
    parseDateFromFormat(dateString) {
        if (!this.validateDateFormat(dateString)) {
            return null;
        }

        const [day, month, year] = dateString.split('/').map(Number);
        return new Date(year, month - 1, day);
    }

    /**
     * Formatear fecha para mostrar en inputs (dd/mm/yyyy)
     */
    formatDateForDisplay(dateString) {
        if (!dateString) return '';
        
        // Si ya está en formato dd/mm/yyyy, devolverlo tal como está
        if (this.validateDateFormat(dateString)) {
            return dateString;
        }

        // Si viene de Firebase en formato ISO o Date
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}/${month}/${year}`;
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Convertir fecha de dd/mm/yyyy a formato para guardar
     */
    formatDateForSave(dateString) {
        if (!dateString) return '';
        
        // Si ya está validado, devolverlo tal como está
        if (this.validateDateFormat(dateString)) {
            return dateString;
        }

        // Si es una fecha de Firebase, mantener formato original
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }

            // Formatear en dd/mm/yyyy para consistencia
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}/${month}/${year}`;
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Sobrescribir renderInfo para aplicar formato de fecha
     */
    renderInfo() {
        if (!this.info) return;

        document.getElementById('titulo').value = this.info.titulo || '';
        document.getElementById('fecha').value = this.formatDateForDisplay(this.info.fecha) || '';
        document.getElementById('lugar').value = this.info.lugar || '';
        document.getElementById('escuela').value = this.info.escuela || '';
        document.getElementById('horario').value = this.info.horario || '';
        document.getElementById('descripcion').value = this.info.descripcion || '';
        document.getElementById('ponente1').value = this.info.ponente1 || '';
        document.getElementById('ponente2').value = this.info.ponente2 || '';
        document.getElementById('ponente3').value = this.info.ponente3 || '';
        document.getElementById('correo').value = this.info.correo || '';
        document.getElementById('telefono').value = this.info.telefono || '';
    }

    /**
     * Sobrescribir saveInfo para aplicar formato de fecha
     */
    async saveInfo() {
        try {
            const fechaValue = document.getElementById('fecha').value.trim();
            
            // Validar formato de fecha
            if (fechaValue && !this.validateDateFormat(fechaValue)) {
                this.showToast('Formato de fecha inválido. Use dd/mm/yyyy', 'error');
                return;
            }

            const formData = {
                titulo: document.getElementById('titulo').value,
                fecha: this.formatDateForSave(fechaValue),
                lugar: document.getElementById('lugar').value,
                escuela: document.getElementById('escuela').value,
                horario: document.getElementById('horario').value,
                descripcion: document.getElementById('descripcion').value,
                ponente1: document.getElementById('ponente1').value,
                ponente2: document.getElementById('ponente2').value,
                ponente3: document.getElementById('ponente3').value,
                correo: document.getElementById('correo').value,
                telefono: document.getElementById('telefono').value
            };

            await window.firebaseManager.setInfo(formData);
            this.info = formData;
            this.showToast('Información guardada correctamente', 'success');
            
            // Actualizar datos automáticamente después de guardar
            await this.refreshData();
        } catch (error) {
            console.error('Error guardando info:', error);
            this.showToast('Error al guardar la información', 'error');
        }
    }

    /**
     * Sobrescribir editEvento para aplicar formato de fecha
     */
    editEvento(index) {
        const evento = this.eventos[index];
        if (!evento) return;

        document.getElementById('eventoId').value = index;
        document.getElementById('eventoFecha').value = this.formatDateForDisplay(evento.fecha);
        document.getElementById('eventoNombre').value = evento.nombre;
        document.getElementById('eventoModalTitle').textContent = 'Editar Evento';

        const modal = new bootstrap.Modal(document.getElementById('eventoModal'));
        modal.show();
    }

    /**
     * Sobrescribir saveEvento para aplicar formato de fecha
     */
    async saveEvento() {
        try {
            const fechaValue = document.getElementById('eventoFecha').value.trim();
            
            // Validar formato de fecha
            if (fechaValue && !this.validateDateFormat(fechaValue)) {
                this.showToast('Formato de fecha inválido. Use dd/mm/yyyy', 'error');
                return;
            }

            const eventoData = {
                fecha: this.formatDateForSave(fechaValue),
                nombre: document.getElementById('eventoNombre').value
            };

            const eventoId = document.getElementById('eventoId').value;

            if (eventoId) {
                await window.firebaseManager.updateEvento(eventoId, eventoData);
                this.eventos[eventoId] = eventoData;
                this.showToast('Evento actualizado correctamente', 'success');
            } else {
                const newId = await window.firebaseManager.addEvento(eventoData);
                this.eventos[newId] = eventoData;
                this.showToast('Evento agregado correctamente', 'success');
            }

            // Actualizar datos automáticamente después de guardar
            await this.refreshData();
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('eventoModal'));
            modal.hide();
        } catch (error) {
            console.error('Error guardando evento:', error);
            this.showToast('Error al guardar el evento', 'error');
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toastId = 'toast-' + Date.now();
        
        const toastClass = type === 'error' ? 'bg-danger' : type === 'success' ? 'bg-success' : 'bg-info';
        const iconClass = type === 'error' ? 'fa-exclamation-triangle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle';

        const toastHtml = `
            <div id="${toastId}" class="toast ${toastClass} text-white" role="alert">
                <div class="toast-header ${toastClass} text-white">
                    <i class="fas ${iconClass} me-2"></i>
                    <strong class="me-auto">${type === 'error' ? 'Error' : type === 'success' ? 'Éxito' : 'Información'}</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
        toast.show();

        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Instancia global del admin panel
let adminPanel;

// Inicializar el panel de administración cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
    
    // Hacer la instancia disponible globalmente para onclick
    window.adminPanel = adminPanel;
});