// ====================
// MÓDULO DE ADMINISTRACIÓN
// ====================
const AdminModule = (() => {
    // ====================
    // VARIABLES
    // ====================
    let selectedUser = null;
    let allUsers = [];
    
    // ====================
    // INICIALIZACIÓN
    // ====================
    function init() {
        loadAllUsers();
        setupAdminEventListeners();
        
        // Verificar permisos
        if (!checkAdminPermissions()) {
            return;
        }
        
        console.log('✅ Admin Module inicializado');
    }
    
    function checkAdminPermissions() {
        const currentUser = MatrixApp.getCurrentUser();
        return currentUser && currentUser.role === 'admin';
    }
    
    // ====================
    // GESTIÓN DE USUARIOS
    // ====================
    function loadAllUsers() {
        allUsers = MatrixApp.getUsers() || [];
        updateUserStatistics();
    }
    
    function updateUserStatistics() {
        const regularUsers = allUsers.filter(u => u.role === 'user');
        const activeUsers = regularUsers.filter(u => 
            u.lastLogin && 
            (Date.now() - new Date(u.lastLogin).getTime()) < 30 * 24 * 60 * 60 * 1000
        );
        
        const totalBalance = regularUsers.reduce((sum, user) => sum + user.balance, 0);
        const avgBalance = regularUsers.length > 0 ? totalBalance / regularUsers.length : 0;
        
        // Actualizar estadísticas en UI si existen
        updateStatElement('stat-total-users', regularUsers.length);
        updateStatElement('stat-active-users', activeUsers.length);
        updateStatElement('stat-total-balance', `$${totalBalance.toFixed(2)}`);
        updateStatElement('stat-avg-balance', `$${avgBalance.toFixed(2)}`);
    }
    
    function updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            
            // Efecto de animación
            element.classList.add('stat-updated');
            setTimeout(() => {
                element.classList.remove('stat-updated');
            }, 1000);
        }
    }
    
    // ====================
    // OPERACIONES CRUD
    // ====================
    function selectUserForEdit(userId) {
        selectedUser = allUsers.find(u => u.id === userId);
        if (!selectedUser) return;
        
        // Rellenar formulario de edición
        document.getElementById('edit-user-id').value = selectedUser.id;
        document.getElementById('edit-username').value = selectedUser.username;
        document.getElementById('edit-email').value = selectedUser.email;
        document.getElementById('edit-balance').value = selectedUser.balance;
        document.getElementById('edit-role').value = selectedUser.role;
        
        // Mostrar modal de edición
        showEditModal();
    }
    
    function updateUser() {
        if (!selectedUser) return;
        
        const username = document.getElementById('edit-username').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const balance = parseFloat(document.getElementById('edit-balance').value);
        const role = document.getElementById('edit-role').value;
        
        // Validaciones
        if (!username || !email) {
            MatrixApp.showMessage('login-message', 'Usuario y email son requeridos', 'error');
            return;
        }
        
        if (isNaN(balance) || balance < 0) {
            MatrixApp.showMessage('login-message', 'Balance inválido', 'error');
            return;
        }
        
        // Verificar username único (excepto para el usuario actual)
        const usernameExists = allUsers.some(u => 
            u.username === username && u.id !== selectedUser.id
        );
        
        if (usernameExists) {
            MatrixApp.showMessage('login-message', 'El nombre de usuario ya existe', 'error');
            return;
        }
        
        // Verificar email único
        const emailExists = allUsers.some(u => 
            u.email === email && u.id !== selectedUser.id
        );
        
        if (emailExists) {
            MatrixApp.showMessage('login-message', 'El email ya está registrado', 'error');
            return;
        }
        
        // Actualizar usuario
        selectedUser.username = username;
        selectedUser.email = email;
        selectedUser.balance = balance;
        selectedUser.role = role;
        selectedUser.updatedAt = new Date().toISOString();
        
        // Guardar cambios
        saveUsers();
        
        // Actualizar UI
        MatrixApp.showMessage('login-message', 'Usuario actualizado correctamente', 'success');
        closeEditModal();
        refreshAdminPanel();
    }
    
    function deleteUser(userId) {
        if (!confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
            return;
        }
        
        // No permitir eliminar el usuario admin principal
        if (userId === 'admin-001') {
            MatrixApp.showMessage('login-message', 'No se puede eliminar el administrador principal', 'error');
            return;
        }
        
        // Eliminar usuario
        allUsers = allUsers.filter(u => u.id !== userId);
        
        // Guardar cambios
        saveUsers();
        
        // Actualizar UI
        MatrixApp.showMessage('login-message', 'Usuario eliminado correctamente', 'success');
        refreshAdminPanel();
    }
    
    function createUser() {
        const username = document.getElementById('new-username').value.trim();
        const email = document.getElementById('new-email').value.trim();
        const password = document.getElementById('new-password').value;
        const balance = parseFloat(document.getElementById('new-balance').value) || 0;
        const role = document.getElementById('new-role').value;
        
        // Validaciones
        if (!username || !email || !password) {
            MatrixApp.showMessage('login-message', 'Todos los campos son requeridos', 'error');
            return;
        }
        
        if (username.length < 3) {
            MatrixApp.showMessage('login-message', 'El usuario debe tener al menos 3 caracteres', 'error');
            return;
        }
        
        if (password.length < 6) {
            MatrixApp.showMessage('login-message', 'La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            MatrixApp.showMessage('login-message', 'Email no válido', 'error');
            return;
        }
        
        // Verificar si el usuario ya existe
        if (allUsers.some(user => user.username === username)) {
            MatrixApp.showMessage('login-message', 'El nombre de usuario ya existe', 'error');
            return;
        }
        
        if (allUsers.some(user => user.email === email)) {
            MatrixApp.showMessage('login-message', 'El email ya está registrado', 'error');
            return;
        }
        
        // Crear nuevo usuario
        const newUser = {
            id: `user-${Date.now()}`,
            username,
            email,
            password,
            balance,
            role,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        allUsers.push(newUser);
        saveUsers();
        
        // Limpiar formulario y actualizar UI
        document.getElementById('create-user-form').reset();
        MatrixApp.showMessage('login-message', 'Usuario creado correctamente', 'success');
        refreshAdminPanel();
        closeCreateModal();
    }
    
    function saveUsers() {
        localStorage.setItem('matrixUsers', JSON.stringify(allUsers));
        
        // Notificar al módulo principal
        MatrixApp.getUsers = () => allUsers;
    }
    
    // ====================
    // REPORTES Y ESTADÍSTICAS
    // ====================
    function generateReport(type = 'daily') {
        const reports = {
            daily: generateDailyReport(),
            weekly: generateWeeklyReport(),
            monthly: generateMonthlyReport()
        };
        
        const report = reports[type] || reports.daily;
        showReportModal(report);
    }
    
    function generateDailyReport() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const transactions = JSON.parse(localStorage.getItem('matrixTransactions')) || [];
        const todayTransactions = transactions.filter(t => {
            const transDate = new Date(t.date);
            return transDate >= today;
        });
        
        const totalRevenue = todayTransactions.reduce((sum, t) => {
            if (t.currency === 'USD') return sum + t.amount;
            if (t.currency === 'ETH') return sum + (t.amount * 1800); // Tasa simulada
            return sum;
        }, 0);
        
        return {
            title: 'Reporte Diario',
            date: today.toLocaleDateString('es-ES'),
            totalTransactions: todayTransactions.length,
            totalRevenue: totalRevenue.toFixed(2),
            currency: 'USD',
            transactions: todayTransactions,
            summary: `Hoy se procesaron ${todayTransactions.length} transacciones por un total de $${totalRevenue.toFixed(2)} USD.`
        };
    }
    
    function generateWeeklyReport() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const transactions = JSON.parse(localStorage.getItem('matrixTransactions')) || [];
        const weeklyTransactions = transactions.filter(t => {
            const transDate = new Date(t.date);
            return transDate >= weekAgo;
        });
        
        const totalRevenue = weeklyTransactions.reduce((sum, t) => {
            if (t.currency === 'USD') return sum + t.amount;
            if (t.currency === 'ETH') return sum + (t.amount * 1800);
            return sum;
        }, 0);
        
        return {
            title: 'Reporte Semanal',
            period: `Del ${weekAgo.toLocaleDateString('es-ES')} al ${new Date().toLocaleDateString('es-ES')}`,
            totalTransactions: weeklyTransactions.length,
            totalRevenue: totalRevenue.toFixed(2),
            currency: 'USD',
            transactions: weeklyTransactions,
            summary: `En la última semana se procesaron ${weeklyTransactions.length} transacciones por un total de $${totalRevenue.toFixed(2)} USD.`
        };
    }
    
    function generateMonthlyReport() {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        const transactions = JSON.parse(localStorage.getItem('matrixTransactions')) || [];
        const monthlyTransactions = transactions.filter(t => {
            const transDate = new Date(t.date);
            return transDate >= monthAgo;
        });
        
        const totalRevenue = monthlyTransactions.reduce((sum, t) => {
            if (t.currency === 'USD') return sum + t.amount;
            if (t.currency === 'ETH') return sum + (t.amount * 1800);
            return sum;
        }, 0);
        
        return {
            title: 'Reporte Mensual',
            period: `Del ${monthAgo.toLocaleDateString('es-ES')} al ${new Date().toLocaleDateString('es-ES')}`,
            totalTransactions: monthlyTransactions.length,
            totalRevenue: totalRevenue.toFixed(2),
            currency: 'USD',
            transactions: monthlyTransactions,
            summary: `En el último mes se procesaron ${monthlyTransactions.length} transacciones por un total de $${totalRevenue.toFixed(2)} USD.`
        };
    }
    
    // ====================
    // INTERFAZ DE USUARIO
    // ====================
    function showEditModal() {
        const modal = createModal('edit-user-modal', 'Editar Usuario', `
            <form id="edit-user-form" class="admin-form">
                <div class="form-group">
                    <label for="edit-username">Usuario</label>
                    <input type="text" id="edit-username" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="edit-email">Email</label>
                    <input type="email" id="edit-email" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="edit-balance">Balance ($)</label>
                    <input type="number" id="edit
                                        <input type="number" id="edit-balance" class="form-control" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label for="edit-role">Rol</label>
                    <select id="edit-role" class="form-control">
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
                <input type="hidden" id="edit-user-id">
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="AdminModule.closeEditModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                </div>
            </form>
        `);
        
        // Configurar evento del formulario
        modal.querySelector('#edit-user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            updateUser();
        });
        
        document.body.appendChild(modal);
    }
    
    function showCreateModal() {
        const modal = createModal('create-user-modal', 'Crear Nuevo Usuario', `
            <form id="create-user-form" class="admin-form">
                <div class="form-group">
                    <label for="new-username">Usuario</label>
                    <input type="text" id="new-username" class="form-control" required minlength="3">
                </div>
                <div class="form-group">
                    <label for="new-email">Email</label>
                    <input type="email" id="new-email" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="new-password">Contraseña</label>
                    <input type="password" id="new-password" class="form-control" required minlength="6">
                </div>
                <div class="form-group">
                    <label for="new-balance">Balance Inicial ($)</label>
                    <input type="number" id="new-balance" class="form-control" step="0.01" min="0" value="0">
                </div>
                <div class="form-group">
                    <label for="new-role">Rol</label>
                    <select id="new-role" class="form-control">
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="AdminModule.closeCreateModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Crear Usuario</button>
                </div>
            </form>
        `);
        
        // Configurar evento del formulario
        modal.querySelector('#create-user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            createUser();
        });
        
        document.body.appendChild(modal);
    }
    
    function showReportModal(report) {
        const modal = createModal('report-modal', report.title, `
            <div class="report-header">
                <p><strong>Período:</strong> ${report.period || report.date}</p>
                <p><strong>Total Transacciones:</strong> ${report.totalTransactions}</p>
                <p><strong>Ingresos Totales:</strong> ${report.currency === 'USD' ? '$' : ''}${report.totalRevenue} ${report.currency}</p>
            </div>
            
            <div class="report-summary">
                <h4>Resumen</h4>
                <p>${report.summary}</p>
            </div>
            
            ${report.transactions.length > 0 ? `
            <div class="report-transactions">
                <h4>Últimas Transacciones</h4>
                <div class="table-container">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Usuario</th>
                                <th>Producto</th>
                                <th>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.transactions.slice(-10).map(t => `
                                <tr>
                                    <td>${new Date(t.date).toLocaleDateString()}</td>
                                    <td>${getUsernameById(t.userId)}</td>
                                    <td>${t.details?.productName || 'N/A'}</td>
                                    <td>${t.currency === 'USD' ? `$${t.amount.toFixed(2)}` : `${t.amount} ${t.currency}`}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : '<p class="no-data">No hay transacciones en este período</p>'}
            
            <div class="report-actions">
                <button onclick="AdminModule.exportReport('${report.title}')" class="btn btn-secondary">
                    <i class="fas fa-download"></i> Exportar CSV
                </button>
                <button onclick="AdminModule.printReport()" class="btn btn-secondary">
                    <i class="fas fa-print"></i> Imprimir
                </button>
            </div>
        `);
        
        document.body.appendChild(modal);
    }
    
    function createModal(id, title, content) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content admin-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-cog"></i> ${title}</h3>
                    <button class="close-modal" onclick="AdminModule.closeModal('${id}')">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return modal;
    }
    
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }
    
    function closeEditModal() {
        closeModal('edit-user-modal');
    }
    
    function closeCreateModal() {
        closeModal('create-user-modal');
    }
    
    function refreshAdminPanel() {
        loadAllUsers();
        
        // Actualizar tabla de usuarios
        const tbody = document.getElementById('users-table-body');
        if (tbody) {
            MatrixApp.showSection('admin-section');
        }
        
        // Actualizar selector de usuarios
        loadUserSelector();
    }
    
    function loadUserSelector() {
        const select = document.getElementById('selected-user');
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleccione un usuario</option>';
        
        const regularUsers = allUsers.filter(u => u.role === 'user');
        
        regularUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.username} ($${user.balance.toFixed(2)})`;
            select.appendChild(option);
        });
    }
    
    // ====================
    // UTILIDADES
    // ====================
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function getUsernameById(userId) {
        const user = allUsers.find(u => u.id === userId);
        return user ? user.username : 'Usuario desconocido';
    }
    
    function exportReport(reportTitle) {
        // Generar CSV con los datos
        const transactions = JSON.parse(localStorage.getItem('matrixTransactions')) || [];
        const users = allUsers;
        
        // Crear mapeo de usuarios
        const userMap = {};
        users.forEach(u => {
            userMap[u.id] = u.username;
        });
        
        // Generar contenido CSV
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Fecha,Usuario,Producto,Monto,Moneda,Estado\n";
        
        transactions.forEach(t => {
            const date = new Date(t.date).toLocaleDateString();
            const username = userMap[t.userId] || 'N/A';
            const product = t.details?.productName || 'N/A';
            const amount = t.amount;
            const currency = t.currency;
            const status = t.status;
            
            csvContent += `${date},${username},${product},${amount},${currency},${status}\n`;
        });
        
        // Crear enlace de descarga
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        MatrixApp.showMessage('login-message', 'Reporte exportado exitosamente', 'success');
    }
    
    function printReport() {
        window.print();
    }
    
    // ====================
    // EVENT LISTENERS
    // ====================
    function setupAdminEventListeners() {
        // Botón para crear usuario
        const createUserBtn = document.getElementById('create-user-btn');
        if (createUserBtn) {
            createUserBtn.addEventListener('click', showCreateModal);
        }
        
        // Botones de reportes
        const dailyReportBtn = document.getElementById('daily-report-btn');
        const weeklyReportBtn = document.getElementById('weekly-report-btn');
        const monthlyReportBtn = document.getElementById('monthly-report-btn');
        
        if (dailyReportBtn) {
            dailyReportBtn.addEventListener('click', () => generateReport('daily'));
        }
        
        if (weeklyReportBtn) {
            weeklyReportBtn.addEventListener('click', () => generateReport('weekly'));
        }
        
        if (monthlyReportBtn) {
            monthlyReportBtn.addEventListener('click', () => generateReport('monthly'));
        }
        
        // Botón de exportar datos
        const exportDataBtn = document.getElementById('export-data-btn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                exportAllData();
            });
        }
        
        // Botón de respaldo
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                createBackup();
            });
        }
    }
    
    function exportAllData() {
        const allData = {
            users: allUsers,
            transactions: JSON.parse(localStorage.getItem('matrixTransactions')) || [],
            exportDate: new Date().toISOString(),
            system: 'Matrix System'
        };
        
        const dataStr = JSON.stringify(allData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `matrix_system_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        MatrixApp.showMessage('login-message', 'Datos exportados exitosamente', 'success');
    }
    
    function createBackup() {
        const backupData = {
            users: allUsers,
            transactions: JSON.parse(localStorage.getItem('matrixTransactions')) || [],
            backupDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        localStorage.setItem('matrixBackup', JSON.stringify(backupData));
        
        MatrixApp.showMessage('login-message', 'Respaldo creado exitosamente', 'success');
        
        // Mostrar información del respaldo
        const backupInfo = document.createElement('div');
        backupInfo.className = 'backup-info';
        backupInfo.innerHTML = `
            <p><strong>Respaldo creado:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Usuarios:</strong> ${backupData.users.length}</p>
            <p><strong>Transacciones:</strong> ${backupData.transactions.length}</p>
        `;
        
        // Mostrar temporalmente
        const messageArea = document.getElementById('login-message');
        if (messageArea) {
            messageArea.appendChild(backupInfo);
            setTimeout(() => {
                if (backupInfo.parentNode) {
                    backupInfo.remove();
                }
            }, 5000);
        }
    }
    
    // ====================
    // FUNCIONES PÚBLICAS
    // ====================
    return {
        init,
        selectUserForEdit,
        deleteUser,
        createUser,
        updateUser,
        generateReport,
        exportReport,
        printReport,
        closeModal,
        closeEditModal,
        closeCreateModal,
        refreshAdminPanel,
        exportAllData,
        createBackup
    };
})();

// ====================
// INICIALIZAR MÓDULO
// ====================
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que MatrixApp esté listo
    setTimeout(() => {
        const currentUser = MatrixApp.getCurrentUser();
        if (currentUser && currentUser.role === 'admin') {
            AdminModule.init();
        }
    }, 100);
});