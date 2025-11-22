// auth.js - VERSIÓN CORREGIDA (MISMA ESTRUCTURA)
const API = 'http://localhost:3000/api';

// [ETIQUETA] Registro de nuevo paciente
// ✅ REGISTRO DE NUEVO PACIENTE - VERSIÓN CORREGIDA
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('❌ Las contraseñas no coinciden');
        return;
    }
    
    const patientData = {
        first_name: document.getElementById('regFirstName').value,
        last_name: document.getElementById('regLastName').value,
        birth_date: document.getElementById('regBirthDate').value,
        gender: document.getElementById('regGender').value,
        phone: document.getElementById('regPhone').value,
        email: document.getElementById('regEmail').value,
        password: password
    };
    
    console.log('📤 Enviando registro:', patientData);
    
    try {
       const response = await fetch(`${API}/patients/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patientData)
        });
        
        console.log('📡 Respuesta del servidor - Status:', response.status);
        
        // ✅ MANEJO MEJORADO DE RESPUESTAS
        const contentType = response.headers.get('content-type');
        
        let result;
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            // Si no es JSON, obtener el texto para debug
            const text = await response.text();
            console.error('❌ El servidor devolvió HTML en lugar de JSON:', text.substring(0, 200));
            throw new Error('Error del servidor: respuesta no es JSON');
        }
        
        console.log('📄 Resultado del registro:', result);
        
        if (response.ok && result.success) {
            alert('✅ ' + result.message);
            window.location.href = 'login.html';
        } else {
            alert('❌ ' + (result.error || 'Error en el registro'));
        }
    } catch (error) {
        console.error('💥 Error en registro:', error);
        
        // ✅ MENSAJES MÁS ESPECÍFICOS
        if (error.message.includes('JSON') || error.message.includes('<!DOCTYPE')) {
            alert('❌ Error del servidor: El servicio de registro no está disponible temporalmente');
        } else if (error.message.includes('Failed to fetch')) {
            alert('❌ Error de conexión: No se puede conectar al servidor');
        } else {
            alert('❌ Error de conexión con el servidor: ' + error.message);
        }
    }
});
// [ETIQUETA] Login de paciente - CORREGIDO
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const loginData = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };
    
    console.log('🔐 Intentando login con:', loginData);
    
    try {
        console.log('🚀 Enviando petición de login...');
        
        const response = await fetch(`${API}/patients/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        console.log('📡 Respuesta recibida - Status:', response.status);
        console.log('📡 Respuesta recibida - OK:', response.ok);
        
        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('content-type');
        console.log('📋 Content-Type:', contentType);
        
        let result;
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            const text = await response.text();
            console.error('❌ La respuesta no es JSON:', text);
            throw new Error('Respuesta del servidor no es JSON: ' + text);
        }
        
        console.log('📄 Resultado del login:', result);
        
        if (response.ok && result.success) {
            console.log('✅ Login exitoso - Paciente:', result.patient);
            
            // ✅ VERIFICAR QUE EXISTA result.patient
            if (!result.patient) {
                console.error('❌ No se recibió data del paciente');
                alert('❌ Error: No se recibieron datos del usuario');
                return;
            }
            
            localStorage.setItem('patientData', JSON.stringify(result.patient));
            localStorage.setItem('patientId', result.patient.id);
            
            console.log('💾 Datos guardados en localStorage');
            console.log('patientData:', localStorage.getItem('patientData'));
            console.log('patientId:', localStorage.getItem('patientId'));
            
            alert('✅ ' + result.message);
            
            // ✅ REDIRECCIÓN CORREGIDA - usar ruta relativa
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
            
        } else {
            console.error('❌ Login fallido - Error:', result.error);
            alert('❌ ' + (result.error || 'Error en el login'));
        }
    } catch (error) {
        console.error('💥 Error completo en login:', error);
        console.error('💥 Mensaje de error:', error.message);
        alert('❌ Error de conexión: ' + error.message);
    }
});

// [ETIQUETA] Función para cerrar sesión
function logout() {
    localStorage.removeItem('patientData');
    localStorage.removeItem('patientId');
    window.location.href = 'login.html';  // ✅ CAMBIADO: ruta relativa
}

// ✅ VERIFICAR SI YA ESTÁ LOGUEADO AL CARGAR LA PÁGINA
document.addEventListener('DOMContentLoaded', function() {
    const patientData = localStorage.getItem('patientData');
    console.log('🔍 Verificando autenticación...');
    console.log('patientData en localStorage:', patientData);
    
    if (patientData) {
        try {
            const patient = JSON.parse(patientData);
            if (patient && patient.id) {
                console.log('✅ Usuario ya autenticado, redirigiendo a dashboard...');
                // Solo redirigir si estamos en login/register
                if (window.location.pathname.includes('login.html') || 
                    window.location.pathname.includes('register.html') ||
                    window.location.pathname === '/' || 
                    window.location.pathname.endsWith('/')) {
                    window.location.href = 'dashboard.html';
                }
            }
        } catch (e) {
            console.error('❌ Error parseando patientData:', e);
            localStorage.removeItem('patientData');
            localStorage.removeItem('patientId');
        }
    }
});