export default class BalancingMath {

    // --- A. Utilidades Internas ---

    static degToRad(deg) {
        return deg * Math.PI / 180;
    }

    static radToDeg(rad) {
        return rad * 180 / Math.PI;
    }

    static normalizeAngle(deg) {
        let d = deg % 360;
        if (d < 0) d += 360;
        return d;
    }

    /**
     * Solves the intersection of 3 circles using linear system solution.
     * Method A (User Spec): Centers at (V0, angle_i), Radius Vi.
     * @param {number} v0 - Initial amplitude (Radius for Center placement)
     * @param {Array} runs - Array of run objects [{ r: number, theta: number }]
     * @returns {Object} { r, theta, x, y, rmsError }
     */
    static solveIntersection(v0, runs) {
        // 1. Definir Centros y Radios según especificación
        // Centro (cx, cy) = (V0 * cos(theta), V0 * sin(theta))
        // Radio (ri) = run.amplitude
        
        const circles = runs.map(run => {
            const rad = this.degToRad(run.theta);
            return {
                cx: v0 * Math.cos(rad),
                cy: v0 * Math.sin(rad),
                ri: run.r
            };
        });

        const [c1, c2, c3] = circles;

        // 3. Resolver Sistema Lineal
        // Se buscan la intersección de las "líneas radicales" de los pares de círculos.
        // Ecuación general: 2x(Cx1 - Cx2) + 2y(Cy1 - Cy2) = (r2^2 - r1^2) + (Cx1^2 - Cx2^2) + (Cy1^2 - Cy2^2)
        
        // Coeficientes para par 1-2
        const A1 = 2 * (c1.cx - c2.cx);
        const B1 = 2 * (c1.cy - c2.cy);
        const Val1 = (c2.ri ** 2 - c1.ri ** 2) + (c1.cx ** 2 - c2.cx ** 2) + (c1.cy ** 2 - c2.cy ** 2);

        // Coeficientes para par 1-3
        const A2 = 2 * (c1.cx - c3.cx);
        const B2 = 2 * (c1.cy - c3.cy);
        const Val2 = (c3.ri ** 2 - c1.ri ** 2) + (c1.cx ** 2 - c3.cx ** 2) + (c1.cy ** 2 - c3.cy ** 2);

        // Determinante
        const D = A1 * B2 - A2 * B1;

        if (Math.abs(D) < 1e-9) {
            console.error("Sistema degenerado: Círculos colineales o concéntricos.");
            return { x: 0, y: 0, r: 0, theta: 0, error: 0 };
        }

        // Solución P(x, y)
        const Px = (Val1 * B2 - Val2 * B1) / D;
        const Py = (A1 * Val2 - A2 * Val1) / D;

        // Magnitud y Fase Estimada
        const r_est = Math.sqrt(Px * Px + Py * Py);
        const theta_est = this.normalizeAngle(this.radToDeg(Math.atan2(Py, Px)));

        // 6. Cálculo Error RMS
        // RMS = sqrt( sum((dist(P, Ci) - ri)^2) / 3 )
        let sumSqError = 0;
        circles.forEach(c => {
            const dist = Math.sqrt((Px - c.cx) ** 2 + (Py - c.cy) ** 2);
            const err = dist - c.ri;
            sumSqError += err * err;
        });
        const rmsError = Math.sqrt(sumSqError / 3);

        return {
            x: Px,
            y: Py,
            r: r_est,
            theta: theta_est,
            error: rmsError
        };
    }

    /**
     * Calculates vectors for the vector diagram.
     * @param {Array} runs 
     */
    static calculateVectors(runs) {
        let sumX = 0;
        let sumY = 0;

        runs.forEach(run => {
            const rad = this.degToRad(run.theta);
            sumX += run.r * Math.cos(rad);
            sumY += run.r * Math.sin(rad);
        });

        const r_res = Math.sqrt(sumX * sumX + sumY * sumY);
        const theta_res = this.normalizeAngle(this.radToDeg(Math.atan2(sumY, sumX)));

        // Opposite (+180 deg)
        const theta_opp = this.normalizeAngle(theta_res + 180);

        return {
            resultant: { r: r_res, theta: theta_res },
            opposite: { r: r_res, theta: theta_opp }
        };
    }
}
