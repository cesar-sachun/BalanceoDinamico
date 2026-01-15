export default class PolarCanvasController {
    constructor(containerId, coordsDisplayId) {
        this.containerId = containerId; // Guardar ID del contenedor
        // Estado del Plano
        this.center = { x: 0, y: 0 }; // Coordenadas del plano (0,0) relativas al stage
        this.scale = 50; // Píxeles por unidad de radio. Define el zoom inicial.
        this.minScale = 0.005; // Escala mínima para r=10000
        this.maxScale = 1000; // Escala máxima para r=0.001

        // Inicializar Stage y Capas (Layers)
        const containerElement = document.getElementById(containerId);
        this.stage = new Konva.Stage({
            container: containerId,
            width: containerElement.offsetWidth,
            height: containerElement.offsetHeight,
        });

        // Capas para la optimización del rendimiento
        this.gridLayer = new Konva.Layer();
        this.dataLayer = new Konva.Layer(); // Vectores y Círculos
        this.stage.add(this.gridLayer, this.dataLayer);

        // Referencia al display de coordenadas
        this.coordsDisplay = document.getElementById(coordsDisplayId);

        // Inicializar el Centro y las Transformaciones
        this.initializeView();

        // Configurar la Interactividad (Pan y Zoom)
        this.setupEventListeners();
        
        // Dibujo Inicial
        this.drawGrid();
    }

    // --- LÓGICA DE TRANSFORMACIÓN Y VISTA ---

    initializeView() {
        // Mostrar el origen (0,0) del plano en el centro del contenedor al inicio
        this.stage.container().style.backgroundColor = '#ffffff'; // Color de fondo claro para el canvas
        
        // Mover el punto de origen de la capa de datos al centro de la pantalla
        this.dataLayer.x(this.stage.width() / 2);
        this.dataLayer.y(this.stage.height() / 2);
        
        this.gridLayer.x(this.stage.width() / 2);
        this.gridLayer.y(this.stage.height() / 2);
        
        // Guardar las coordenadas del centro del stage para el pan.
        this.center = { x: this.stage.width() / 2, y: this.stage.height() / 2 };
        
        // Ajustar el evento de redimensionamiento de la ventana
        this.resizeHandler = this.handleResize.bind(this);
        window.addEventListener('resize', this.resizeHandler);
    }
    
    handleResize() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Ajustar el tamaño del Stage al contenedor
        this.stage.width(container.offsetWidth);
        this.stage.height(container.offsetHeight);
        
        // Recalcular el centro y actualizar las capas
        this.center = { x: this.stage.width() / 2, y: this.stage.height() / 2 };
        this.dataLayer.x(this.center.x);
        this.dataLayer.y(this.center.y);
        this.gridLayer.x(this.center.x);
        this.gridLayer.y(this.center.y);
        
        this.drawGrid(); // Redibujar la cuadrícula para adaptarla al nuevo tamaño
    }

    // --- LÓGICA DEL DIBUJO ---

    drawGrid() {
        this.gridLayer.destroyChildren(); // Limpiar la capa antes de redibujar

        const maxRadius = Math.min(this.stage.width(), this.stage.height()) * 1.5; // Dibujar más allá de la vista visible
        
        // --- Cálculo de Paso "Bonito" (Nice Step) ---
        // Queremos que la distancia visual entre círculos esté entre ~50px y ~150px
        const minPixelSpacing = 60; 
        
        // 1. Calcular el tamaño de un paso de '1 unidad' en píxeles actuales
        // Si scale = 50 (50px por unidad), y queremos min 60px, entonces el paso debe ser > 1.
        
        // targetStepInUnits * scale >= minPixelSpacing
        // targetStepInUnits >= minPixelSpacing / scale
        const rawStep = minPixelSpacing / this.scale;

        // 2. Encontrar el "numero bonito" (1, 2, 5) más cercano por arriba
        // Potencia de 10 base
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const normalizedStep = rawStep / magnitude; // Estará entre 1 y 10

        let niceStep;
        if (normalizedStep <= 1) niceStep = 1;
        else if (normalizedStep <= 2) niceStep = 2;
        else if (normalizedStep <= 5) niceStep = 5;
        else niceStep = 10;

        let step = niceStep * magnitude;

        // ---------------------------------------------
        
        // Círculos (Radios)
        // Empezar desde 'step' para no dibujar muchos círculos pequeños si step es pequeño
        for (let r = step; r * this.scale < maxRadius; r += step) {
            const radiusPx = r * this.scale;
            
            this.gridLayer.add(new Konva.Circle({
                radius: radiusPx,
                stroke: '#e2e8f0', // Color de línea (slate-200)
                strokeWidth: 1,
            }));
            
            // Etiqueta del Radio
            // Solo dibujar si está dentro de un rango razonable visible, o siempre?
            // Siempre está bien, Konva maneja el clipping en rendering.
            this.gridLayer.add(new Konva.Text({
                x: radiusPx + 2, // Posición en el eje X
                y: 2,
                text: `${parseFloat(r.toPrecision(10))}`, // Evitar errores de float ej: 0.30000000004
                fill: '#94a3b8', // Text color (slate-400) más sutil
                fontSize: 10,
                fontFamily: 'Arial'
            }));
        }

        // Líneas Radiales (Ángulos)
        // También podemos ajustar el paso angular si se hiciera necesario, pero 30° suele estar bien.
        for (let angle = 0; angle < 360; angle += 30) {
            const angleRad = angle * Math.PI / 180;
            const endX = maxRadius * Math.cos(angleRad);
            const endY = maxRadius * Math.sin(angleRad);
            
            this.gridLayer.add(new Konva.Line({
                points: [0, 0, endX, -endY], 
                stroke: '#f1f5f9', // Color muy sutil (slate-100)
                strokeWidth: 1,
            }));
            
            // Etiqueta del Ángulo (Dibujadas un poco más lejos o fijas en el borde?)
            // En este diseño simple, las etiquetas se alejan con el radio...
            // O podemos dibujarlas en un radio fijo visible? 
            // El original las dibujaba al final de maxRadius, que es muy lejos si maxRadius es grande.
            // Mejor dibujarlas a una distancia constante de la vista? No, dejemos lógica similar pero ajustada.
            
            // Vamos a dibujar etiquetas de ángulos en cada círculo principal? No, muy cargado.
            // Dibujemos etiquetas de angulos a un radio fijo "visual" o simplemente al borde.
            // Por simplicidad mantengo la lógica de bordes pero con texto más legible.
            // Voy a ponerlas a un radio fijo relativo al "centro" por ahora, o dejarlas como estaban pero sutiles.
             
             this.gridLayer.add(new Konva.Text({
                x: endX * 0.9 + 5,
                y: -endY * 0.9 - 5,
                text: `${angle}°`,
                fill: '#94a3b8', // slate-400
                fontSize: 10,
            }));
        }

        this.gridLayer.draw();
        this.dataLayer.draw(); // Dibuja la capa de datos si hay algo
    }

    // --- LÓGICA DE INTERACTIVIDAD (PAN Y ZOOM) ---

    setupEventListeners() {
        // --- 1. Pan (Mover Libremente) ---
        let isDragging = false;
        let lastPos = { x: 0, y: 0 };
        
        this.stage.on('mousedown touchstart', (e) => {
            isDragging = true;
            const pos = this.stage.getPointerPosition();
            if (pos) {
                lastPos = pos;
            }
        });

        this.stage.on('mousemove touchmove', (e) => {
            // Prevent scrolling on touch devices while dragging on the canvas
            if (e.type === 'touchmove') {
                e.evt.preventDefault(); 
            }

            // Mostrar coordenadas del puntero
            this.updateCoordsDisplay();

            if (!isDragging) return;

            const pos = this.stage.getPointerPosition();
            if (!pos) return;

            const dx = pos.x - lastPos.x;
            const dy = pos.y - lastPos.y;

            // Mover las capas
            this.gridLayer.x(this.gridLayer.x() + dx);
            this.gridLayer.y(this.gridLayer.y() + dy);
            this.dataLayer.x(this.dataLayer.x() + dx);
            this.dataLayer.y(this.dataLayer.y() + dy);

            // Redibujar
            this.stage.batchDraw(); 
            
            lastPos = pos;
        });

        this.stage.on('mouseup touchend', () => {
            isDragging = false;
        });
        
        // --- 2. Zoom (Scroll) ---
        this.stage.on('wheel', (e) => {
            e.evt.preventDefault();
            
            const oldScale = this.scale;
            
            // Determinar el factor de zoom
            let newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
            
            // Aplicar límites de zoom
            if (newScale > this.maxScale) newScale = this.maxScale;
            if (newScale < this.minScale) newScale = this.minScale;
            
            // ZOOM CENTRADO EN EL ORIGEN (No mover x/y)
            // Simplemente actualizamos la escala. El centro de los círculos (0,0 de la capa) 
            // permanecerá en su posición actual en pantalla (definida por this.gridLayer.x/y).

            this.scale = newScale; // Actualizar la escala global

            this.redraw(); // Redibujar TODO (Grid + Data) con la nueva escala
        });
    }

    // --- CONVERSIÓN DE COORDENADAS Y DISPLAY ---

    // Convierte coordenadas de Pantalla (Píxeles) a Coordenadas Polares (r, theta)
    canvasToPolar() {
        // 1. Obtener la posición del puntero relativa al Stage
        const pointerPos = this.stage.getPointerPosition();
        if (!pointerPos) return { r: 0, theta: 0 };
        
        // 2. Obtener la posición relativa al Origen (0,0) del plano, compensando el Pan
        const x_canvas = pointerPos.x - this.gridLayer.x();
        const y_canvas = pointerPos.y - this.gridLayer.y(); // Nota: Y positivo es hacia abajo en Konva
        
        // 3. Convertir a Coordenadas Cartesianas Estándar (Y positivo hacia arriba)
        const x_cartesian = x_canvas / this.scale;
        const y_cartesian = -y_canvas / this.scale; 
        
        // 4. Convertir a Polares
        const r = Math.sqrt(x_cartesian * x_cartesian + y_cartesian * y_cartesian);
        // atan2(y, x) devuelve el ángulo en radianes entre [-PI, PI]
        let thetaRad = Math.atan2(y_cartesian, x_cartesian); 
        
        // 5. Convertir Radianes a Grados [0, 360)
        let thetaDeg = thetaRad * 180 / Math.PI;
        if (thetaDeg < 0) {
            thetaDeg += 360;
        }

        return { r: r, theta: thetaDeg };
    }

    updateCoordsDisplay() {
        const { r, theta } = this.canvasToPolar();
        this.coordsDisplay.innerHTML = `r: ${r.toFixed(3)}, &theta;: ${theta.toFixed(2)}°`;
    }

    // --- GRÁFICOS ESPECÍFICOS ---

    redraw() {
        // Redibujar cuadrícula
        this.drawGrid(); 
        
        // Redibujar datos persistidos si existen
        if (this.lastTrilaterationData) {
            this.drawTrilateration(...this.lastTrilaterationData);
        }
        if (this.lastVectorsData) {
            this.drawVectors(...this.lastVectorsData);
        }
    }

    /**
     * Dibuja el gráfico de trilateración (círculos intersectando).
     * @param {number} v0 - Radio de los círculos (Amplitud Original)
     * @param {Array} runs - Array de corridas [{r, theta, color}, ...] que actuan como CENTROS
     * @param {Object} solution - Punto de solución {x, y, r, theta}
     */
    /**
     * Dibuja el gráfico de trilateración (círculos intersectando).
     * Ajusta el zoom (scale) para mostrar un radio determinado dentro de la vista.
     * @param {number} maxRadius - Radio máximo que debe ser visible.
     */
    fitToRadius(maxRadius) {
        if (!maxRadius || maxRadius <= 0) return;

        // Dimensiones del contenedor
        const w = this.stage.width();
        const h = this.stage.height();
        
        // El menor lado define la restricción (para mantener ratio 1:1)
        const minDimension = Math.min(w, h);
        
        // Queremos que maxRadius ocupe, digamos, el 45% del ancho/alto (dejando 10% margen total)
        // radio en pixeles = maxRadius * scale
        // radio en pixeles = minDimension / 2 * 0.9
        // maxRadius * scale = minDimension * 0.45
        
        const targetScale = (minDimension * 0.45) / maxRadius;
        
        // Aplicar nuevo scale
        this.scale = targetScale;
        
        // Opcional: Centrar vista (si se hubiera movido)
        this.gridLayer.x(w / 2);
        this.gridLayer.y(h / 2);
        this.dataLayer.x(w / 2);
        this.dataLayer.y(h / 2);
        
        // Redibujar grid con nueva escala (los datos se dibujarán a continuación)
        this.drawGrid();
    }

    /**
     * Dibuja el gráfico de trilateración (círculos intersectando).
     * @param {number} v0 - Radio de los círculos (Amplitud Original)
     * @param {Array} runs - Array de corridas [{r, theta, color}, ...] que actuan como CENTROS
     * @param {Object} solution - Punto de solución {x, y, r, theta}
     * @param {boolean} autoFit - Si es true, ajusta el zoom automáticamente.
     */
    drawTrilateration(v0, runs, solution, autoFit = false) {
        // Guardar estado para redibujado (Zoom/Resize)
        // NOTA: No guardamos autoFit, para que redraw() (zoom manual) no resetee la vista.
        this.lastTrilaterationData = [v0, runs, solution];

        // AUTO-FIT
        if (autoFit) {
            // Calcular extensión máxima
            // Extensión = V0 (distancia al centro) + Vi (radio del círculo)
            let maxR = 0;
            runs.forEach(run => {
                const extent = v0 + run.r;
                if (extent > maxR) maxR = extent;
            });
            // Considerar también P* si existe
            if (solution && solution.r > maxR) {
                maxR = solution.r;
            }
            
            // Si v0 es muy grande y runs pequeños, al menos mostrar v0
            if (v0 > maxR) maxR = v0;

            this.fitToRadius(maxR);
        }

        this.dataLayer.destroyChildren(); // Limpiar gráfico anterior

        // 0. Dibujar Círculo Base (Amplitud Inicial)
        // Centro (0,0), Radio V0
        const radiusVal = v0 * this.scale;
        
        // Círculo Base Azul
        this.dataLayer.add(new Konva.Circle({
            x: 0,
            y: 0,
            radius: radiusVal,
            stroke: '#3b82f6', // blue-500
            strokeWidth: 2,
            opacity: 0.5,
            dash: [10, 5]
        }));

        // Etiqueta Base
        this.dataLayer.add(new Konva.Text({
            x: radiusVal + 5,
            y: 5,
            text: `Base r=${v0}`,
            fill: '#3b82f6',
            fontSize: 10
        }));

        // 1. Dibujar Círculos de Corridas
        runs.forEach(run => {
            const rad = run.theta * Math.PI / 180;
            const cx_cart = v0 * Math.cos(rad);
            const cy_cart = v0 * Math.sin(rad);

            const cx_canvas = cx_cart * this.scale;
            const cy_canvas = -cy_cart * this.scale;

            const radius_canvas = run.r * this.scale; // Radio is Vi

            // Círculo
            this.dataLayer.add(new Konva.Circle({
                x: cx_canvas,
                y: cy_canvas,
                radius: radius_canvas,
                stroke: run.color,
                strokeWidth: 2,
                opacity: 0.8
            }));

            // Centro
            this.dataLayer.add(new Konva.Circle({
                x: cx_canvas,
                y: cy_canvas,
                radius: 4,
                fill: run.color
            }));
            
            // Etiqueta Centro
            this.dataLayer.add(new Konva.Text({
                x: cx_canvas + 8,
                y: cy_canvas - 8,
                text: `${run.color === '#22c55e' ? 'C1' : run.color === '#a855f7' ? 'C2' : 'C3'} (${v0}, ${run.theta}°)`,
                fill: '#64748b', // slate-500
                fontSize: 10,
                fontFamily: 'monospace'
            }));
        });

        // 2. Dibujar Punto de Solución (P*)
        if (solution) {
            const px_canvas = solution.x * this.scale;
            const py_canvas = -solution.y * this.scale;

            // Linea de referencia
            this.dataLayer.add(new Konva.Line({
                points: [0, 0, px_canvas, py_canvas],
                stroke: '#1e293b',
                strokeWidth: 1,
                dash: [4, 4]
            }));

            // Punto
            this.dataLayer.add(new Konva.Circle({
                x: px_canvas,
                y: py_canvas,
                radius: 5,
                fill: '#ffffff',
                stroke: '#1e293b', // slate-800
                strokeWidth: 2
            }));

            // Etiqueta P* High Contrast
            const label = new Konva.Label({
                x: px_canvas + 8,
                y: py_canvas - 8,
                opacity: 0.9
            });
            
            label.add(new Konva.Tag({
                fill: 'white',
                cornerRadius: 2,
                stroke: '#cbd5e1',
                strokeWidth: 1
            }));
            
            label.add(new Konva.Text({
                text: `P* r=${solution.r.toFixed(3)}`,
                fontFamily: 'Arial',
                fontSize: 11,
                padding: 4,
                fill: 'black',
                fontStyle: 'bold'
            }));

            this.dataLayer.add(label);
        }

        this.dataLayer.draw();
    }

    /**
     * Resetea la vista para ajustar todo el contenido (Auto-Fit).
     * Usa los últimos datos dibujados.
     */
    fitContent() {
        if (this.lastTrilaterationData) {
            this.drawTrilateration(...this.lastTrilaterationData, true);
        } else if (this.lastVectorsData) {
            this.drawVectors(...this.lastVectorsData, true);
        }
    }

    /**
     * Dibuja vectores desde el origen con etiquetas de coordenadas.
     * @param {Array} runs - Array de vectores de corrida 
     * @param {Object} resultant - Vector resultante
     * @param {Object} opposite - Vector opuesto
     * @param {boolean} autoFit - Auto scalling
     */
    drawVectors(runs, resultant, opposite, autoFit = false) {
        // Guardar estado
        this.lastVectorsData = [runs, resultant, opposite];
        
        // AUTO-FIT
        if (autoFit) {
            // Max extent de vectores
            let maxR = 0;
            runs.forEach(v => { if (v.r > maxR) maxR = v.r; });
            if (resultant && resultant.r > maxR) maxR = resultant.r;
            if (opposite && opposite.r > maxR) maxR = opposite.r;

            this.fitToRadius(maxR);
        }

        this.dataLayer.destroyChildren();

        // Helper
        const drawArrow = (r, theta, color, width = 2, dash = [], prefix='') => {
            const rad = theta * Math.PI / 180;
            const x_cart = r * Math.cos(rad);
            const y_cart = r * Math.sin(rad);

            const x_canvas = x_cart * this.scale;
            const y_canvas = -y_cart * this.scale;

            // Flecha
            this.dataLayer.add(new Konva.Arrow({
                points: [0, 0, x_canvas, y_canvas],
                pointerLength: 10,
                pointerWidth: 10,
                fill: color,
                stroke: color,
                strokeWidth: width,
                dash: dash
            }));

            // Etiqueta Coordenadas
            const label = new Konva.Label({
                x: x_canvas,
                y: y_canvas,
                opacity: 0.85
            });

            label.add(new Konva.Tag({
                fill: 'white',
                stroke: color,
                strokeWidth: 1,
                cornerRadius: 3
            }));

            label.add(new Konva.Text({
                text: `${prefix}(${r.toFixed(2)}, ${theta.toFixed(1)}°)`,
                fontFamily: 'Arial',
                fontSize: 10,
                padding: 3,
                fill: 'black'
            }));

            this.dataLayer.add(label);
        };

        // 1. Vectores de corrida
        runs.forEach((run, i) => {
            const name = run.color === '#22c55e' ? 'V1' : run.color === '#a855f7' ? 'V2' : 'V3';
            drawArrow(run.r, run.theta, run.color, 2, [], name);
        });

        // 2. Resultante
        if (resultant) {
            drawArrow(resultant.r, resultant.theta, '#ef4444', 3, [], 'Res');
        }

        // 3. Opuesto
        if (opposite) {
             const rad = opposite.theta * Math.PI / 180;
             const x = (opposite.r * this.scale) * Math.cos(rad);
             const y = -(opposite.r * this.scale) * Math.sin(rad);
             
             // Flecha
             this.dataLayer.add(new Konva.Arrow({
                points: [0, 0, x, y],
                pointerLength: 12,
                pointerWidth: 12,
                fill: '#94a3b8',
                stroke: '#475569',
                strokeWidth: 2,
                dash: [5, 2]
            }));

            // Etiqueta Opuesto
            const label = new Konva.Label({
                x: x,
                y: y,
                opacity: 0.9
            });
            label.add(new Konva.Tag({ fill: '#f1f5f9', stroke: '#475569', strokeWidth: 1, cornerRadius: 2 }));
            label.add(new Konva.Text({
                 text: `Opuesto (${opposite.r.toFixed(2)}, ${opposite.theta.toFixed(1)}°)`,
                 fontSize: 10, padding: 3, fill: '#334155'
            }));
            this.dataLayer.add(label);
        }

        this.dataLayer.draw();
    }
}
