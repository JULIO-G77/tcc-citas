// =============================================
// 🏥 JAVASCRIPT PANEL ADMINISTRATIVO - SISTEMA HOSPITALARIO
// =============================================

const ADMIN_API = 'http://localhost:3000/api/admin';
// 🌀 FUNCIONES DE LOADING
function showLoading(section = '') {
    // Puedes implementar un spinner visual si quieres
    console.log('🔄 Cargando...');
}

function hideLoading(section = '') {
    console.log('✅ Carga completada');
}
// 🎯 VARIABLES GLOBALES
let currentAdmin = null;
let currentTab = 'patients';

// 📱 INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 Inicializando Panel Administrativo...');
    checkAdminAuth();
    updateDateTime();
    setInterval(updateDateTime, 60000); // Actualizar cada minuto
});

// 🔐 VERIFICAR AUTENTICACIÓN
function checkAdminAuth() {
    const adminData = localStorage.getItem('adminData');
    if (adminData) {
        try {
            currentAdmin = JSON.parse(adminData);
            showAdminDashboard();
            loadDashboardStats();
            loadSpecialties();
            loadPatients();
        } catch (e) {
            console.error('Error parsing admin data:', e);
            showLogin();
        }
    } else {
        showLogin();
    }
}

// 🕐 ACTUALIZAR FECHA Y HORA
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('currentDateTime').textContent = 
        now.toLocaleDateString('es-ES', options);
}

// 👁️ MOSTRAR/OCULTAR SECCIONES
function showLogin() {
    document.getElementById('loginAdmin').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showAdminDashboard() {
    document.getElementById('loginAdmin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    document.getElementById('adminWelcome').textContent = 
        `Bienvenido, ${currentAdmin.full_name} (${currentAdmin.role})`;
}

// 🔐 LOGIN ADMINISTRATIVO
document.getElementById('adminLoginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    try {
        const response = await fetch(`${ADMIN_API}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // ✅ Login exitoso
            currentAdmin = result.admin;
            localStorage.setItem('adminData', JSON.stringify(result.admin));
            showAdminDashboard();
            loadDashboardStats();
            loadSpecialties();
            loadPatients();
            showNotification('✅ ' + result.message, 'success');
        } else {
            showNotification('❌ ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showNotification('❌ Error de conexión con el servidor', 'error');
    }
});

// 🚪 LOGOUT ADMIN
function adminLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('adminData');
        currentAdmin = null;
        showLogin();
        showNotification('👋 Sesión cerrada exitosamente', 'info');
    }
}

// 📊 CARGAR ESTADÍSTICAS DEL DASHBOARD
async function loadDashboardStats() {
    try {
        const response = await fetch(`${ADMIN_API}/dashboard/stats`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Actualizar tarjetas de estadísticas
            document.getElementById('totalPatients').textContent = result.stats.total_patients;
            document.getElementById('totalDoctors').textContent = result.stats.total_doctors;
            document.getElementById('totalAppointments').textContent = result.stats.total_appointments;
            document.getElementById('todayAppointments').textContent = result.stats.today_appointments;
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        showNotification('❌ Error cargando estadísticas', 'error');
    }
}

// 🩺 CARGAR ESPECIALIDADES PARA FILTROS
async function loadSpecialties() {
    try {
        // En una implementación real, esto vendría de la API
        const specialties = [
            'Cardiología', 'Pediatría', 'Dermatología', 'Ginecología',
            'Ortopedia', 'Psicología', 'Neurología', 'Oftalmología'
        ];
        
        const select = document.getElementById('specialtyFilter');
        select.innerHTML = '<option value="">Todas las especialidades</option>';
        
        specialties.forEach(specialty => {
            const option = document.createElement('option');
            option.value = specialty;
            option.textContent = specialty;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando especialidades:', error);
    }
}

// 👥 CARGAR PACIENTES
async function loadPatients(page = 1) {
    try {
        const search = document.getElementById('searchPatients').value;
        const params = new URLSearchParams({ page, limit: 10 });
        
        if (search) {
            params.append('search', search);
        }
        
        const response = await fetch(`${ADMIN_API}/patients?${params}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            renderPatientsTable(result.patients);
            renderPagination('patientsPagination', result.pagination, loadPatients);
        }
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        showNotification('❌ Error cargando pacientes', 'error');
    }
}

// 🩺 CARGAR DOCTORES
async function loadDoctors(page = 1) {
    try {
        const specialty = document.getElementById('specialtyFilter').value;
        const search = document.getElementById('searchDoctors').value;
        const params = new URLSearchParams({ page, limit: 10 });
        
        if (specialty) params.append('specialty', specialty);
        if (search) params.append('search', search);
        
        const response = await fetch(`${ADMIN_API}/doctors?${params}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            renderDoctorsTable(result.doctors);
            renderPagination('doctorsPagination', result.pagination, loadDoctors);
        }
    } catch (error) {
        console.error('Error cargando doctores:', error);
        showNotification('❌ Error cargando doctores', 'error');
    }
}

// // 📅 CARGAR CITAS - VERSIÓN CORREGIDA CON FILTROS
async function loadAppointments(page = 1) {
    try {
        console.log('🔍 Cargando citas...');
        
        // Obtener valores de los filtros
        const status = document.getElementById('statusFilter').value;
        const date = document.getElementById('dateFilter').value;
        const limit = 10;

        // Construir URL con parámetros
        let url = `${ADMIN_API}/appointments?page=${page}&limit=${limit}`;
        
        if (status) {
            url += `&status=${status}`;
            console.log('🔍 Filtro estado:', status);
        }
        
        if (date) {
            url += `&date=${date}`;
            console.log('🔍 Filtro fecha:', date);
        }

        console.log('🔍 URL:', url);

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Citas cargadas:', data.appointments.length);
            displayAppointments(data.appointments);
            setupAppointmentsPagination(data.pagination);
        } else {
            throw new Error(data.error || 'Error al cargar citas');
        }

    } catch (error) {
        console.error('❌ Error cargando citas:', error);
        const tbody = document.getElementById('appointmentsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error cargando citas: ' + error.message + '</td></tr>';
        }
        showNotification('❌ Error cargando citas: ' + error.message, 'error');
    }
}

// Función para mostrar citas en la tabla - VERSIÓN MEJORADA
function displayAppointments(appointments) {
    const tbody = document.getElementById('appointmentsTableBody');
    
    if (!tbody) {
        console.error('No se encontró el elemento appointmentsTableBody');
        return;
    }
    
    if (appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron citas</td></tr>';
        return;
    }

    tbody.innerHTML = appointments.map(appointment => `
        <tr>
            <td class="text-center">
                <input type="checkbox" class="appointment-checkbox" value="${appointment.id}">
            </td>
            <td>${appointment.id}</td>
            <td>
                <strong>${appointment.patient_first_name} ${appointment.patient_last_name}</strong><br>
                <small class="text-muted">${appointment.patient_phone || 'Sin teléfono'}</small>
            </td>
            <td>
                <strong>${appointment.doctor_name}</strong><br>
                <small class="text-muted">${appointment.specialty || 'Sin especialidad'}</small>
            </td>
            <td>
                <strong>${formatDateTime(appointment.appointment_date)}</strong>
            </td>
            <td>
                <span class="status-badge ${getStatusBadge(appointment.status)}">
                    ${appointment.status}
                </span>
            </td>
            <td>${appointment.reason || 'No especificado'}</td>
            <td class="text-center">
                <button class="btn btn-warning btn-sm me-1" onclick="editAppointment(${appointment.id})" title="Editar cita">
                    ✏️ Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteAppointment(${appointment.id})" title="Cancelar cita">
                    🗑️ Cancelar
                </button>
            </td>
        </tr>
    `).join('');

    // Configurar selección múltiple
    setupAppointmentSelection();
}


// 🔢 PAGINACIÓN PARA CITAS
function setupAppointmentsPagination(pagination) {
    renderPagination('appointmentsPagination', pagination, loadAppointments);
}

// Función para obtener clase CSS según estado
function getStatusBadge(status) {
    const statusClasses = {
        'pendiente': 'bg-warning',
        'confirmada': 'bg-primary',
        'completada': 'bg-success',
        'cancelada': 'bg-danger'
    };
    return statusClasses[status] || 'bg-secondary';
}

// Función para formatear fecha y hora
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Configurar selección de citas - VERSIÓN MEJORADA
function setupAppointmentSelection() {
    const selectAll = document.getElementById('selectAllAppointments');
    const checkboxes = document.querySelectorAll('.appointment-checkbox');
    
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateSelectionButtons();
        });
    }
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (!this.checked && selectAll) {
                selectAll.checked = false;
            }
            updateSelectionButtons();
        });
    });
    
    updateSelectionButtons();
}

// Actualizar estado de botones de selección
function updateSelectionButtons() {
    const selected = getSelectedAppointments();
    const editBtn = document.querySelector('button[onclick="editSelectedAppointment()"]');
    const deleteBtn = document.querySelector('button[onclick="deleteSelectedAppointment()"]');
    
    if (editBtn) {
        editBtn.disabled = selected.length !== 1;
    }
    if (deleteBtn) {
        deleteBtn.disabled = selected.length === 0;
    }
}

// 📈 GENERAR REPORTE
async function generateReport() {
    try {
        const reportType = document.getElementById('reportType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            showNotification('❌ Seleccione un rango de fechas', 'warning');
            return;
        }
        
        const params = new URLSearchParams({
            report_type: reportType,
            start_date: startDate,
            end_date: endDate
        });
        
        const response = await fetch(`${ADMIN_API}/reports?${params}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            renderReportResults(result);
        }
    } catch (error) {
        console.error('Error generando reporte:', error);
        showNotification('❌ Error generando reporte', 'error');
    }
}

// 🎨 RENDERIZAR TABLA DE PACIENTES
function renderPatientsTable(patients) {
    const tbody = document.getElementById('patientsTableBody');
    tbody.innerHTML = '';
    
    if (patients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No se encontraron pacientes</td></tr>';
        return;
    }
    
    patients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.first_name} ${patient.last_name}</td>
            <td>${patient.email || 'N/A'}</td>
            <td>${patient.phone || 'N/A'}</td>
            <td>${patient.total_citas || 0}</td>
            <td>${new Date(patient.created_at).toLocaleDateString('es-ES')}</td>
        `;
        tbody.appendChild(row);
    });
}

// 🎨 RENDERIZAR TABLA DE DOCTORES
function renderDoctorsTable(doctors) {
    const tbody = document.getElementById('doctorsTableBody');
    tbody.innerHTML = '';
    
    if (doctors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No se encontraron doctores</td></tr>';
        return;
    }
    
    doctors.forEach(doctor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doctor.id}</td>
            <td>${doctor.name}</td>
            <td>${doctor.specialty}</td>
            <td>${doctor.email || 'N/A'}</td>
            <td>${doctor.total_citas || 0}</td>
        `;
        tbody.appendChild(row);
    });
}

// 🎨 RENDERIZAR TABLA DE CITAS
function renderAppointmentsTable(appointments) {
    const tbody = document.getElementById('appointmentsTableBody');
    tbody.innerHTML = '';
    
    if (appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No se encontraron citas</td></tr>';
        return;
    }
    
    appointments.forEach(appointment => {
        const row = document.createElement('tr');
        const date = new Date(appointment.appointment_date);
        row.innerHTML = `
            <td>${appointment.id}</td>
            <td>${appointment.patient_first_name} ${appointment.patient_last_name}</td>
            <td>${appointment.doctor_name}</td>
            <td>${appointment.specialty}</td>
            <td>${date.toLocaleString('es-ES')}</td>
            <td><span class="status-${appointment.status}">${appointment.status}</span></td>
            <td>${appointment.reason || 'Consulta general'}</td>
        `;
        tbody.appendChild(row);
    });
}

// 🎨 RENDERIZAR RESULTADOS DE REPORTE
function renderReportResults(result) {
    const container = document.getElementById('reportResults');
    
    let html = `
        <div class="report-header">
            <h3>📊 Reporte: ${getReportTypeName(result.report_type)}</h3>
            <p>Período: ${result.period.start_date} a ${result.period.end_date}</p>
        </div>
    `;
    
    if (result.data.length === 0) {
        html += '<div class="no-data">No hay datos para el período seleccionado</div>';
    } else {
        html += '<div class="report-table"><table><thead><tr>';
        
        // Encabezados dinámicos basados en el tipo de reporte
        const headers = Object.keys(result.data[0]);
        headers.forEach(header => {
            html += `<th>${formatHeader(header)}</th>`;
        });
        
        html += '</tr></thead><tbody>';
        
        result.data.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                html += `<td>${formatCell(row[header], header)}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
    }
    
    container.innerHTML = html;
}

// 🔢 RENDERIZAR PAGINACIÓN
function renderPagination(containerId, pagination, loadFunction) {
    const container = document.getElementById(containerId);
    const { page, totalPages, total } = pagination;
    
    let html = `
        <div class="pagination-info">
            Página ${page} de ${totalPages} - Total: ${total} registros
        </div>
        <div class="pagination-controls">
    `;
    
    // Botón anterior
    if (page > 1) {
        html += `<button onclick="${loadFunction.name}(${page - 1})" class="btn btn-secondary">‹ Anterior</button>`;
    }
    
    // Números de página
    for (let i = 1; i <= totalPages; i++) {
        if (i === page) {
            html += `<button class="btn btn-primary active">${i}</button>`;
        } else {
            html += `<button onclick="${loadFunction.name}(${i})" class="btn btn-secondary">${i}</button>`;
        }
    }
    
    // Botón siguiente
    if (page < totalPages) {
        html += `<button onclick="${loadFunction.name}(${page + 1})" class="btn btn-secondary">Siguiente ›</button>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// 🎛️ CAMBIAR PESTAÑAS
function showTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Desactivar todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar pestaña seleccionada
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Activar botón seleccionado
    event.target.classList.add('active');
    
    // Cargar datos si es necesario
    currentTab = tabName;
    switch(tabName) {
        case 'patients':
            loadPatients();
            break;
        case 'doctors':
            loadDoctors();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'reports':
            // No cargar automáticamente
            break;
    }
}

// 🔍 BUSCAR PACIENTES
function searchPatients() {
    loadPatients(1);
}

// 🔔 MOSTRAR NOTIFICACIONES
function showNotification(message, type = 'info') {
    const container = document.getElementById('adminNotifications');
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// 🛠️ FUNCIONES UTILITARIAS
function getReportTypeName(type) {
    const names = {
        'appointments_by_specialty': 'Citas por Especialidad',
        'patient_activity': 'Actividad de Pacientes',
        'doctor_performance': 'Rendimiento de Doctores'
    };
    return names[type] || type;
}

function formatHeader(header) {
    const headers = {
        'specialty': 'Especialidad',
        'total_citas': 'Total Citas',
        'avg_booking_time': 'Tiempo Promedio (min)',
        'first_name': 'Nombre',
        'last_name': 'Apellido',
        'last_appointment': 'Última Cita',
        'citas_completadas': 'Citas Completadas'
    };
    return headers[header] || header.replace(/_/g, ' ').toUpperCase();
}

function formatCell(value, header) {
    if (value === null || value === undefined) return 'N/A';
    
    if (header === 'last_appointment' || header.includes('date')) {
        return new Date(value).toLocaleDateString('es-ES');
    }
    
    if (header === 'avg_booking_time') {
        return Math.round(value) + ' min';
    }
    
    return value;
}
// =============================================
// 🎯 FUNCIONES COMPLETAS PARA GESTIÓN DE CITAS
// =============================================

// Función para obtener citas seleccionadas
function getSelectedAppointments() {
    const checkboxes = document.querySelectorAll('.appointment-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Función para seleccionar/deseleccionar todas las citas
function toggleAllAppointments() {
    const selectAll = document.getElementById('selectAllAppointments');
    const checkboxes = document.querySelectorAll('.appointment-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

// 🆕 FUNCIÓN COMPLETA: Editar cita individual (desde botón en fila)
function editAppointment(id) {
    console.log('✏️ Editando cita ID:', id);
    
    if (!id) {
        showNotification('Error: ID de cita no válido', 'error');
        return;
    }
    
    // Verificar que la función showCreateAppointmentModal existe
    if (typeof showCreateAppointmentModal === 'function') {
        showCreateAppointmentModal(id);
    } else {
        console.error('❌ showCreateAppointmentModal no está definida');
        showNotification('Error: Función de edición no disponible', 'error');
    }
}

// 🆕 FUNCIÓN COMPLETA: Eliminar cita individual (desde botón en fila)
async function deleteAppointment(id) {
    if (!confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
        return;
    }
    
    try {
        console.log('🗑️ Cancelando cita ID:', id);
        
        const response = await fetch(`${ADMIN_API}/appointments/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showNotification('✅ Cita cancelada exitosamente', 'success');
            console.log('✅ Cita cancelada, recargando lista...');
            
            // Recargar la lista después de un breve delay
            setTimeout(() => {
                loadAppointments();
            }, 500);
            
        } else {
            const errorMsg = result.error || 'Error cancelando cita';
            console.error('❌ Error cancelando cita:', errorMsg);
            showNotification('❌ ' + errorMsg, 'error');
        }
        
    } catch (error) {
        console.error('❌ Error de conexión cancelando cita:', error);
        showNotification('❌ Error de conexión al cancelar cita', 'error');
    }
}

// 🆕 FUNCIÓN COMPLETA: Mostrar modal para crear/editar cita
async function showCreateAppointmentModal(appointmentId = null) {
    try {
        // Cargar datos para los selects
        await loadPatientsForSelect();
        await loadDoctorsForSelect();
        
        const modal = document.getElementById('appointmentModal');
        const title = document.getElementById('appointmentModalTitle');
        const form = document.getElementById('appointmentForm');
        
        if (appointmentId) {
            // Modo edición
            title.textContent = '✏️ Editar Cita';
            await loadAppointmentData(appointmentId);
        } else {
            // Modo creación
            title.textContent = '➕ Nueva Cita';
            form.reset();
            document.getElementById('appointmentId').value = '';
            document.getElementById('appointmentStatus').value = 'pendiente';
            
            // Establecer fecha mínima como hoy
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById('appointmentDate').value = localDateTime;
        }
        
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error al abrir modal de cita:', error);
        showNotification('Error al cargar el formulario', 'error');
    }
}

// 🆕 FUNCIÓN COMPLETA: Cargar datos de pacientes para select
async function loadPatientsForSelect() {
    try {
        const response = await fetch('/api/admin/patients-select');
        const data = await response.json();
        
        const select = document.getElementById('appointmentPatient');
        select.innerHTML = '<option value="">Seleccionar paciente...</option>';
        
        if (data.success && data.patients) {
            data.patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.first_name} ${patient.last_name} - ${patient.phone || 'Sin teléfono'}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        showNotification('Error cargando lista de pacientes', 'error');
    }
}

// 🆕 FUNCIÓN COMPLETA: Cargar datos de doctores para select
async function loadDoctorsForSelect() {
    try {
        const response = await fetch('/api/admin/doctors-select');
        const data = await response.json();
        
        const select = document.getElementById('appointmentDoctor');
        select.innerHTML = '<option value="">Seleccionar doctor...</option>';
        
        if (data.success && data.doctors) {
            data.doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = `${doctor.name} - ${doctor.specialty || 'Sin especialidad'}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando doctores:', error);
        showNotification('Error cargando lista de doctores', 'error');
    }
}

// 🆕 FUNCIÓN COMPLETA: Cargar datos de una cita específica
async function loadAppointmentData(appointmentId) {
    try {
        const response = await fetch(`/api/admin/appointments/${appointmentId}`);
        const data = await response.json();
        
        if (data.success && data.appointment) {
            const appointment = data.appointment;
            
            // Formatear fecha para el input datetime-local
            const appointmentDate = new Date(appointment.appointment_date);
            const localDateTime = new Date(appointmentDate.getTime() - appointmentDate.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            
            document.getElementById('appointmentId').value = appointment.id;
            document.getElementById('appointmentPatient').value = appointment.patient_id;
            document.getElementById('appointmentDoctor').value = appointment.doctor_id;
            document.getElementById('appointmentDate').value = localDateTime;
            document.getElementById('appointmentStatus').value = appointment.status;
            document.getElementById('appointmentReason').value = appointment.reason || '';
        }
    } catch (error) {
        console.error('Error cargando datos de cita:', error);
        showNotification('Error cargando datos de la cita', 'error');
    }
}

// 🆕 FUNCIÓN COMPLETA: Guardar cita (crear o actualizar)
async function saveAppointment() {
    try {
        const form = document.getElementById('appointmentForm');
        const appointmentId = document.getElementById('appointmentId').value;
        
        // Validar formulario
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const formData = {
            patient_id: document.getElementById('appointmentPatient').value,
            doctor_id: document.getElementById('appointmentDoctor').value,
            appointment_date: document.getElementById('appointmentDate').value,
            status: document.getElementById('appointmentStatus').value,
            reason: document.getElementById('appointmentReason').value
        };
        
        let response;
        if (appointmentId) {
            // Actualizar cita existente
            response = await fetch(`/api/admin/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
        } else {
            // Crear nueva cita
            response = await fetch('/api/admin/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
        }
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            closeAppointmentModal();
            loadAppointments(); // Recargar la lista
            showNotification(
                appointmentId ? '✅ Cita actualizada exitosamente' : '✅ Cita creada exitosamente', 
                'success'
            );
        } else {
            showNotification('❌ ' + (result.error || 'Error guardando cita'), 'error');
        }
        
    } catch (error) {
        console.error('Error guardando cita:', error);
        showNotification('❌ Error de conexión al guardar cita', 'error');
    }
}

// 🆕 FUNCIÓN COMPLETA: Editar cita individual
function editAppointment(id) {
    showCreateAppointmentModal(id);
}

// 🆕 FUNCIÓN COMPLETA: Eliminar cita individual
async function deleteAppointment(id) {
    if (!confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/appointments/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            loadAppointments(); // Recargar la lista
            showNotification('✅ Cita cancelada exitosamente', 'success');
        } else {
            showNotification('❌ ' + (result.error || 'Error cancelando cita'), 'error');
        }
        
    } catch (error) {
        console.error('Error cancelando cita:', error);
        showNotification('❌ Error de conexión al cancelar cita', 'error');
    }
}
// 🆕 FUNCIÓN: Cerrar modal de cita
function closeAppointmentModal() {
    console.log('❌ Cerrando modal de cita');
    document.getElementById('appointmentModal').style.display = 'none';
}

// Función para limpiar filtros - VERSIÓN CORREGIDA
function clearAppointmentFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFilter').value = '';
    loadAppointments(1);
}

// 🆕 Configurar eventos del modal
document.addEventListener('DOMContentLoaded', function() {
    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('appointmentModal');
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeAppointmentModal();
        }
    });
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeAppointmentModal();
        }
    });
});

// 🌐 MANEJO DE ERRORES DE RED
window.addEventListener('online', () => {
    showNotification('✅ Conexión restaurada', 'success');
});

window.addEventListener('offline', () => {
    showNotification('⚠️ Sin conexión a internet', 'warning');
});