// dashboard.js - VERSIÓN COMPLETAMENTE CORREGIDA
const API = 'http://localhost:3000/api';

// ✅ VERIFICAR AUTENTICACIÓN
function checkAuth() {
    const patientId = getPatientId();
    if (!patientId) {
        alert('❌ Debes iniciar sesión primero');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ✅ OBTENER ID DEL PACIENTE
function getPatientId() {
    const patientData = localStorage.getItem('patientData');
    if (patientData) {
        try {
            const patient = JSON.parse(patientData);
            return patient.id;
        } catch (e) {
            console.error('Error parseando patientData:', e);
        }
    }
    return null;
}

let isEditing = false;

// ✅ CARGAR PERFIL
async function loadPatientProfile() {
    try {
        const patientId = getPatientId();
        if (!patientId) return;
        
        console.log('🆔 Cargando perfil del paciente ID:', patientId);
        
        const response = await fetch(`${API}/patients/${patientId}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        
        const result = await response.json();
        const patient = result.data || result;
        
        const profileDiv = document.getElementById('patientProfile');
        
        if (!patient) {
            throw new Error('No se recibieron datos del paciente');
        }
        
        if (!isEditing) {
            // MODO VISUALIZACIÓN
            profileDiv.innerHTML = `
                <div class="profile-info">
                    <p><strong>Nombre:</strong> ${patient.first_name} ${patient.last_name}</p>
                    <p><strong>Email:</strong> ${patient.email || 'No registrado'}</p>
                    <p><strong>Teléfono:</strong> ${patient.phone || 'No registrado'}</p>
                    <p><strong>Género:</strong> ${patient.gender || 'No especificado'}</p>
                    <p><strong>Fecha Nacimiento:</strong> ${patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('es-ES') : 'No registrada'}</p>
                </div>
                <button onclick="enableEditMode()" class="btn btn-secondary">✏️ Editar Perfil</button>
            `;
        } else {
            // MODO EDICIÓN
            profileDiv.innerHTML = `
                <form id="editProfileForm" class="edit-form">
                    <div class="form-grid">
                        <input type="text" id="editFirstName" value="${patient.first_name}" placeholder="Nombre" required>
                        <input type="text" id="editLastName" value="${patient.last_name}" placeholder="Apellido" required>
                        <input type="date" id="editBirthDate" value="${patient.birth_date || ''}">
                        <select id="editGender">
                            <option value="">Género</option>
                            <option value="masculino" ${patient.gender === 'masculino' ? 'selected' : ''}>Masculino</option>
                            <option value="femenino" ${patient.gender === 'femenino' ? 'selected' : ''}>Femenino</option>
                            <option value="otro" ${patient.gender === 'otro' ? 'selected' : ''}>Otro</option>
                        </select>
                        <input type="tel" id="editPhone" value="${patient.phone || ''}" placeholder="Teléfono" required>
                        <input type="email" id="editEmail" value="${patient.email || ''}" placeholder="Email" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">💾 Guardar Cambios</button>
                        <button type="button" onclick="cancelEdit()" class="btn btn-secondary">❌ Cancelar</button>
                    </div>
                </form>
            `;
            
            document.getElementById('editProfileForm').addEventListener('submit', saveProfileChanges);
        }
        
        // Actualizar bienvenida
        const welcomeElement = document.getElementById('userWelcome');
        if (welcomeElement) {
            welcomeElement.textContent = `Bienvenido, ${patient.first_name}`;
        }
        
        console.log('✅ Perfil cargado correctamente');
        
    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        const profileDiv = document.getElementById('patientProfile');
        if (profileDiv) {
            profileDiv.innerHTML = `
                <div class="error-message">
                    <p>❌ Error cargando perfil: ${error.message}</p>
                    <button onclick="loadPatientProfile()" class="btn btn-secondary">🔄 Reintentar</button>
                </div>
            `;
        }
    }
}

// ✅ ACTIVAR MODO EDICIÓN
function enableEditMode() {
    isEditing = true;
    loadPatientProfile();
}

// ✅ CANCELAR EDICIÓN
function cancelEdit() {
    isEditing = false;
    loadPatientProfile();
}

// ✅ GUARDAR CAMBIOS DEL PERFIL
async function saveProfileChanges(e) {
    e.preventDefault();
    
    try {
        const patientId = getPatientId();
        const updatedData = {
            first_name: document.getElementById('editFirstName').value,
            last_name: document.getElementById('editLastName').value,
            birth_date: document.getElementById('editBirthDate').value,
            gender: document.getElementById('editGender').value,
            phone: document.getElementById('editPhone').value,
            email: document.getElementById('editEmail').value
        };
        
        console.log('💾 Guardando cambios:', updatedData);
        
        const response = await fetch(`${API}/patients/${patientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            isEditing = false;
            await loadPatientProfile();
            alert('✅ Perfil actualizado exitosamente');
        } else {
            throw new Error(result.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        alert('❌ Error al actualizar el perfil: ' + error.message);
    }
}

// ✅ CARGAR DOCTORES DISPONIBLES - AGREGAR ESTA FUNCIÓN
async function loadAvailableDoctors() {
    try {
        const specialty = document.getElementById('selSpecialty').value;
        const doctorSelect = document.getElementById('selDoctor');
        
        if (!specialty) {
            doctorSelect.innerHTML = '<option value="">-- Primero seleccione especialidad --</option>';
            doctorSelect.disabled = true;
            return;
        }
        
        console.log('🔍 Cargando doctores para:', specialty);
        
        // ✅ USAR EL ENDPOINT CORRECTO
        const response = await fetch(`${API}/doctors/available?specialty=${specialty}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        
        const doctors = await response.json();
        console.log('👨‍⚕️ Doctores encontrados:', doctors);
        
        doctorSelect.innerHTML = '<option value="">-- Seleccione doctor --</option>';
        doctorSelect.disabled = false;
        
        if (doctors && doctors.length > 0) {
            doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = `👨‍⚕️ ${doctor.name} - ${doctor.specialty}`;
                doctorSelect.appendChild(option);
            });
            console.log(`✅ ${doctors.length} doctores cargados para ${specialty}`);
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '❌ No hay doctores disponibles para ' + specialty;
            option.disabled = true;
            doctorSelect.appendChild(option);
        }
        
    } catch (error) {
        console.error('❌ Error cargando doctores:', error);
        const doctorSelect = document.getElementById('selDoctor');
        doctorSelect.innerHTML = '<option value="">-- Error cargando doctores --</option>';
        doctorSelect.disabled = false;
    }
}
// ✅ CARGAR CITAS CON BOTONES DE EDITAR Y ELIMINAR - VERSIÓN CORREGIDA
async function loadMyAppointments() {
    try {
        const patientId = getPatientId();
        if (!patientId) return;
        
        console.log('📅 Cargando citas para paciente:', patientId);
        
        const response = await fetch(`${API}/appointments/my-appointments?patient_id=${patientId}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        
        const appointments = await response.json();
        const ul = document.getElementById('listAppointments');
        
        if (!ul) {
            console.error('❌ No se encontró el elemento listAppointments');
            return;
        }
        
        ul.innerHTML = '';
        
        if (!appointments || appointments.length === 0) {
            ul.innerHTML = '<li>No tienes citas programadas</li>';
            return;
        }
        
        // ✅ DEBUG SIMPLE: Ver qué status tienen las citas
        console.log('🔍 Status de todas las citas:', appointments.map(a => a.status));
        
        appointments.forEach(a => {
            const li = document.createElement('li');
            li.className = 'appointment-item';
            
            const date = new Date(a.appointment_date).toLocaleString('es-ES');
            li.innerHTML = `
                <div class="appointment-info">
                    <strong>${date}</strong> - Dr. ${a.doctor_name} 
                    <br>Especialidad: ${a.specialty}
                    <br>Motivo: ${a.reason || 'Consulta general'}
                    <br>Estado: <span class="status-${a.status}">${a.status}</span>
                </div>
                <div class="appointment-actions">
                    ${(a.status === 'pendiente' || a.status === 'programada') ? `
                        <button onclick="editAppointment(${a.id})" class="btn btn-secondary btn-small">✏️ Editar</button>
                        <button onclick="cancelAppointment(${a.id})" class="btn btn-danger btn-small">❌ Cancelar</button>
                    ` : ''}
                </div>
            `;
            
            ul.appendChild(li);
        });
        
        console.log('✅ Citas cargadas:', appointments.length);
        
    } catch (error) {
        console.error('❌ Error cargando citas:', error);
        const ul = document.getElementById('listAppointments');
        if (ul) {
            ul.innerHTML = `<li class="error-message">❌ Error cargando citas: ${error.message}</li>`;
        }
    }
}

// ✅ FUNCIÓN PARA EDITAR CITA - VERSIÓN COMPLETA CORREGIDA
async function editAppointment(appointmentId) {
    try {
        console.log('✏️ Editando cita ID:', appointmentId);
        
        // Obtener los datos actuales de la cita
        const response = await fetch(`${API}/appointments/${appointmentId}`);
        if (!response.ok) {
            throw new Error(`Error obteniendo cita: ${response.status}`);
        }
        
        const appointment = await response.json();
        console.log('📋 Datos de cita obtenidos:', appointment);
        
        // Mostrar modal o formulario de edición
        const newDate = prompt('📅 Ingrese la nueva fecha y hora (YYYY-MM-DD HH:MM):', 
            appointment.appointment_date.substring(0, 16));
        
        if (!newDate) {
            console.log('❌ Usuario canceló la edición');
            return;
        }
        
        // Verificar disponibilidad de la nueva fecha
        console.log('🔍 Verificando disponibilidad para:', newDate);
        const availabilityResponse = await fetch(
            `${API}/appointments/check-availability?doctor_id=${appointment.doctor_id}&datetime=${newDate}`
        );
        
        if (!availabilityResponse.ok) {
            throw new Error(`Error verificando disponibilidad: ${availabilityResponse.status}`);
        }
        
        const availability = await availabilityResponse.json();
        console.log('📊 Resultado disponibilidad:', availability);
        
        if (!availability.available) {
            alert('❌ Lo sentimos, esa hora no está disponible. Por favor elija otra.');
            return;
        }
        
        // ✅ PREPARAR DATOS COMPLETOS PARA ACTUALIZACIÓN
        const updateData = {
            patient_id: appointment.patient_id,
            doctor_id: appointment.doctor_id,
            appointment_date: newDate.replace(' ', 'T') + ':00', // Formato correcto
            reason: appointment.reason,
            status: appointment.status || 'pendiente' // Valor por defecto si no existe
        };
        
        console.log('📤 Enviando datos de actualización:', updateData);
        
        // Actualizar la cita
        const updateResponse = await fetch(`${API}/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        console.log('📡 Status de respuesta:', updateResponse.status);
        
        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error(`Error ${updateResponse.status} actualizando cita: ${errorText}`);
        }
        
        const result = await updateResponse.json();
        console.log('✅ Resultado de actualización:', result);
        
        if (result.message || result.success) {
            await loadMyAppointments();
            alert('✅ Cita actualizada exitosamente');
        } else {
            throw new Error(result.error || 'Error desconocido al actualizar cita');
        }
        
    } catch (error) {
        console.error('❌ Error editando cita:', error);
        alert('❌ Error al editar la cita: ' + error.message);
    }
}

// ✅ FUNCIÓN PARA CANCELAR CITA (actualizada)
async function cancelAppointment(appointmentId) {
    try {
        if (!confirm('¿Estás seguro de cancelar esta cita?')) return;
        
        const response = await fetch(`${API}/appointments/${appointmentId}`, { 
            method: 'DELETE' 
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        
        const result = await response.json();
        
if (result.message) {
            await loadMyAppointments();
            alert('✅ Cita cancelada exitosamente');
        } else {
            throw new Error(result.error || 'Error cancelando cita');
        }
        
    } catch (error) {
        console.error('❌ Error cancelando cita:', error);
        alert('❌ Error al cancelar la cita: ' + error.message);
    }
}



// ✅ AGENDAR CITA
async function handleAppointmentSubmit(e) {
    e.preventDefault();
    
    try {
        const patientData = JSON.parse(localStorage.getItem('patientData'));
        if (!patientData || !patientData.id) {
            alert('❌ Error: No se encontró información del paciente. Inicie sesión nuevamente.');
            return;
        }

        const doctorId = document.getElementById('selDoctor').value;
        const appointmentDate = document.getElementById('appointment_date').value;
        const reason = document.getElementById('reason').value;

        if (!doctorId) {
            alert('❌ Por favor seleccione un doctor');
            return;
        }

        if (!appointmentDate) {
            alert('❌ Por favor seleccione una fecha y hora');
            return;
        }

        if (!reason) {
            alert('❌ Por favor describa el motivo de la consulta');
            return;
        }

        const appointmentData = {
            patient_id: patientData.id,
            doctor_id: doctorId,
            appointment_date: appointmentDate,
            reason: reason
        };

        console.log('📤 Enviando cita:', appointmentData);

        const response = await fetch(`${API}/appointments`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            document.getElementById('formAppointment').reset();
            await loadMyAppointments();
            alert('✅ ' + (result.message || 'Cita agendada exitosamente'));
        } else {
            throw new Error(result.error || 'Error desconocido al agendar cita');
        }

    } catch (error) {
        console.error('❌ Error agendando cita:', error);
        alert('❌ Error al agendar la cita: ' + error.message);
    }
}

// ✅ INICIALIZAR EVENT LISTENERS
function initializeEventListeners() {
    // Event listener para especialidad
    const specialtySelect = document.getElementById('selSpecialty');
    if (specialtySelect) {
        specialtySelect.addEventListener('change', function() {
            console.log('🎯 Especialidad seleccionada:', this.value);
            loadAvailableDoctors();
        });
        console.log('✅ Event listener de especialidad registrado');
    }
    
    // Event listener para formulario de cita
    const appointmentForm = document.getElementById('formAppointment');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', handleAppointmentSubmit);
        console.log('✅ Event listener de formulario registrado');
    }
}

// ✅ INICIALIZAR DASHBOARD - CORREGIDO (sin await fuera de async)
async function initializeDashboard() {
    if (!checkAuth()) return;
    
    console.log('🚀 Inicializando dashboard...');
    
    // Inicializar event listeners primero
    initializeEventListeners();
    
    // Luego cargar datos
    await loadPatientProfile();
    await loadMyAppointments();
    
    console.log('✅ Dashboard inicializado completamente');
}

// ✅ INICIALIZAR CUANDO CARGA LA PÁGINA
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

// ✅ FUNCIÓN LOGOUT
function logout() {
    localStorage.removeItem('patientData');
    alert('👋 Sesión cerrada');
    window.location.href = 'login.html';
}