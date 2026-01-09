# 🎮 MATRIX SYSTEM - Sistema Web Futurista

## Descripción
Sistema web con temática Matrix que incluye gestión de usuarios, administración, procesamiento de pagos y efectos visuales futuristas.

## ✨ Características Principales

### 🔐 Sistema de Autenticación
- Registro de nuevos usuarios
- Login para usuarios y administradores
- Sesiones persistentes
- Usuario admin por defecto: `admin` / `admin123`

### 👤 Panel de Usuario
- Visualización de balance
- Opciones de compra:
  - Libro físico "Matrix Code"
  - Pago con criptomonedas (QR)
- Historial de transacciones
- Información personal

### 👑 Panel de Administrador
- Gestión completa de usuarios
- Modificación de balances
- Reportes y estadísticas
- Exportación de datos
- Sistema de respaldo

### 💳 Sistema de Pagos
- Proceso de 4 pasos con barra de progreso
- Simulación de pagos reales
- Página de éxito con detalles
- Generación de recibos

### 🎨 Efectos Visuales
- Lluvia de caracteres Matrix en fondo
- Animaciones neon verdes
- Efectos de escaneo
- Interfaz responsive

## 🚀 Instalación

### Opción 1: Ejecución local simple
1. Descarga todos los archivos
2. Colócalos en una misma carpeta
3. Abre `index.html` en tu navegador

### Opción 2: Servidor local
```bash
# Con Python 3
python -m http.server 8000

# Con Node.js
npx http-server