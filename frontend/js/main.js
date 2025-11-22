// main.js
// [ETIQUETA] Panel de administración - Gestión completa de pacientes, doctores y citas
const API = 'http://localhost:3000/api';

// [ETIQUETA] Función utilitaria para fetch
async function fetchJSON(url, opts = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...opts
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
    return await res.json();
}

// [ETIQUETA] Cargar lista de doctores
async function loadDoctors() {
    try {
        const doctors = await fetchJSON(`${API}/doctors`);
        const sel = document.getElementById('selDoctor');
        if (sel) {
            sel.innerHTML = '<option value="">-- Seleccione doctor --</option>';
            doctors.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = `${d.name} - ${d.specialty}`;
                sel.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('Error cargando doctores:', error);
    }
}

// [ETIQUETA] Cargar lista de pacientes
async function loadPatients() {
    try {
        const patients = await fetchJSON(`${API}/patients`);
        const ul = document.getElementById('listPatients');
        const sel = document.getElementById('selPatient');
        
        if (ul) ul.innerHTML = '';
        if (sel) sel.innerHTML = '<option value="">-- Seleccione paciente --</option>';

        patients.forEach(p => {
            // [ETIQUETA] Lista de pacientes para admin
            if (ul) {
                const li = document.createElement('li');
                li.textContent = `${p.first_name} ${p.last_name} - ${p.phone || ''}`;
                
                const editBtn = document.createElement('button'); 
                editBtn.textContent = 'Editar';
                editBtn.onclick = () => fillPatientForm(p);
                
                const delBtn = document.createElement('button'); 
                delBtn.textContent = 'Eliminar';
                delBtn.onclick = async () => {
                    if (!confirm('¿Eliminar paciente?')) return;
                    await fetchJSON(`${API}/patients/${p.id}`, { method: 'DELETE' });
                    await loadPatients();
                };
                
                li.append(' ', editBtn, ' ', delBtn);
                ul.appendChild(li);
            }

            // [ETIQUETA] Selector de pacientes para citas
            if (sel) {
                const opt = document.createElement('option');
                opt.value = p.id; 
                opt.textContent = `${p.first_name} ${p.last_name}`;
                sel.appendChild(opt);
            }
        });
    } catch (error) {
        console.error('Error cargando pacientes:', error);
    }
}

// [ETIQUETA] Llenar formulario de paciente para edición
function fillPatientForm(p) {
    document.getElementById('patientId').value = p.id;
    document.getElementById('first_name').value = p.first_name;
    document.getElementById('last_name').value = p.last_name;
    document.getElementById('birth_date').value = p.birth_date ? p.birth_date.split('T')[0] : '';
    document.getElementById('gender').value = p.gender;
    document.getElementById('phone').value = p.phone;
    document.getElementById('email').value = p.email;
}

// [ETIQUETA] Cargar todas las citas (vista admin)
async function loadAppointments() {
    try {
        const appts = await fetchJSON(`${API}/appointments`);
        const ul = document.getElementById('listAppointments');
        if (!ul) return;
        
        ul.innerHTML = '';
        appts.forEach(a => {
            const li = document.createElement('li');
            li.textContent = `${a.appointment_date} - ${a.first_name} ${a.last_name} - ${a.reason || ''} [${a.status}]`;
            
            const delBtn = document.createElement('button'); 
            delBtn.textContent = 'Eliminar';
            delBtn.onclick = async () => {
                if (!confirm('¿Eliminar cita?')) return;
                await fetchJSON(`${API}/appointments/${a.id}`, { method: 'DELETE' });
                await loadAppointments();
            };
            
            li.append(' ', delBtn);
            ul.appendChild(li);
        });
    } catch (error) {
        console.error('Error cargando citas:', error);
    }
}

// [ETIQUETA] Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await loadPatients();
    await loadDoctors();
    await loadAppointments();
    
    // [ETIQUETA] Configurar formularios si existen
    document.getElementById('formPatient')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('patientId').value;
        const body = {
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            birth_date: document.getElementById('birth_date').value,
            gender: document.getElementById('gender').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value
        };
        
        if (id) {
            await fetchJSON(`${API}/patients/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
        } else {
            await fetchJSON(`${API}/patients/register`, {
                method: 'POST',
                body: JSON.stringify(body)
            });
        }
        
        document.getElementById('formPatient').reset();
        await loadPatients();
    });
});