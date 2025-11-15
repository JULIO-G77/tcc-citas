-- mysql_create.sql
-- [ETIQUETA] -- Script para crear BD y tablas principales
CREATE DATABASE IF NOT EXISTS clinicdb;
USE clinicdb;

-- Tabla pacientes
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birth_date DATE,
  gender VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla doctores
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  specialty VARCHAR(100)
);

-- Tabla citas (VERSIÓN CORREGIDA - solo una definición)
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATETIME NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Insertar algunos doctores de ejemplo
INSERT IGNORE INTO doctors (name, specialty) VALUES 
('Dr. Carlos Gómez', 'Cardiología'),
('Dra. Ana Rodríguez', 'Pediatría'),
('Dr. Miguel López', 'Dermatología');

-- Fin del script