import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, get, set, push, remove, update, child } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

class FirebaseManager {
    constructor() {
        this.app = null;
        this.database = null;
        this.init();
    }

    init() {
        const firebaseConfig = {
            apiKey: "AIzaSyD_99EUF7i60QQ9IIqQwe9hzIN2yjEa2Ks",
            authDomain: "congresoapp-83547.firebaseapp.com",
            databaseURL: "https://congresoapp-83547-default-rtdb.firebaseio.com",
            projectId: "congresoapp-83547",
            storageBucket: "congresoapp-83547.firebasestorage.app",
            messagingSenderId: "689727649320",
            appId: "1:689727649320:web:8ab98cfc5b291d2792a71d"
        };
        this.app = initializeApp(firebaseConfig);
        this.database = getDatabase(this.app);
    }

    // ========================
    // MÉTODOS PARA INFO
    // ========================
    
    async getInfo() {
        try {
            const infoRef = ref(this.database, 'info');
            const snapshot = await get(infoRef);
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('Error obteniendo info:', error);
            throw error;
        }
    }

    async setInfo(infoData) {
        try {
            const infoRef = ref(this.database, 'info');
            await set(infoRef, infoData);
            return true;
        } catch (error) {
            console.error('Error guardando info:', error);
            throw error;
        }
    }

    async updateInfo(infoData) {
        try {
            const infoRef = ref(this.database, 'info');
            await update(infoRef, infoData);
            return true;
        } catch (error) {
            console.error('Error actualizando info:', error);
            throw error;
        }
    }

    // ========================
    // MÉTODOS PARA EVENTO
    // ========================
    
    async getEventos() {
        try {
            console.log('📅 FirebaseManager: Obteniendo eventos...');
            const eventosRef = ref(this.database, 'evento');
            const snapshot = await get(eventosRef);
            
            if (!snapshot.exists()) {
                console.log('📭 FirebaseManager: No hay datos de eventos en la base de datos');
                return [];
            }
            
            const data = snapshot.val();
            console.log('📊 FirebaseManager: Datos de eventos obtenidos de Firebase:', data);
            console.log('🔍 FirebaseManager: Tipo de datos eventos:', typeof data);
            console.log('📏 FirebaseManager: Es array eventos?', Array.isArray(data));
            
            return data;
        } catch (error) {
            console.error('❌ Error obteniendo eventos:', error);
            throw error;
        }
    }

    async addEvento(eventoData) {
        try {
            const eventosRef = ref(this.database, 'evento');
            const newEventRef = push(eventosRef);
            await set(newEventRef, eventoData);
            return newEventRef.key;
        } catch (error) {
            console.error('Error agregando evento:', error);
            throw error;
        }
    }

    async updateEvento(eventoId, eventoData) {
        try {
            const eventoRef = ref(this.database, `evento/${eventoId}`);
            await set(eventoRef, eventoData);
            return true;
        } catch (error) {
            console.error('Error actualizando evento:', error);
            throw error;
        }
    }

    async deleteEvento(eventoId) {
        try {
            const eventoRef = ref(this.database, `evento/${eventoId}`);
            await remove(eventoRef);
            return true;
        } catch (error) {
            console.error('Error eliminando evento:', error);
            throw error;
        }
    }

    // ========================
    // MÉTODOS PARA PARTICIPANTE
    // ========================
    
    async getParticipantes() {
        try {
            console.log('👥 FirebaseManager: Obteniendo participantes...');
            const participantesRef = ref(this.database, 'participante');
            const snapshot = await get(participantesRef);
            
            if (!snapshot.exists()) {
                console.log('📭 FirebaseManager: No hay datos de participantes en la base de datos');
                return [];
            }
            
            const data = snapshot.val();
            console.log('📊 FirebaseManager: Datos de participantes obtenidos de Firebase:', data);
            console.log('🔍 FirebaseManager: Tipo de datos:', typeof data);
            console.log('📏 FirebaseManager: Es array?', Array.isArray(data));
            
            return data;
        } catch (error) {
            console.error('❌ Error obteniendo participantes:', error);
            throw error;
        }
    }

    async addParticipante(participanteData) {
        try {
            const participantesRef = ref(this.database, 'participante');
            const newParticipanteRef = push(participantesRef);
            await set(newParticipanteRef, participanteData);
            return newParticipanteRef.key;
        } catch (error) {
            console.error('Error agregando participante:', error);
            throw error;
        }
    }

    async updateParticipante(participanteId, participanteData) {
        try {
            const participanteRef = ref(this.database, `participante/${participanteId}`);
            await set(participanteRef, participanteData);
            return true;
        } catch (error) {
            console.error('Error actualizando participante:', error);
            throw error;
        }
    }

    async deleteParticipante(participanteId) {
        try {
            const participanteRef = ref(this.database, `participante/${participanteId}`);
            await remove(participanteRef);
            return true;
        } catch (error) {
            console.error('Error eliminando participante:', error);
            throw error;
        }
    }

    // ========================
    // MÉTODOS PARA ASISTENCIA
    // ========================
    
    async getAsistencia() {
        try {
            const asistenciaRef = ref(this.database, 'asistencia');
            const snapshot = await get(asistenciaRef);
            return snapshot.exists() ? snapshot.val() : [];
        } catch (error) {
            console.error('Error obteniendo asistencia:', error);
            throw error;
        }
    }

    async registrarAsistencia(asistenciaData) {
        try {
            const asistenciaRef = ref(this.database, 'asistencia');
            const newAsistenciaRef = push(asistenciaRef);
            await set(newAsistenciaRef, {
                ...asistenciaData,
                timestamp: Date.now(),
                fecha: new Date().toLocaleDateString('es-MX'),
                hora: new Date().toLocaleTimeString('es-MX')
            });
            return newAsistenciaRef.key;
        } catch (error) {
            console.error('Error registrando asistencia:', error);
            throw error;
        }
    }

    async deleteAsistencia(asistenciaId) {
        try {
            const asistenciaRef = ref(this.database, `asistencia/${asistenciaId}`);
            await remove(asistenciaRef);
            return true;
        } catch (error) {
            console.error('Error eliminando asistencia:', error);
            throw error;
        }
    }

    // ========================
    // MÉTODOS DE UTILIDAD
    // ========================
    
    async getAllData() {
        try {
            console.log('🔄 FirebaseManager: Iniciando getAllData...');
            const [info, eventos, participantes, asistencia] = await Promise.all([
                this.getInfo(),
                this.getEventos(),
                this.getParticipantes(),
                this.getAsistencia()
            ]);
            
            console.log('📊 FirebaseManager - Info obtenida:', info);
            console.log('📅 FirebaseManager - Eventos obtenidos:', eventos);
            console.log('👥 FirebaseManager - Participantes obtenidos:', participantes);
            console.log('✅ FirebaseManager - Asistencia obtenida:', asistencia);
            
            const result = {
                info: info || {},
                eventos: eventos || [],
                participantes: participantes || [],
                asistencia: asistencia || []
            };
            
            console.log('🎯 FirebaseManager - Resultado final:', result);
            return result;
        } catch (error) {
            console.error('❌ FirebaseManager - Error obteniendo todos los datos:', error);
            throw error;
        }
    }

    // Búsqueda y filtrado
    searchParticipantes(participantes, searchTerm) {
        if (!searchTerm) return participantes;
        
        return participantes.filter(participante => 
            participante && 
            (participante.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             participante.evento?.toString().includes(searchTerm))
        );
    }

    filterAsistencia(asistencia, dateFilter = null) {
        if (!dateFilter) return asistencia;
        
        return asistencia.filter(item => 
            item && item.fecha === dateFilter
        );
    }
}

// Inicializar FirebaseManager
const firebaseManager = new FirebaseManager();

// Hacer disponible globalmente
window.firebaseManager = firebaseManager;

export { FirebaseManager };