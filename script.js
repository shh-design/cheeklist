// ====================
// MÓDULO PRINCIPAL
// ====================
const MatrixApp = (() => {
    // ====================
    // VARIABLES GLOBALES
    // ====================
    let currentUser = null;
    let users = JSON.parse(localStorage.getItem('matrixUsers')) || [];
    let transactions = JSON.parse(localStorage.getItem('matrixTransactions')) || [];
    let currentPaymentProduct = null;
    
    // Usuario administrador por defecto
    const ADMIN_USER = {
        id: 'admin-001',
        username: 'admin',
        password: 'admin123',
        email: 'admin@matrix-system.com',
        balance: 0,
        role: 'admin',
        createdAt: new Date().toISOString()
    };
    
    // ====================
    // INICIALIZACIÓN
    // ====================
    function init() {
        // Inicializar usuarios si es la primera vez
        initializeUsers();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Verificar si hay usuario en sesión
        checkSession();
        
        // Cargar datos iniciales
        loadInitialData();
        
        console.log('✅ Matrix System inicializado');
    }
    
    function initializeUsers() {
        const storedUsers = JSON.parse(localStorage.getItem('matrixUsers'));
        
        if (!storedUsers || storedUsers.length === 0) {
            // Crear usuario admin si no existe
            users = [ADMIN_USER];
            
            // Crear algunos usuarios de ejemplo
            const sampleUsers = [
                {
                    id: 'user-001',
                    username: 'neo',
                    password: 'matrix123',
                    email: 'neo@matrix.com',
                    balance: 150.75,
                    role: 'user',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'user-002',
                    username: 'trinity',
                    password: 'matrix123',
                    email: 'trinity@matrix.com',
                    balance: 89.50,
                    role: 'user',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'user-003',
                    username: 'morpheus',
                    password: 'matrix123',
                    email: 'morpheus@matrix.com',
                    balance: 250.00,
                    role: 'user',
                    createdAt: new Date().toISOString()
                }
            ];
            
            users.push(...sampleUsers);
            localStorage.setItem('matrixUsers', JSON.stringify(users));
        } else {
            users = storedUsers;
        }
    }
    
    // ====================
    // MANEJO DE SESIONES
    // ====================
    function checkSession() {
        const session = JSON.parse(localStorage.getItem('matrixSession'));
        if (session && session.userId) {
            const user = users.find(u => u.id === session.userId);
            if (user) {
                currentUser = user;
                updateUIForUser();
                showSection('user-section');
            }
        }
    }
    
    function createSession(user) {
        const session = {
            userId: user.id,
            username: user.username,
            role: user.role,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('matrixSession', JSON.stringify(session));
        currentUser = user;
    }
    
    function destroySession() {
        localStorage.removeItem('matrixSession');
        currentUser = null;
        updateUIForUser();
        showSection('home-section');
    }
    
    // ====================
    // MANEJO DE USUARIOS
    // ====================
    function registerUser(username, email, password) {
        // Validaciones
        if (!username || !email || !password) {
            return { success: false, message: 'Todos los campos son requeridos' };
        }
        
        if (username.length < 3) {
            return { success: false, message: 'El usuario debe tener al menos 3 caracteres' };
        }
        
        if (password.length < 6) {
            return { success: false, message: 'La contraseña debe tener al menos 6 caracteres' };
        }
        
        if (!isValidEmail(email)) {
            return { success: false, message: 'Email no válido' };
        }
        
        // Verificar si el usuario ya existe
        if (users.some(user => user.username === username)) {
            return { success: false, message: 'El nombre de usuario ya existe' };
        }
        
        if (users.some(user => user.email === email)) {
            return { success: false, message: 'El email ya está registrado' };
        }
        
        // Crear nuevo usuario
        const newUser = {
            id: `user-${Date.now()}`,
            username,
            email,
            password,
            balance: 0,
            role: 'user',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            transactions: []
        };
        
        users.push(newUser);
        localStorage.setItem('matrixUsers', JSON.stringify(users));
        
        return { 
            success: true, 
            message: 'Cuenta creada exitosamente', 
            user: newUser 
        };
    }
    
    function loginUser(username, password, loginType) {
        const user = users.find(u => 
            u.username === username && 
            u.password === password
        );
        
        if (!user) {
            return { success: false, message: 'Credenciales incorrectas' };
        }
        
        // Verificar tipo de acceso
        if (loginType === 'admin' && user.role !== 'admin') {
            return { success: false, message: 'No tiene permisos de administrador' };
        }
        
        if (loginType === 'user' && user.role !== 'user') {
            return { success: false, message: 'Tipo de acceso incorrecto' };
        }
        
        // Actualizar último acceso
        user.lastLogin = new Date().toISOString();
        localStorage.setItem('matrixUsers', JSON.stringify(users));
        
        // Crear sesión
        createSession(user);
        
        return { 
            success: true, 
            message: `Bienvenido, ${user.username}`,
            user 
        };
    }
    
    function updateUserBalance(userId, amount, action = 'add') {
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        
        let newBalance = users[userIndex].balance;
        
        switch (action) {
            case 'set':
                newBalance = amount;
                break;
            case 'add':
                newBalance += amount;
                break;
            case 'subtract':
                newBalance -= amount;
                if (newBalance < 0) newBalance = 0;
                break;
        }
        
        users[userIndex].balance = parseFloat(newBalance.toFixed(2));
        localStorage.setItem('matrixUsers', JSON.stringify(users));
        
        // Si es el usuario actual, actualizar UI
        if (currentUser && currentUser.id === userId) {
            currentUser.balance = users[userIndex].balance;
            updateUserPanel();
        }
        
        return { 
            success: true, 
            message: 'Balance actualizado',
            newBalance 
        };
    }
    
    // ====================
    // INTERFAZ DE USUARIO
    // ====================
    function showSection(sectionId) {
        // Ocultar todas las secciones
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar la sección solicitada
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
            
            // Actualizar navegación
            updateNavigation(sectionId);
            
            // Ejecutar acciones específicas de la sección
            switch(sectionId) {
                case 'user-section':
                    updateUserPanel();
                    break;
                case 'admin-section':
                    loadAdminPanel();
                    break;
                case 'home-section':
                    updateWelcomeMessage();
                    break;
            }
        }
    }
    
    function updateNavigation(sectionId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const navMap = {
            'home-section': 'nav-home',
            'user-section': 'nav-user',
            'admin-section': 'nav-admin',
            'payment-section': 'nav-payment'
        };
        
        const activeNav = document.getElementById(navMap[sectionId]);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }
    
    function updateUIForUser() {
        const userDisplay = document.getElementById('current-user-display');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (currentUser) {
            userDisplay.textContent = `${currentUser.username} (${currentUser.role})`;
            logoutBtn.classList.remove('hidden');
            
            // Mostrar/ocultar enlaces según el rol
            document.getElementById('nav-admin').style.display = 
                currentUser.role === 'admin' ? 'flex' : 'none';
                
            document.getElementById('nav-user').style.display = 
                currentUser.role === 'user' ? 'flex' : 'none';
        } else {
            userDisplay.textContent = 'No conectado';
            logoutBtn.classList.add('hidden');
            
            // Mostrar todos los enlaces para usuarios no autenticados
            document.querySelectorAll('.nav-link').forEach(link => {
                link.style.display = 'flex';
            });
        }
    }
    
    function updateUserPanel() {
        if (!currentUser) return;
        
        document.getElementById('user-name-display').textContent = currentUser.username;
        document.getElementById('user-email-display').textContent = currentUser.email;
        document.getElementById('user-id-display').textContent = currentUser.id;
        document.getElementById('user-balance').textContent = currentUser.balance.toFixed(2);
        
        // Actualizar último acceso
        const lastLogin = document.getElementById('last-login');
        if (currentUser.lastLogin) {
            lastLogin.textContent = formatDate(currentUser.lastLogin);
        }
        
        // Contar transacciones
        const userTransactions = transactions.filter(t => t.userId === currentUser.id);
        document.getElementById('transaction-count').textContent = userTransactions.length;
    }
    
    function loadAdminPanel() {
        if (!currentUser || currentUser.role !== 'admin') return;
        
        // Actualizar estadísticas
        const regularUsers = users.filter(u => u.role === 'user');
        document.getElementById('total-users').textContent = regularUsers.length;
        
        const totalBalance = regularUsers.reduce((sum, user) => sum + user.balance, 0);
        document.getElementById('total-balance').textContent = totalBalance.toFixed(2);
        
        document.getElementById('total-transactions').textContent = transactions.length;
        
        // Cargar tabla de usuarios
        loadUsersTable();
        
        // Cargar selector de usuarios
        loadUserSelector();
    }
    
    function loadUsersTable() {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';
        
        const regularUsers = users.filter(u => u.role === 'user');
        
        regularUsers.forEach(user => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td><code>${user.id}</code></td>
                <td>
                    <div class="user-info-cell">
                        <strong>${user.username}</strong>
                        <small>${user.email}</small>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="balance-cell">$${user.balance.toFixed(2)}</span>
                </td>
                <td>
                    <button class="btn-action edit-user" data-user-id="${user.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete-user" data-user-id="${user.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Agregar event listeners a los botones
        document.querySelectorAll('.edit-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                selectUserForEdit(userId);
            });
        });
        
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                deleteUser(userId);
            });
        });
    }
    
    function loadUserSelector() {
        const select = document.getElementById('selected-user');
        select.innerHTML = '<option value="">Seleccione un usuario</option>';
        
        const regularUsers = users.filter(u => u.role === 'user');
        
        regularUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.username} ($${user.balance.toFixed(2)})`;
            select.appendChild(option);
        });
    }
    
    // ====================
    // SISTEMA DE PAGOS
    // ====================
    function startPaymentProcess(productType) {
        currentPaymentProduct = productType;
        
        // Configurar información del pedido
        const orderProduct = document.getElementById('order-product');
        const orderTotal = document.querySelector('.order-total');
        
        if (productType === 'book') {
            orderProduct.textContent = 'Libro Físico "Matrix Code"';
            orderTotal.textContent = '$55.98';
        } else if (productType === 'crypto') {
            orderProduct.textContent = 'Pago con Criptomonedas';
            orderTotal.textContent = '0.05 ETH';
            
            // Mostrar detalles crypto
            document.getElementById('crypto-details').classList.remove('hidden');
        }
        
        // Mostrar sección de pago
        showSection('payment-section');
        
        // Iniciar proceso
        simulatePaymentProcess();
    }
    
    function simulatePaymentProcess() {
        let currentStep = 1;
        const totalSteps = 4;
        
        const progressBar = document.getElementById('progress-fill');
        const progressPercentage = document.getElementById('progress-percentage');
        const progressStatus = document.getElementById('progress-status');
        const processStatus = document.getElementById('process-status');
        
        function updateProgress(step) {
            const percentage = (step / totalSteps) * 100;
            progressBar.style.width = `${percentage}%`;
            progressPercentage.textContent = `${Math.round(percentage)}%`;
            
            // Actualizar pasos
            document.querySelectorAll('.step').forEach(stepEl => {
                stepEl.classList.remove('active', 'completed');
            });
            
            for (let i = 1; i <= step; i++) {
                const stepEl = document.querySelector(`.step[data-step="${i}"]`);
                if (stepEl) {
                    stepEl.classList.add(i === step ? 'active' : 'completed');
                    if (i < step) {
                        stepEl.querySelector('.step-check').classList.remove('hidden');
                    }
                }
            }
        }
        
        function nextStep() {
            currentStep++;
            
            if (currentStep <= totalSteps) {
                updateProgress(currentStep);
                
                switch(currentStep) {
                    case 1:
                        progressStatus.textContent = 'Validando información...';
                        processStatus.textContent = 'Verificando datos del usuario y producto...';
                        break;
                    case 2:
                        progressStatus.textContent = 'Procesando pago...';
                        processStatus.textContent = 'Conectando con la pasarela de pagos...';
                        break;
                    case 3:
                        progressStatus.textContent = 'Confirmando transacción...';
                        if (currentPaymentProduct === 'crypto') {
                            processStatus.textContent = 'Esperando confirmación de la blockchain...';
                        } else {
                            processStatus.textContent = 'Verificando con el banco...';
                        }
                        break;
                    case 4:
                        progressStatus.textContent = 'Finalizando...';
                        processStatus.textContent = 'Guardando transacción y actualizando balance...';
                        break;
                }
                
                // Programar siguiente paso
                setTimeout(nextStep, 2000);
            } else {
                // Proceso completado
                completePayment();
            }
        }
        
        // Iniciar progreso
        updateProgress(1);
        progressStatus.textContent = 'Iniciando proceso...';
        processStatus.textContent = 'Preparando transacción...';
        
        // Iniciar secuencia de pasos
        setTimeout(nextStep, 1000);
    }
    
    function completePayment() {
        // Crear transacción
        const transaction = {
            id: `tx-${Date.now()}`,
            userId: currentUser.id,
            product: currentPaymentProduct,
            amount: currentPaymentProduct === 'book' ? 55.98 : 0.05,
            currency: currentPaymentProduct === 'book' ? 'USD' : 'ETH',
            status: 'completed',
            date: new Date().toISOString(),
            details: {
                productName: currentPaymentProduct === 'book' ? 
                    'Libro Físico "Matrix Code"' : 
                    'Pago con Criptomonedas'
            }
        };
        
        // Agregar transacción
        transactions.push(transaction);
        localStorage.setItem('matrixTransactions', JSON.stringify(transactions));
        
        // Actualizar balance del usuario (simular recarga)
        if (currentPaymentProduct === 'book') {
            updateUserBalance(currentUser.id, 49.99, 'add');
        }
        
        // Mostrar página de éxito
        showSuccessPage(transaction);
    }
    
    function showSuccessPage(transaction) {
        // Configurar detalles
        document.getElementById('transaction-id').textContent = transaction.id;
        document.getElementById('success-amount').textContent = 
            transaction.currency === 'USD' ? 
            `$${transaction.amount.toFixed(2)}` : 
            `${transaction.amount} ${transaction.currency}`;
        document.getElementById('success-product').textContent = transaction.details.productName;
        document.getElementById('success-date').textContent = formatDate(transaction.date);
        
        // Mostrar sección de éxito
        showSection('success-section');
    }
    
    // ====================
    // FUNCIONES AUXILIARES
    // ====================
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function showMessage(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.textContent = message;
        element.className = `message ${type}`;
        element.classList.remove('hidden');
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            element.classList.add('hidden');
        }, 5000);
    }
    
    function loadInitialData() {
        updateWelcomeMessage();
    }
    
    function updateWelcomeMessage() {
        // Puedes agregar animaciones o efectos especiales aquí
        const welcome = document.querySelector('.welcome-message h1');
        if (welcome) {
            welcome.classList.add('glitch-text');
        }
    }
    
    // ====================
    // EVENT LISTENERS
    // ====================
    function setupEventListeners() {
        // Navegación
        document.getElementById('nav-home').addEventListener('click', (e) => {
            e.preventDefault();
            showSection('home-section');
        });
        
        document.getElementById('nav-user').addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser && currentUser.role === 'user') {
                showSection('user-section');
            } else {
                showMessage('login-message', 'Por favor, inicie sesión como usuario', 'warning');
                showSection('home-section');
            }
        });
        
        document.getElementById('nav-admin').addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser && currentUser.role === 'admin') {
                showSection('admin-section');
            } else {
                showMessage('login-message', 'Acceso restringido a administradores', 'error');
                showSection('home-section');
            }
        });
        
        document.getElementById('nav-payment').addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser && currentUser.role === 'user') {
                showSection('payment-section');
            } else {
                showMessage('login-message', 'Por favor, inicie sesión como usuario', 'warning');
                showSection('home-section');
            }
        });
        
        // Logout
        document.getElementById('logout-btn').addEventListener('click', destroySession);
        
        // Formulario de registro
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('register-username').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            
            const result = registerUser(username, email, password);
            
            if (result.success) {
                showMessage('register-message', result.message, 'success');
                e.target.reset();
            } else {
                showMessage('register-message', result.message, 'error');
            }
        });
        
        //

                // Formulario de login
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            const loginType = document.getElementById('login-type').value;
            
            const result = loginUser(username, password, loginType);
            
            if (result.success) {
                showMessage('login-message', result.message, 'success');
                e.target.reset();
                
                // Actualizar UI y mostrar sección apropiada
                updateUIForUser();
                
                if (result.user.role === 'admin') {
                    showSection('admin-section');
                } else {
                    showSection('user-section');
                }
            } else {
                showMessage('login-message', result.message, 'error');
            }
        });
        
        // Botones de compra
        document.querySelectorAll('.btn-buy').forEach(btn => {
            btn.addEventListener('click', function() {
                const product = this.getAttribute('data-product');
                
                if (!currentUser || currentUser.role !== 'user') {
                    showMessage('login-message', 'Por favor, inicie sesión como usuario', 'warning');
                    showSection('home-section');
                    return;
                }
                
                if (product === 'crypto') {
                    // Mostrar QR en lugar de iniciar pago
                    document.getElementById('qr-display-container').classList.remove('hidden');
                } else {
                    startPaymentProcess(product);
                }
            });
        });
        
        // Cerrar QR
        document.getElementById('close-qr')?.addEventListener('click', () => {
            document.getElementById('qr-display-container').classList.add('hidden');
        });
        
        // Actualizar balance desde admin
        document.getElementById('update-balance-btn')?.addEventListener('click', () => {
            const userId = document.getElementById('selected-user').value;
            const amount = parseFloat(document.getElementById('balance-amount').value);
            const action = document.getElementById('balance-action').value;
            
            if (!userId) {
                showMessage('login-message', 'Seleccione un usuario', 'warning');
                return;
            }
            
            if (isNaN(amount) || amount <= 0) {
                showMessage('login-message', 'Ingrese un monto válido', 'warning');
                return;
            }
            
            const result = updateUserBalance(userId, amount, action);
            
            if (result.success) {
                showMessage('login-message', 
                    `Balance actualizado a $${result.newBalance.toFixed(2)}`, 
                    'success');
                
                // Actualizar tabla y selector
                loadUsersTable();
                loadUserSelector();
                
                // Limpiar formulario
                document.getElementById('balance-amount').value = '';
            } else {
                showMessage('login-message', result.message, 'error');
            }
        });
        
        // Acciones de la página de éxito
        document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
            if (currentUser && currentUser.role === 'user') {
                showSection('user-section');
                updateUserPanel();
            }
        });
        
        document.getElementById('print-receipt')?.addEventListener('click', () => {
            window.print();
        });
        
        document.getElementById('new-purchase')?.addEventListener('click', () => {
            if (currentUser && currentUser.role === 'user') {
                showSection('user-section');
            }
        });
        
        // Botón de usuario seleccionado (para edición rápida)
        document.getElementById('selected-user')?.addEventListener('change', function() {
            const userId = this.value;
            if (userId) {
                const user = users.find(u => u.id === userId);
                if (user) {
                    document.getElementById('balance-amount').value = user.balance;
                }
            }
        });
    }
    
    // ====================
    // FUNCIONES PÚBLICAS
    // ====================
    return {
        init,
        showSection,
        getCurrentUser: () => currentUser,
        getUsers: () => users,
        updateUserBalance,
        startPaymentProcess,
        showMessage
    };
})();

// ====================
// INICIALIZAR APLICACIÓN
// ====================
document.addEventListener('DOMContentLoaded', () => {
    MatrixApp.init();
});