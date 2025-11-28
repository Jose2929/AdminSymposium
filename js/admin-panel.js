class AdminPanel {
    constructor() {
        this.currentSection = 'eventos';
        this.eventos = [];
        this.participantes = [];
        this.asistencia = [];
        this.currentImageFile = null;
        this.currentImageBase64 = '';
        this.cropper = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.showSection('eventos');
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

        // Filtro de asistencia por evento
        document.getElementById('asistenciaFilter').addEventListener('change', (e) => {
            this.filterAsistencia(e.target.value);
        });

        // Limpiar modales al cerrarse
        document.getElementById('eventoModal').addEventListener('hidden.bs.modal', () => {
            this.clearEventoForm();
        });

        document.getElementById('participanteModal').addEventListener('hidden.bs.modal', () => {
            this.clearParticipanteForm();
        });

        // Event listeners para manejo de imágenes
        this.setupImageEventListeners();
    }

    async loadData() {
        try {
            console.log('🚀 Iniciando carga de datos...');
            this.showToast('Cargando datos...', 'info');
            
            const data = await window.firebaseManager.getAllData();
            
            console.log('📊 Datos completos de Firebase:', data);
            
            this.eventos = this.convertEventosToArray(data.eventos);

            // Convertir participantes de objeto a array
            this.participantes = this.convertParticipantesToArray(data.participantes);
            this.asistencia = this.convertAsistenciaToArray(data.asistencia);

            console.log('📈 Estado después de cargar:');
            console.log('  - Eventos:', this.eventos);
            console.log('  - Participantes:', this.participantes);
            console.log('  - Asistencia:', this.asistencia);

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
            this.eventos = this.convertEventosToArray(data.eventos);
            this.participantes = this.convertParticipantesToArray(data.participantes);
            this.asistencia = this.convertAsistenciaToArray(data.asistencia);

            console.log('📈 Estado después de actualizar:');
            console.log('  - Eventos:', this.eventos.length);
            console.log('  - Participantes:', this.participantes.length);
            console.log('  - Asistencia:', this.asistencia.length);

            // Re-renderizar todas las secciones sin mostrar toast de carga
            this.renderEventos();
            this.renderParticipantes();
            this.renderAsistencia();
            this.populateEventoSelect();
            this.populateAsistenciaFilter();
            this.populateAsistenciaFilter();

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
            'eventos': 'Gestión de Eventos',
            'participantes': 'Gestión de Participantes',
            'asistencia': 'Registro de Asistencia'
        };
        document.getElementById('sectionTitle').textContent = titles[sectionName];

        this.currentSection = sectionName;
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
            const imagenPonente = evento.imagenPonente ? 
                `<img src="${evento.imagenPonente}" alt="Foto del ponente" class="ponente-image-circle-table">` : 
                '<div class="ponente-placeholder"><i class="fas fa-user"></i></div>';
            
            row.innerHTML = `
                <td class="text-center">${imagenPonente}</td>
                <td>${evento.nombre || ''}</td>
                <td>${evento.fecha || ''}</td>
                <td>${evento.lugar || ''}</td>
                <td>${evento.horario || ''}</td>
                <td>${evento.ponente1 || ''}</td>
                <td>${evento.telefono || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="adminPanel.editEvento('${evento.firebaseId}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteEvento('${evento.firebaseId}')">
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
            
            const evento = participante.evento;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${participante.nombre || ''}</td>
                <td>${evento || 'N/A'}</td>
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

    convertEventosToArray(eventosObj) {
        console.log('🔄 Convirtiendo eventos a array...');
        console.log('📥 Objeto eventos recibido:', eventosObj);

        if (!eventosObj || typeof eventosObj !== 'object') {
            console.log('⚠️ Eventos no es un objeto válido, retornando array vacío');
            return [];
        }

        const array = [];
        const keys = Object.keys(eventosObj);

        console.log('🔑 Keys encontradas:', keys);

        keys.forEach((key, index) => {
            const evento = eventosObj[key];
            if (evento) {
                console.log(`✅ Evento ${index} (key: ${key}):`, evento);
                // Agregar el ID de Firebase al objeto
                array[index] = {
                    ...evento,
                    firebaseId: key
                };
            }
        });

        console.log('📤 Array de eventos resultante:', array);
        return array;
    }

    convertAsistenciaToArray(asistenciaObj) {
        console.log('🔄 Convirtiendo asistencia a array...');
        console.log('📥 Objeto asistencia recibido:', asistenciaObj);

        if (!asistenciaObj || typeof asistenciaObj !== 'object') {
            console.log('⚠️ Asistencia no es un objeto válido, retornando array vacío');
            return [];
        }

        const array = [];
        const keys = Object.keys(asistenciaObj);

        console.log('🔑 Keys encontradas:', keys);

        keys.forEach((key) => {
            const asistencia = asistenciaObj[key];
            if (asistencia) {
                console.log(`✅ Asistencia (key: ${key}):`, asistencia);
                // Agregar el ID de Firebase al objeto
                array.push({
                    ...asistencia,
                    id: key
                });
            }
        });

        console.log('📤 Array de asistencia resultante:', array);
        return array;
    }

    renderAsistencia(filteredAsistencia = null) {
        const tbody = document.querySelector('#asistenciaTable tbody');
        tbody.innerHTML = '';

        const asistenciaToRender = filteredAsistencia || this.asistencia;

        console.log('🎯 Renderizando asistencia...', filteredAsistencia ? '(filtrada)' : '(completa)');
        console.log('  📋 Array asistencia a renderizar:', asistenciaToRender);
        console.log('  📏 Length del array:', asistenciaToRender.length);

        if (asistenciaToRender.length === 0) {
            console.log('  ⚠️ Array de asistencia está vacío');
            const colspan = filteredAsistencia ? '6' : '6';
            tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">No hay registros de asistencia${filteredAsistencia ? ' para este evento' : ''}</td></tr>`;
            return;
        }

        asistenciaToRender.forEach((registro) => {
            if (!registro) return;

            console.log(`  ✅ Procesando registro:`, registro);

            // Formatear fecha y hora
            let fechaStr = '';
            let horaStr = '';
            if (registro.fecha) {
                try {
                    const date = new Date(registro.fecha);
                    fechaStr = date.toLocaleDateString('es-ES');
                    horaStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                } catch (error) {
                    console.warn('Error formateando fecha:', registro.fecha, error);
                    fechaStr = registro.fecha;
                    horaStr = '';
                }
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${registro.nombre || ''}</td>
                <td>${registro.evento || ''}</td>
                <td>${fechaStr}</td>
                <td>${horaStr}</td>
                <td><span class="badge bg-success">Presente</span></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteAsistencia('${registro.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
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
            option.value = evento.nombre;
            option.textContent = evento.nombre;
            select.appendChild(option);
        }
    }

    populateAsistenciaFilter() {
        const select = document.getElementById('asistenciaFilter');
        if (!select) return;

        select.innerHTML = '<option value="todos">Todos los eventos</option>';

        console.log('📋 Poblando filtro de asistencia...');

        for (let i = 0; i < this.eventos.length; i++) {
            const evento = this.eventos[i];

            if (!evento) continue;

            console.log(`  ✅ Agregando evento al filtro ${i}:`, evento.nombre);

            const option = document.createElement('option');
            option.value = evento.nombre;
            option.textContent = evento.nombre;
            select.appendChild(option);
        }
    }



    async saveEvento() {
        try {
            const fechaValue = document.getElementById('eventoFecha').value.trim();

            // Validar formato de fecha
            if (fechaValue && !this.validateDateFormat(fechaValue)) {
                this.showToast('Formato de fecha inválido. Use dd/mm/yyyy', 'error');
                return;
            }

            const eventoData = {
                nombre: document.getElementById('eventoNombre').value,
                fecha: this.formatDateForSave(fechaValue),
                lugar: document.getElementById('eventoLugar').value,
                horario: document.getElementById('eventoHorario').value,
                descripcion: document.getElementById('eventoDescripcion').value,
                ponente1: document.getElementById('eventoPonente1').value,
                telefono: document.getElementById('eventoTelefono').value,
                imagenPonente: this.currentImageBase64 || ''
            };

            const firebaseId = document.getElementById('eventoId').value;

            if (firebaseId) {
                await window.firebaseManager.updateEvento(firebaseId, eventoData);
                this.showToast('Evento actualizado correctamente', 'success');
            } else {
                const newId = await window.firebaseManager.addEvento(eventoData);
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
                evento: document.getElementById('participanteEvento').value
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

    editEvento(firebaseId) {
        const evento = this.eventos.find(e => e.firebaseId === firebaseId);
        if (!evento) return;

        document.getElementById('eventoId').value = firebaseId;
        document.getElementById('eventoNombre').value = evento.nombre || '';
        document.getElementById('eventoFecha').value = this.formatDateForDisplay(evento.fecha) || '';
        document.getElementById('eventoLugar').value = evento.lugar || '';
        document.getElementById('eventoHorario').value = evento.horario || '';
        document.getElementById('eventoDescripcion').value = evento.descripcion || '';
        document.getElementById('eventoPonente1').value = evento.ponente1 || '';
        document.getElementById('eventoTelefono').value = evento.telefono || '';
        document.getElementById('eventoModalTitle').textContent = 'Editar Evento';

        // Cargar imagen del ponente si existe
        if (evento.imagenPonente) {
            this.loadExistingImage(evento.imagenPonente);
        } else {
            this.clearImagePreview();
        }

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

    async deleteEvento(firebaseId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) {
            return;
        }

        try {
            await window.firebaseManager.deleteEvento(firebaseId);
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

    async deleteAsistencia(asistenciaId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este registro de asistencia?')) {
            return;
        }

        try {
            await window.firebaseManager.deleteAsistencia(asistenciaId);
            this.showToast('Registro de asistencia eliminado correctamente', 'success');

            // Actualizar datos automáticamente después de eliminar
            await this.refreshData();
        } catch (error) {
            console.error('Error eliminando registro de asistencia:', error);
            this.showToast('Error al eliminar el registro de asistencia', 'error');
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

    filterAsistencia(eventName) {
        console.log('🔍 Filtrando asistencia por evento:', eventName);

        if (eventName === 'todos' || !eventName) {
            // Mostrar todos los registros
            this.renderAsistencia();
            return;
        }

        // Filtrar registros por evento
        const filteredAsistencia = this.asistencia.filter(registro =>
            registro && registro.evento && registro.evento.toLowerCase() === eventName.toLowerCase()
        );

        console.log('📋 Registros filtrados:', filteredAsistencia);
        this.renderAsistencia(filteredAsistencia);
    }

    clearEventoForm() {
        document.getElementById('eventoForm').reset();
        document.getElementById('eventoId').value = '';
        document.getElementById('eventoModalTitle').textContent = 'Nuevo Evento';
        this.clearImagePreview();
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









    // ========================================
    // FUNCIONES DE MANEJO DE IMÁGENES DEL PONENTE
    // ========================================

    setupImageEventListeners() {
        // Cargar imagen del ponente
        document.getElementById('ponenteImagen').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Botones de edición de imagen
        document.getElementById('editImagenBtn').addEventListener('click', () => {
            this.openCropModal();
        });

        document.getElementById('removeImagenBtn').addEventListener('click', () => {
            this.clearImagePreview();
        });

        // Event listeners para modal de recorte
        document.querySelectorAll('input[name="aspectRatio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (this.cropper) {
                    this.cropper.setAspectRatio(parseFloat(e.target.value));
                }
            });
        });

        document.getElementById('zoomSlider').addEventListener('input', (e) => {
            if (this.cropper) {
                this.cropper.zoomTo(parseFloat(e.target.value));
            }
        });

        document.getElementById('applyCropBtn').addEventListener('click', () => {
            this.applyCrop();
        });

        // Limpiar modal de imagen al cerrarse
        document.getElementById('cropImageModal').addEventListener('hidden.bs.modal', () => {
            if (this.cropper) {
                this.cropper.destroy();
                this.cropper = null;
            }
        });
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            this.showToast('Por favor, seleccione un archivo de imagen válido', 'error');
            return;
        }

        // Validar tamaño (5MB máximo)
        if (file.size > 5 * 1024 * 1024) {
            this.showToast('La imagen debe ser menor a 5MB', 'error');
            return;
        }

        this.currentImageFile = file;
        const reader = new FileReader();

        reader.onload = (e) => {
            this.currentImageBase64 = e.target.result;
            this.showImagePreview();
        };

        reader.readAsDataURL(file);
    }

    showImagePreview() {
        const preview = document.getElementById('imagenPreview');
        const imageDisplay = document.getElementById('imagenDisplay');
        const editBtn = document.getElementById('editImagenBtn');
        const removeBtn = document.getElementById('removeImagenBtn');

        imageDisplay.src = this.currentImageBase64;
        preview.style.display = 'block';
        editBtn.style.display = 'inline-block';
        removeBtn.style.display = 'inline-block';
    }

    loadExistingImage(base64) {
        this.currentImageBase64 = base64;
        this.currentImageFile = null;
        this.showImagePreview();
    }

    clearImagePreview() {
        const preview = document.getElementById('imagenPreview');
        const editBtn = document.getElementById('editImagenBtn');
        const removeBtn = document.getElementById('removeImagenBtn');
        const fileInput = document.getElementById('ponenteImagen');

        preview.style.display = 'none';
        editBtn.style.display = 'none';
        removeBtn.style.display = 'none';
        fileInput.value = '';
        
        this.currentImageFile = null;
        this.currentImageBase64 = '';
    }

    openCropModal() {
        if (!this.currentImageBase64) {
            this.showToast('No hay imagen para recortar', 'error');
            return;
        }

        const cropperImage = document.getElementById('cropperImage');
        cropperImage.src = this.currentImageBase64;

        const modal = new bootstrap.Modal(document.getElementById('cropImageModal'));
        modal.show();

        // Inicializar cropper después de que la imagen se carga
        cropperImage.onload = () => {
            if (this.cropper) {
                this.cropper.destroy();
            }

            this.cropper = new Cropper(cropperImage, {
                aspectRatio: NaN, // Libre por defecto
                viewMode: 1,
                autoCropArea: 0.8,
                responsive: true,
                background: false,
                checkCrossOrigin: false
            });
        };
    }

    applyCrop() {
        if (!this.cropper) return;

        const canvas = this.cropper.getCroppedCanvas({
            width: 400,
            height: 400,
            minWidth: 100,
            minHeight: 100,
            maxWidth: 600,
            maxHeight: 600,
            fillColor: '#fff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });

        this.currentImageBase64 = canvas.toDataURL('image/jpeg', 0.9);
        this.showImagePreview();

        const modal = bootstrap.Modal.getInstance(document.getElementById('cropImageModal'));
        modal.hide();
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