// main.js
// [ETIQUETA] Frontend mínimo para consumir API REST (CRUD). Explica en la defensa: usa fetch para llamadas HTTP.

const API = 'http://localhost:3000/api';

// [ETIQUETA] Carga doctores desde backend
async function loadDoctors() {
  const doctors = await fetchJSON(`${API}/doctors`);
  const sel = document.getElementById('selDoctor');
  sel.innerHTML = '<option value="">-- Seleccione doctor --</option>';

  doctors.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = `${d.name} - ${d.specialty}`;
    sel.appendChild(opt);
  });
}

async function fetchJSON(url, opts={}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error('Error en petición');
  return await res.json();
}

async function loadPatients() {
  const patients = await fetchJSON(`${API}/patients`);
  const ul = document.getElementById('listPatients');
  ul.innerHTML = '';
  const sel = document.getElementById('selPatient');
  sel.innerHTML = '<option value="">-- Seleccione paciente --</option>';

  patients.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.first_name} ${p.last_name} - ${p.phone || ''}`;
    const editBtn = document.createElement('button'); editBtn.textContent = 'Editar';
    editBtn.onclick = () => fillPatientForm(p);
    const delBtn = document.createElement('button'); delBtn.textContent = 'Eliminar';
    delBtn.onclick = async () => {
      if (!confirm('Eliminar paciente?')) return;
      await fetchJSON(`${API}/patients/${p.id}`, { method: 'DELETE' });
      await loadPatients();
      await loadDoctors();
      await loadAppointments();
    };
    li.append(' ', editBtn, ' ', delBtn);
    ul.appendChild(li);

    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = `${p.first_name} ${p.last_name}`;
    sel.appendChild(opt);
  });
}

function fillPatientForm(p) {
  document.getElementById('patientId').value = p.id;
  document.getElementById('first_name').value = p.first_name;
  document.getElementById('last_name').value = p.last_name;
  document.getElementById('birth_date').value = p.birth_date ? p.birth_date.split('T')[0] : '';
  document.getElementById('gender').value = p.gender;
  document.getElementById('phone').value = p.phone;
  document.getElementById('email').value = p.email;
}

document.getElementById('formPatient').addEventListener('submit', async (e) => {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } else {
    await fetchJSON(`${API}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
  document.getElementById('formPatient').reset();
  await loadPatients();
});

document.getElementById('formAppointment').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    patient_id: document.getElementById('selPatient').value,
    doctor_id: document.getElementById('selDoctor').value,   // *** AQUI ***
    appointment_date: document.getElementById('appointment_date').value,
    reason: document.getElementById('reason').value
  };
  await fetchJSON(`${API}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  document.getElementById('formAppointment').reset();
  await loadAppointments();
});

async function loadAppointments() {
  const appts = await fetchJSON(`${API}/appointments`);
  const ul = document.getElementById('listAppointments');
  ul.innerHTML = '';
  appts.forEach(a => {
    const li = document.createElement('li');
    li.textContent = `${a.appointment_date} - ${a.first_name} ${a.last_name} - ${a.reason || ''} [${a.status}]`;
    const delBtn = document.createElement('button'); delBtn.textContent = 'Eliminar';
    delBtn.onclick = async () => {
      if (!confirm('Eliminar cita?')) return;
      await fetchJSON(`${API}/appointments/${a.id}`, { method: 'DELETE' });
      await loadAppointments();
    };
    li.append(' ', delBtn);
    ul.appendChild(li);
  });
}

(async () => {
  await loadPatients();
  await loadDoctors();  // *** ESTA ES LA LÍNEA QUE FALTABA ***
  await loadAppointments();
})();