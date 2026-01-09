// ====================
// MÓDULO DE PAGOS
// ====================
const PaymentModule = (() => {
    // ====================
    // CONSTANTES Y CONFIGURACIÓN
    // ====================
    const PAYMENT_CONFIG = {
        steps: {
            1: { name: 'Validación', duration: 1500 },
            2: { name: 'Procesamiento', duration: 2000 },
            3: { name: 'Confirmación', duration: 2500 },
            4: { name: 'Completado', duration: 1000 }
        },
        
        products: {
            book: {
                name: 'Libro Físico "Matrix Code"',
                price: 49.99,
                shipping: 5.99,
                tax: 0,
                currency: 'USD',
                description: 'Edición limitada del libro Matrix Code con contenido exclusivo.'
            },
            crypto: {
                name: 'Recarga con Criptomonedas',
                price: 0.05,
                currency: 'ETH',
                discount: 0.05, // 5%
                description: 'Recarga instantánea usando Ethereum.'
            }
        },
        
        crypto: {
            networks: {
                ethereum: {
                    name: 'Ethereum Mainnet',
                    symbol: 'ETH',
                    address: '0x7a3Bc8f9D2C5e6a8f1B4d3E7F9A2C8B6E5D4F3A1',
                    qrSize: 250
                },
                bitcoin: {
                    name: 'Bitcoin',
                    symbol: 'BTC',
                    address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
                    qrSize: 250
                },
                usdt: {
                    name: 'Tether (ERC20)',
                    symbol: 'USDT',
                    address: '0x7a3Bc8f9D2C5e6a8f1B4d3E7F9A2C8B6E5D4F3A1',
                    qrSize: 250
                }
            },
            
            exchangeRates: {
                ETH: 1800,
                BTC: 42000,
                USDT: 1
            }
        }
    };
    
    // ====================
    // VARIABLES
    // ====================
    let currentPayment = null;
    let paymentInterval = null;
    let currentStep = 0;
    
    // ====================
    // INICIALIZACIÓN
    // ====================
    function init() {
        setupPaymentEventListeners();
        console.log('✅ Payment Module inicializado');
    }
    
    // ====================
    // PROCESAMIENTO DE PAGOS
    // ====================
    function processPayment(productType, options = {}) {
        if (currentPayment) {
            console.warn('Ya hay un pago en proceso');
            return;
        }
        
        const currentUser = MatrixApp.getCurrentUser();
        if (!currentUser) {
            MatrixApp.showMessage('login-message', 'Debe iniciar sesión para realizar pagos', 'error');
            return;
        }
        
        const product = PAYMENT_CONFIG.products[productType];
        if (!product) {
            MatrixApp.showMessage('login-message', 'Producto no válido', 'error');
            return;
        }
        
        // Crear objeto de pago
        currentPayment = {
            id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: currentUser.id,
            productType: productType,
            product: product,
            amount: calculateTotal(productType, options),
            currency: product.currency,
            status: 'pending',
            createdAt: new Date().toISOString(),
            steps: {},
            metadata: options
        };
        
        // Configurar UI de pago
        setupPaymentUI(currentPayment);
        
        // Iniciar proceso
        startPaymentProcess();
    }
    
    function calculateTotal(productType, options) {
        const product = PAYMENT_CONFIG.products[productType];
        let total = product.price;
        
        if (productType === 'book') {
            total += product.shipping || 0;
            total += product.tax || 0;
        }
        
        if (productType === 'crypto' && product.discount) {
            total *= (1 - product.discount);
        }
        
        // Aplicar opciones adicionales
        if (options.coupon) {
            total *= 0.9; // 10% de descuento por cupón
        }
        
        return parseFloat(total.toFixed(product.currency === 'ETH' ? 6 : 2));
    }
    
    // ====================
    // INTERFAZ DE PAGO
    // ====================
    function setupPaymentUI(payment) {
        // Configurar información del pedido
        document.getElementById('order-product').textContent = payment.product.name;
        
        const totalElement = document.querySelector('.order-total');
        if (payment.currency === 'USD') {
            totalElement.textContent = `$${payment.amount.toFixed(2)}`;
            totalElement.className = 'order-total usd';
        } else {
            totalElement.textContent = `${payment.amount} ${payment.currency}`;
            totalElement.className = 'order-total crypto';
            
            // Mostrar equivalente en USD
            const usdValue = (payment.amount * PAYMENT_CONFIG.crypto.exchangeRates[payment.currency]).toFixed(2);
            const usdElement = document.createElement('div');
            usdElement.className = 'usd-equivalent';
            usdElement.textContent = `≈ $${usdValue} USD`;
            totalElement.appendChild(usdElement);
        }
        
        // Mostrar detalles crypto si aplica
        const cryptoDetails = document.getElementById('crypto-details');
        if (payment.productType === 'crypto') {
            cryptoDetails.classList.remove('hidden');
            
            // Configurar información crypto
            const network = PAYMENT_CONFIG.crypto.networks.ethereum;
            cryptoDetails.querySelector('code').textContent = `${network.address.substring(0, 10)}...${network.address.substring(34)}`;
            cryptoDetails.querySelector('strong').textContent = `${payment.amount} ${payment.currency}`;
        } else {
            cryptoDetails.classList.add('hidden');
        }
        
        // Reiniciar pasos
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active', 'completed');
            step.querySelector('.step-check').classList.add('hidden');
        });
        
        // Reiniciar barra de progreso
        document.getElementById('progress-fill').style.width = '0%';
        document.getElementById('progress-percentage').textContent = '0%';
        document.getElementById('progress-status').textContent = 'Preparando pago...';
        
        // Actualizar estado
        document.getElementById('process-status').textContent = 'Inicializando sistema de pagos...';
    }
    
    function startPaymentProcess() {
        currentStep = 0;
        
        // Mostrar sección de pago
        MatrixApp.showSection('payment-section');
        
        // Iniciar secuencia de pasos
        nextPaymentStep();
    }
    
    function nextPaymentStep() {
        currentStep++;
        
        if (currentStep > Object.keys(PAYMENT_CONFIG.steps).length) {
            completePayment();
            return;
        }
        
        const stepConfig = PAYMENT_CONFIG.steps[currentStep];
        
        // Actualizar UI
        updateStepUI(currentStep);
        updateProgressBar(currentStep);
        
        // Registrar paso
        currentPayment.steps[`step_${currentStep}`] = {
            name: stepConfig.name,
            startedAt: new Date().toISOString(),
            status: 'processing'
        };
        
        // Simular procesamiento del paso
        simulateStepProcessing(currentStep, stepConfig.duration);
    }
    
    function updateStepUI(stepNumber) {
        // Actualizar todos los pasos
        document.querySelectorAll('.step').forEach(step => {
            const stepData = parseInt(step.getAttribute('data-step'));
            
            step.classList.remove('active', 'completed');
            step.querySelector('.step-check').classList.add('hidden');
            
            if (stepData < stepNumber) {
                step.classList.add('completed');
                step.querySelector('.step-check').classList.remove('hidden');
            } else if (stepData === stepNumber) {
                step.classList.add('active');
            }
        });
        
        // Actualizar textos de progreso
        const stepConfig = PAYMENT_CONFIG.steps[stepNumber];
        const progressStatus = document.getElementById('progress-status');
        const processStatus = document.getElementById('process-status');
        
        progressStatus.textContent = `${stepConfig.name}...`;
        
        switch(stepNumber) {
            case 1:
                processStatus.textContent = 'Verificando datos del usuario y validando stock...';
                break;
            case 2:
                processStatus.textContent = currentPayment.productType === 'crypto' 
                    ? 'Generando dirección de wallet y código QR...'
                    : 'Procesando tarjeta de crédito/débito...';
                break;
            case 3:
                processStatus.textContent = currentPayment.productType === 'crypto'
                    ? 'Esperando confirmación de la transacción en la blockchain...'
                    : 'Verificando con el banco emisor...';
                break;
            case 4:
                processStatus.textContent = 'Finalizando transacción y actualizando registros...';
                break;
        }
    }
    
    function updateProgressBar(stepNumber) {
        const totalSteps = Object.keys(PAYMENT_CONFIG.steps).length;
        const percentage = (stepNumber / totalSteps) * 100;
        
        const progressBar = document.getElementById('progress-fill');
        const progressPercentage = document.getElementById('progress-percentage');
        
        progressBar.style.width = `${percentage}%`;
        progressPercentage.textContent = `${Math.round(percentage)}%`;
    }
    
    function simulateStepProcessing(stepNumber, duration) {
        // Simular tiempo de procesamiento
        setTimeout(() => {
            // Marcar paso como completado
            currentPayment.steps[`step_${stepNumber}`].completedAt = new Date().toISOString();
            currentPayment.steps[`step_${stepNumber}`].status = 'completed';
            
            // Pasar al siguiente paso
            nextPaymentStep();
        }, duration);
    }
    
    function completePayment() {
        // Actualizar estado del pago
        currentPayment.status = 'completed';
        currentPayment.completedAt = new Date().toISOString();
        
        // Generar ID de transacción
        currentPayment.transactionId = `TX${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        // Guardar transacción
        saveTransaction();
        
        // Actualizar balance del usuario
        updateUserBalance();
        
        // Mostrar página de éxito
        showSuccessPage();
        
        // Limpiar pago actual
        setTimeout(() => {
            currentPayment = null;
        }, 3000);
    }
    
    function saveTransaction() {
        const transactions = JSON.parse(localStorage.getItem('matrixTransactions')) || [];
        
        const transaction = {
            id: currentPayment.transactionId,
            userId: currentPayment.userId,
            product: currentPayment.productType,
            productName: currentPayment.product.name,
            amount: currentPayment.amount,
            currency: currentPayment.currency,
            status: 'completed',
            date: currentPayment.completedAt,
            details: {
                steps: currentPayment.steps,
                metadata: currentPayment.metadata
            }
        };
        
        transactions.push(transaction);
        localStorage.setItem('matrixTransactions', JSON.stringify(transactions));
    }
    
    function updateUserBalance() {
        if (currentPayment.productType === 'crypto') {
            // Para pagos crypto, agregar el monto equivalente en USD al balance
            const exchangeRate = PAYMENT_CONFIG.crypto.exchangeRates[currentPayment.currency] || 1;
            const usdAmount = currentPayment.amount * exchangeRate;
            
            MatrixApp.updateUserBalance(currentPayment.userId, usdAmount, 'add');
        } else if (currentPayment.productType === 'book') {
            // Para el libro, simular que se acredita el monto del producto (sin shipping)
            MatrixApp.updateUserBalance(currentPayment.userId, currentPayment.product.price, 'add');
        }
    }
    
    function showSuccessPage() {
        // Configurar detalles en la página de éxito
        document.getElementById('transaction-id').textContent = currentPayment.transactionId;
        
        const amountElement = document.getElementById('success-amount');
        if (currentPayment.currency === 'USD') {
            amountElement.textContent = `$${currentPayment.amount.toFixed(2)}`;
            amountElement.className = 'usd';
        } else {
            amountElement.textContent = `${currentPayment.amount} ${currentPayment.currency}`;
            amountElement.className = 'crypto';
            
            // Mostrar equivalente
            const exchangeRate = PAYMENT_CONFIG.crypto.exchangeRates[currentPayment.currency] || 1;
            const usdValue = (currentPayment.amount * exchangeRate).toFixed(2);
            amountElement.innerHTML += ` <small>(≈ $${usdValue} USD)</small>`;
        }
        
        document.getElementById('success-product').textContent = currentPayment.product.name;
        document.getElementById('success-date').textContent = 
            new Date(currentPayment.completedAt).toLocaleString('es-ES');
        
        // Mostrar sección de éxito
        MatrixApp.showSection('success-section');
    }
    
    // ====================
    // CRYPTO PAYMENTS
    // ====================
    function generateCryptoQR(network = 'ethereum', amount) {
        const cryptoConfig = PAYMENT_CONFIG.crypto.networks[network];
        if (!cryptoConfig) {
            console.error('Red no soportada:', network);
            return null;
        }
        
        // En una implementación real, usarías una librería como QRCode.js
        // Por ahora simulamos la generación
        
        const qrData = {
            address: cryptoConfig.address,
            amount: amount || PAYMENT_CONFIG.products.crypto.price,
            network: cryptoConfig.name,
            symbol: cryptoConfig.symbol
        };
        
        return {
            data: qrData,
            size: cryptoConfig.qrSize,
            network: cryptoConfig.name
        };
    }
    
    function simulateCryptoPayment(network, amount) {
        // Simular recepción de pago crypto
        console.log(`Simulando pago ${network} por ${amount}`);
        
        // Mostrar notificación de pago recibido
        MatrixApp.showMessage(
            'login-message',
            `¡Pago ${network.toUpperCase()} detectado! Verificando transacción...`,
            'info'
        );
        
        // Simular verificación blockchain
        setTimeout(() => {
            MatrixApp.showMessage(
                'login-message',
                `¡Pago ${network.toUpperCase()} confirmado! Balance actualizado.`,
                'success'
            );
            
            // Actualizar balance
            const exchangeRate = PAYMENT_CONFIG.crypto.exchangeRates[network.toUpperCase()] || 1;
            const usdAmount = amount * exchangeRate;
            
            const currentUser = MatrixApp.getCurrentUser();
            if (currentUser) {
                MatrixApp.updateUserBalance(currentUser.id, usdAmount, 'add');
            }
            
        }, 3000);
    }
    
    // ====================
    // GESTIÓN DE ERRORES
    // ====================
    function handlePaymentError(error) {
        console.error('Error en el pago:', error);
        
        currentPayment.status = 'failed';
        currentPayment.error = error.message;
        currentPayment.failedAt = new Date().toISOString();
        
        // Mostrar error al usuario
        MatrixApp.showMessage('login-message', `Error en el pago: ${error.message}`, 'error');
        
        // Volver al panel de usuario
        setTimeout(() => {
            if (MatrixApp.getCurrentUser()) {
                MatrixApp.showSection('user-section');
            }
            currentPayment = null;
        }, 3000);
    }
    
    // ====================
    // EVENT LISTENERS
    // ====================
    function setupPaymentEventListeners() {
        // Botones de compra
        document.querySelectorAll('[data-product]').forEach(button => {
            button.addEventListener('click', function() {
                const productType = this.getAttribute('data-product');
                const options = {
                    coupon: this.getAttribute('data-coupon') || null
                };
                
                processPayment(productType, options);
            });
        });
        
        // Botón de volver al panel desde éxito
        const backToDashboard = document.getElementById('back-to-dashboard');
        if (backToDashboard) {
            backToDashboard.addEventListener('click', () => {
                if (MatrixApp.getCurrentUser()) {
                    MatrixApp.showSection('user-section');
                }
            });
        }
        
        // Botón de imprimir recibo
        const printReceipt = document.getElementById('print-receipt');
        if (printReceipt) {
            printReceipt.addEventListener('click', () => {
                generateReceipt();
            });
        }
        
        // Botón de nueva compra
        const newPurchase = document.getElementById('new-purchase');
        if (newPurchase) {
            newPurchase.addEventListener('click', () => {
                MatrixApp.showSection('user-section');
            });
        }
        
        // Simulación de pago crypto con teclas
        document.addEventListener('keydown', (e) => {
            // Ctrl+E para simular pago Ethereum
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                simulateCryptoPayment('ethereum', 0.05);
            }
            
            // Ctrl+B para simular pago Bitcoin
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                simulateCryptoPayment('bitcoin', 0.001);
            }
        });
    }
    
    function generateReceipt() {
        if (!currentPayment) return;
        
        const receiptWindow = window.open('', '_blank');
        receiptWindow.document.write(`
            <html>
            <head>
                <title>Recibo - ${currentPayment.transactionId}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .receipt { max-width: 400px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .details { margin-bottom: 20px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                    .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; padding-top: 10px; }
                    .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <h2>MATRIX SYSTEM</h2>
                        <p>Recibo de Pago</p>
                    </div>
                    <div class="details">
                        <div class="row">
                            <span>ID Transacción:</span>
                            <span>${currentPayment.transactionId}</span>
                        </div>
                        <div class="row">
                            <span>Fecha:</span>
                            <span>${new Date(currentPayment.completedAt).toLocaleString()}</span>
                        </div>
                        <div class="row">
                            <span>Producto:</span>
                            <span>${currentPayment.product.name}</span>
                        </div>
                        <div class="row">
                            <span>Cantidad:</span>
                            <span>1</span>
                        </div>
                    </div>
                    <div class="total">
                        <div class="row">
                            <span>TOTAL:</span>
                            <span>${currentPayment.currency === 'USD' ? '$' : ''}${currentPayment.amount} ${currentPayment.currency}</span>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Gracias por su compra</p>
                        <p>www.matrix-system.com</p>
                        <p>Soporte: soporte@matrix-system.com</p>
                    </div>
                </div>
            </body>
            </html>
        `);
        
        receiptWindow.document.close();
        receiptWindow.print();
    }
    
    // ====================
    // FUNCIONES PÚBLICAS
    // ====================
    return {
        init,
        processPayment,
        generateCryptoQR,
        simulateCryptoPayment,
        handlePaymentError
    };
})();

// ====================
// INICIALIZAR MÓDULO
// ====================
document.addEventListener('DOMContentLoaded', () => {
    PaymentModule.init();
});