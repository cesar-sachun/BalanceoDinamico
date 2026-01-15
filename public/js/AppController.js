import BalancingMath from './BalancingMath.js';

export default class AppController {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        const btnDraw = document.getElementById('btn-draw');
        if (btnDraw) {
            btnDraw.addEventListener('click', () => this.calculateAndDraw());
        }

        const btnHome = document.getElementById('btn-home');
        if (btnHome) {
            btnHome.addEventListener('click', () => {
                if (window.trilaterationGraph) window.trilaterationGraph.fitContent();
                if (window.vectorsGraph) window.vectorsGraph.fitContent();
            });
        }
    }

    getInputs() {
        // Helper to get float value
        const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;

        return {
            v0: getVal('init-amp'),
            testMass: getVal('test-mass'),
            runs: [
                { r: getVal('t1-amp'), theta: getVal('t1-phase'), color: '#22c55e' }, // Green
                { r: getVal('t2-amp'), theta: getVal('t2-phase'), color: '#a855f7' }, // Purple
                { r: getVal('t3-amp'), theta: getVal('t3-phase'), color: '#eab308' }  // Yellow
            ]
        };
    }

    calculateAndDraw() {
        const inputs = this.getInputs();

        // 1. Calculate Solution (Trilateration)
        const solution = BalancingMath.solveIntersection(inputs.v0, inputs.runs);
        
        // 2. Calculate Vectors (Vector Sum)
        const vectors = BalancingMath.calculateVectors(inputs.runs);

        // 3. Update Results UI
        this.updateResultsUI(solution, vectors);
        this.updateLegends(inputs, solution, vectors);

        // 4. Draw Graphs
        if (window.trilaterationGraph) {
            window.trilaterationGraph.drawTrilateration(inputs.v0, inputs.runs, solution, true);
        }
        if (window.vectorsGraph) {
            window.vectorsGraph.drawVectors(inputs.runs, vectors.resultant, vectors.opposite, true);
        }
    }

    updateResultsUI(solution, vectors) {
        // Sidebar Elements
        const sbMag = document.getElementById('res-mag');
        const sbPhase = document.getElementById('res-phase');
        const sbError = document.getElementById('res-error');

        // Graph Card Elements
        const graphMag = document.getElementById('graph-res-mag');
        const graphPhase = document.getElementById('graph-res-phase');

        // Format Values
        const magVal = solution.r.toFixed(3);
        const phaseVal = solution.theta.toFixed(1) + '°';
        const errorVal = solution.error.toExponential(2);

        // Update Sidebar
        if (sbMag) sbMag.textContent = magVal;
        if (sbPhase) sbPhase.textContent = phaseVal;
        if (sbError) sbError.textContent = errorVal;

        // Update Graph Card
        if (graphMag) graphMag.textContent = magVal;
        if (graphPhase) graphPhase.textContent = phaseVal;

        // Vector Graph Elements
        const vecResMag = document.getElementById('res-vectors-mag');
        const vecResPhase = document.getElementById('res-vectors-phase');
        const vecOppMag = document.getElementById('opp-vectors-mag');
        const vecOppPhase = document.getElementById('opp-vectors-phase');

        if (vectors.resultant) {
            if (vecResMag) vecResMag.textContent = vectors.resultant.r.toFixed(3);
            if (vecResPhase) vecResPhase.textContent = vectors.resultant.theta.toFixed(1) + '°';
        }
        if (vectors.opposite) {
            if (vecOppMag) vecOppMag.textContent = vectors.opposite.r.toFixed(3);
            if (vecOppPhase) vecOppPhase.textContent = vectors.opposite.theta.toFixed(1) + '°';
        }
    }

    updateLegends(inputs, solution, vectors) {
        // --- Leyenda Trilateración ---
        const legendTri = document.getElementById('legend-trilateration');
        if (legendTri) {
            let html = `
                <div class="flex items-center gap-2 mb-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span> <span class="text-gray-600 font-medium">Base: ${inputs.v0.toFixed(2)}</span></div>
            `;
            
            inputs.runs.forEach((run, i) => {
                const colorClass = i === 0 ? 'bg-green-500' : i === 1 ? 'bg-purple-500' : 'bg-yellow-500';
                const name = `C${i+1}`;
                html += `<div class="flex items-center gap-2 mb-1"><span class="w-2 h-2 rounded-full ${colorClass}"></span> <span class="text-gray-600 font-medium">${name} (${run.theta}°): r=${run.r.toFixed(2)}</span></div>`;
            });

            if (solution) {
                html += `<div class="flex items-center gap-2"><span class="w-2 h-2 rounded-sm bg-white border border-gray-800"></span> <span class="text-gray-800 font-bold">P*: r=${solution.r.toFixed(3)}, &theta;=${solution.theta.toFixed(1)}°</span></div>`;
            }
            
            legendTri.innerHTML = html;
        }

        // --- Leyenda Vectores ---
        const legendVec = document.getElementById('legend-vectors');
        if (legendVec) {
            let html = '';
            
            inputs.runs.forEach((run, i) => {
                const colorClass = i === 0 ? 'bg-green-500' : i === 1 ? 'bg-purple-500' : 'bg-yellow-500';
                const name = `V${i+1}`;
                html += `<div class="flex items-center gap-2 mb-1"><span class="w-2 h-2 rounded-sm ${colorClass}"></span> <span class="text-gray-600 font-medium">${name} (${run.theta}°): r=${run.r.toFixed(2)}</span></div>`;
            });

            if (vectors.resultant) {
                html += `<div class="flex items-center gap-2 mb-1"><span class="w-2 h-2 rounded-sm bg-red-500"></span> <span class="text-gray-600 font-bold">Res: r=${vectors.resultant.r.toFixed(2)}, &theta;=${vectors.resultant.theta.toFixed(1)}°</span></div>`;
            }

            if (vectors.opposite) {
                html += `<div class="flex items-center gap-2"><span class="w-2 h-2 rounded-sm bg-gray-200 border border-gray-400"></span> <span class="text-gray-800 font-bold">Opuesto: r=${vectors.opposite.r.toFixed(2)}, &theta;=${vectors.opposite.theta.toFixed(1)}°</span></div>`;
            }
            
            legendVec.innerHTML = html;
        }
    }
}

// Initialize
new AppController();
