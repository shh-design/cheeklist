// ====================
// MÓDULO DE USUARIO
// ====================
const UserModule = (() => {
    // ====================
    // CONSTANTES
    // ====================
    const PRODUCTS = {
        book: {
            id: 'product-book',
            name: 'Libro Físico "Matrix Code"',
            description: 'Edición limitada con contenido exclusivo sobre programación y criptografía',
            price: 49.99,
            shipping: 5.99,
            currency: 'USD',
            type: 'physical'
        },
        crypto: {
            id: 'product-crypto',
            name: 'Recarga Crypto',
            description: 'Recarga tu balance usando criptomonedas (Bitcoin, Ethereum, USDT)',
            price: 0.05,
            currency: 'ETH',
            discount: 0.05, // 5% de descuento
            type: 'digital'
        }
    };
    
    // ====================
    // VARIABLES
    // ====================
    let userTransactions = [];
    
    // ====================
    // INICIALIZACIÓN
    // ====================
    function init() {
        loadUserTransactions();
        setupUserEventListeners();
    }
    
    // ====================
    // TRANSACCIONES
    // ====================
    function loadUserTransactions() {
        const currentUser = MatrixApp.getCurrentUser();
        if (!currentUser) return;
        
        const allTransactions = JSON.parse(localStorage.getItem('matrixTransactions')) || [];
        userTransactions = allTransactions.filter(t => t.userId === currentUser.id);
        
        updateTransactionHistory();
    }
    
    function addTransaction(transaction) {
        userTransactions.push(transaction);
        updateTransactionHistory();
        
        // Actualizar en almacenamiento global
        const allTransactions = JSON.parse(localStorage.getItem('matrixTransactions')) || [];
        allTransactions.push(transaction);
        localStorage.setItem('matrixTransactions', JSON.stringify(allTransactions));
    }
    
    function updateTransactionHistory() {
        // Esta función actualizaría una lista de transacciones si la tuvieras en el UI
        const transactionList = document.getElementById('transaction-history');
        if (!transactionList) return;
        
        transactionList.innerHTML = '';
        
        userTransactions.slice(-5).reverse().forEach(transaction => {
            const li = document.createElement('li');
            li.className = 'transaction-item';
            
            const date = new Date(transaction.date).toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric'
            });
            
            const amount = transaction.currency === 'USD' ? 
                `$${transaction.amount.toFixed(2)}` : 
                `${transaction.amount} ${transaction.currency}`;
            
            li.innerHTML = `
                <div class="transaction-info">
                    <span class="transaction-product">${transaction.details?.productName || 'Producto'}</span>
                    <span class="transaction-date">${date}</span>
                </div>
                <div class="transaction-amount ${transaction.status}">
                    ${amount}
                </div>
            `;
            
            transactionList.appendChild(li);
        });
    }
    
    // ====================
    // GESTIÓN DE QR
    // ====================
    function generateQRCode(address = '0x7a3Bc8...9f2C', amount = '0.05') {
        const qrContainer = document.getElementById('qr-code');
        if (!qrContainer) return;
        
        // En una implementación real, aquí usarías una librería QR
        // Por ahora creamos un QR simulado
        qrContainer.innerHTML = `
            <div class="qr-content">
                <div class="qr-header">
                    <i class="fab fa-ethereum"></i>
                    <span>Ethereum Payment</span>
                </div>
                <div class="qr-address">
                    ${address}
                </div>
                <div class="qr-amount">
                    ${amount} ETH
                </div>
                <div class="qr-note">
                    Escanee para pagar
                </div>
            </div>
        `;
        
        // Simular generación de QR
        simulateQRGeneration();
    }
    
    function simulateQRGeneration() {
        const qrContainer = document.getElementById('qr-display-container');
        qrContainer.classList.add('scan-effect');
        
        setTimeout(() => {
            qrContainer.classList.remove('scan-effect');
            
            // Mostrar notificación
            MatrixApp.showMessage(
                'login-message', 
                'QR generado. Escanee con su wallet.', 
                'info'
            );
        }, 1500);
    }
    
    // ====================
    // VALIDACIONES
    // ====================
    function validatePurchase(productId) {
        const currentUser = MatrixApp.getCurrentUser();
        
        if (!currentUser) {
            return { valid: false, message: 'Debe iniciar sesión' };
        }
        
        const product = PRODUCTS[productId];
        if (!product) {
            return { valid: false, message: 'Producto no disponible' };
        }
        
        // Validaciones específicas por producto
        if (productId === 'book') {
            // Validar dirección de envío si fuera necesario
            return { valid: true, product };
        }
        
        if (productId === 'crypto') {
            // Validar para crypto
            return { valid: true, product };
        }
        
        return { valid: false, message: 'Producto no válido' };
    }
    
    // ====================
    // CALCULADORAS
    // ====================
    function calculateTotal(productId) {
        const product = PRODUCTS[productId];
        if (!product) return 0;
        
        if (productId === 'book') {
            return product.price + product.shipping;
        }
        
        if (productId === 'crypto') {
            // Convertir ETH a USD (tasa simulada)
            const ethToUsd = 1800; // Tasa simulada
            const discountedPrice = product.price * (1 - product.discount);
            return discountedPrice * ethToUsd;
        }
        
        return product.price;
    }
    
    function formatCurrency(amount, currency) {
        const formatter = new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency === 'ETH' ? 'USD' : currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: currency === 'ETH' ? 6 : 2
        });
        
        if (currency === 'ETH') {
            return `${amount} ETH (≈${formatter.format(amount * 1800)})`;
        }
        
        return formatter.format(amount);
    }
    
    // ====================
    // EVENT LISTENERS
    // ====================
    function setupUserEventListeners() {
        // Selector de producto para detalles
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('mouseenter', function() {
                const productId = this.id.includes('book') ? 'book' : 'crypto';
                showProductDetails(productId);
            });
            
            option.addEventListener('click', function(e) {
                if (!e.target.classList.contains('btn-buy')) {
                    const productId = this.id.includes('book') ? 'book' : 'crypto';
                    showProductModal(productId);
                }
            });
        });
        
        // Botón para recargar saldo
        const rechargeBtn = document.getElementById('recharge-balance');
        if (rechargeBtn) {
            rechargeBtn.addEventListener('click', () => {
                MatrixApp.showSection('payment-section');
            });
        }
        
        // Botón para ver historial
        const historyBtn = document.getElementById('view-history');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                showTransactionHistory();
            });
        }
        
        // Cuando se muestra el QR
        const cryptoOption = document.getElementById('crypto-option');
        if (cryptoOption) {
            const showQRBtn = cryptoOption.querySelector('.btn-buy');
            if (showQRBtn) {
                showQRBtn.addEventListener('click', () => {
                    generateQRCode();
                });
            }
        }
        
        // Simular pago crypto completado
        document.addEventListener('keydown', (e) => {
            // Atajo de teclado para simular pago crypto (Ctrl+Shift+C)
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                simulateCryptoPayment();
            }
        });
    }
    
    // ====================
    // UI HELPERS
    // ====================
    function showProductDetails(productId) {
        const product = PRODUCTS[productId];
        if (!product) return;
        
        // Actualizar tooltip o información en tiempo real
        const detailsPanel = document.getElementById('product-details-panel');
        if (detailsPanel) {
            detailsPanel.innerHTML = `
                <h4>${product.name}</h4>
                <p>${product.description}</p>
                <p><strong>Precio:</strong> ${formatCurrency(
                    productId === 'book' ? product.price + product.shipping : product.price,
                    product.currency
                )}</p>
                ${product.discount ? 
                    `<p class="discount-badge">${product.discount * 100}% DE DESCUENTO</p>` : 
                    ''}
            `;
            detailsPanel.classList.remove('hidden');
        }
    }
    
    function showProductModal(productId) {
        const product = PRODUCTS[productId];
        if (!product) return;
        
        // En una implementación completa, mostrarías un modal
        console.log(`Mostrando detalles de ${product.name}`);
        
        // Por ahora mostramos un mensaje
        MatrixApp.showMessage(
            'login-message',
            `${product.name}: ${product.description}`,
            'info'
        );
    }
    
    function showTransactionHistory() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-history"></i> Historial de Transacciones</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${userTransactions.length === 0 ? 
                        '<p class="no-transactions">No hay transacciones registradas</p>' : 
                        generateTransactionsTable()}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Cerrar modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    function generateTransactionsTable() {
        return `
            <table class="transactions-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Monto</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${userTransactions.map(transaction => `
                        <tr>
                            <td>${new Date(transaction.date).toLocaleDateString()}</td>
                            <td>${transaction.details?.productName || 'N/A'}</td>
                            <td>${transaction.currency === 'USD' ? 
                                `$${transaction.amount.toFixed(2)}` : 
                                `${transaction.amount} ${transaction.currency}`}</td>
                            <td><span class="status-badge ${transaction.status}">${transaction.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    // ====================
    // SIMULACIONES
    // ====================
    function simulateCryptoPayment() {
        const currentUser = MatrixApp.getCurrentUser();
        if (!currentUser) return;
        
        // Simular pago crypto exitoso
        const transaction = {
            id: `crypto-${Date.now()}`,
            userId: currentUser.id,
            product: 'crypto',
            amount: 0.05,
            currency: 'ETH',
            status: 'completed',
            date: new Date().toISOString(),
            details: {
                productName: 'Recarga Crypto',
                address: '0x7a3Bc8...9f2C',
                txHash: '0xabc123...def456'
            }
        };
        
        addTransaction(transaction);
        
        // Actualizar balance
        const ethToUsd = 1800;
        const usdAmount = 0.05 * ethToUsd;
        MatrixApp.updateUserBalance(currentUser.id, usdAmount, 'add');
        
        // Mostrar notificación
        MatrixApp.showMessage(
            'login-message',
            `¡Pago crypto recibido! +$${usdAmount.toFixed(2)} agregados a tu balance.`,
            'success'
        );
        
        // Actualizar panel de usuario
        if (document.getElementById('user-section').classList.contains('active')) {
            MatrixApp.showSection('user-section');
        }
    }
    
    // ====================
    // FUNCIONES PÚBLICAS
    // ====================
    return {
        init,
        validatePurchase,
        calculateTotal,
        formatCurrency,
        generateQRCode,
        simulateCryptoPayment
    };
})();

// ====================
// INICIALIZAR MÓDULO
// ====================
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que MatrixApp esté listo
    setTimeout(() => {
        if (MatrixApp.getCurrentUser()) {
            UserModule.init();
        }
    }, 100);
});