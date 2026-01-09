// ====================
// EFECTO MATRIX DE FONDO
// ====================
class MatrixEffect {
    constructor() {
        this.canvas = document.getElementById('matrix-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.chars = [];
        this.fontSize = 14;
        this.columns = 0;
        this.drops = [];
        this.animationId = null;
        this.isActive = false;
        
        // Caracteres para el efecto Matrix
        this.matrixChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";
        this.charArray = this.matrixChars.split("");
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupColumns();
        this.start();
        
        // Recalcular en resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.setupColumns();
        });
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Mejorar calidad en pantallas retina
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
    }
    
    setupColumns() {
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.drops = Array(this.columns).fill(1);
        
        // Inicializar posiciones aleatorias
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * this.canvas.height / this.fontSize;
        }
    }
    
    draw() {
        // Fondo semi-transparente para efecto de rastro
        this.ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Configurar fuente
        this.ctx.font = `${this.fontSize}px 'Courier New', monospace`;
        this.ctx.textAlign = 'center';
        
        // Dibujar caracteres
        for (let i = 0; i < this.drops.length; i++) {
            // Carácter aleatorio
            const char = this.charArray[Math.floor(Math.random() * this.charArray.length)];
            
            // Posición
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;
            
            // Color basado en la posición
            const alpha = Math.min(1, (this.drops[i] * this.fontSize) / this.canvas.height);
            const brightness = 1 - alpha * 0.7;
            
            // Colores Matrix
            let color;
            if (Math.random() > 0.98) {
                // Caracteres "brillantes" ocasionales
                color = `rgba(255, 255, 255, ${brightness})`;
            } else if (Math.random() > 0.95) {
                // Azul Matrix ocasional
                color = `rgba(0, 102, 255, ${brightness})`;
            } else {
                // Verde Matrix estándar
                color = `rgba(0, 255, 65, ${brightness})`;
            }
            
            this.ctx.fillStyle = color;
            this.ctx.fillText(char, x + this.fontSize / 2, y);
            
            // Mover gota hacia abajo
            this.drops[i]++;
            
            // Reiniciar si sale de la pantalla
            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            
            // Ocasionalmente crear nuevas gotas
            if (Math.random() > 0.995) {
                this.drops[i] = 0;
            }
        }
    }
    
    animate() {
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    start() {
        if (!this.isActive) {
            this.isActive = true;
            this.animate();
        }
    }
    
    stop() {
        if (this.isActive && this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.isActive = false;
        }
    }
    
    setIntensity(intensity) {
        // Puedes ajustar la intensidad del efecto aquí
        // intensity va de 0 a 1
        const newFontSize = 10 + (intensity * 10);
        this.fontSize = newFontSize;
        this.setupColumns();
    }
    
    toggle() {
        if (this.isActive) {
            this.stop();
        } else {
            this.start();
        }
    }
}

// ====================
// INICIALIZAR EFECTO
// ====================
let matrixEffect;

document.addEventListener('DOMContentLoaded', () => {
    matrixEffect = new MatrixEffect();
    
    // Exponer controles para debugging (opcional)
    window.matrixEffect = matrixEffect;
    
    // Control por teclas para debugging
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'm') {
            matrixEffect.toggle();
            console.log('Matrix effect toggled');
        }
        
        if (e.ctrlKey && e.key === '[') {
            matrixEffect.setIntensity(0.3);
            console.log('Matrix intensity: Low');
        }
        
        if (e.ctrlKey && e.key === ']') {
            matrixEffect.setIntensity(0.7);
            console.log('Matrix intensity: High');
        }
    });
});