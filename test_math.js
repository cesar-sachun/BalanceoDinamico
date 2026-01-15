
function solveIntersection(v0, v1, v2, v3) {
    // Method B: Centers at (Vi, angle_i), Radius V0
    // C1: (v1, 0), R=v0
    // C2: (v2, 120), R=v0
    // C3: (v3, 240), R=v0
    
    const centers = [
        { r: v1, theta: 0 },
        { r: v2, theta: 120 },
        { r: v3, theta: 240 }
    ];
    const radius = v0;

    // Convert to cartesian
    const circles = centers.map(c => {
        const rad = c.theta * Math.PI / 180;
        return {
            x: c.r * Math.cos(rad),
            y: c.r * Math.sin(rad),
            r: radius
        };
    });

    // Find point P(x,y) minimizing sum((dist(P, Ci) - Ri)^2)
    // Or just average intersection?
    // Since we have 3 circles, we can find intersection of pairs.
    // Pair 1-2, 2-3, 3-1.
    // Ideally they intersect at one point or close to it.
    
    // Gradient descent or simple grid search for demo? 
    // Let's use simple iterative solver to minimize error.
    
    let x = 0, y = 0;
    const lr = 0.01;
    for(let i=0; i<10000; i++) {
        let gradX = 0, gradY = 0;
        let totalError = 0;
        for(const c of circles) {
            const dist = Math.sqrt((x - c.x)**2 + (y - c.y)**2);
            const error = dist - c.r; // We want dist = radius
            totalError += error * error;
            // Derivative of (dist - R)^2 relative to x:
            // 2 * (dist - R) * (1/2dist) * 2(x - cx) = 2 * (dist - R) * (x - cx) / dist
            if(dist > 0.0001) {
                gradX += 2 * error * (x - c.x) / dist;
                gradY += 2 * error * (y - c.y) / dist;
            }
        }
        x -= lr * gradX;
        y -= lr * gradY;
        if(Math.sqrt(gradX**2 + gradY**2) < 0.00001) break;
    }
    
    const r_sol = Math.sqrt(x*x + y*y);
    const theta_sol = Math.atan2(y, x) * 180 / Math.PI;
    const theta_pos = theta_sol >= 0 ? theta_sol : theta_sol + 360;
    
    return { r: r_sol, theta: theta_pos, x, y };
}

function solveIntersectionMethodA(v0, v1, v2, v3) {
    // Method A: Centers at (V0, angle_i), Radius Vi
    const centers = [
        { r: v0, theta: 0, rad: v1 },
        { r: v0, theta: 120, rad: v2 },
        { r: v0, theta: 240, rad: v3 }
    ];
    
    // ... optimization code ...
     let x = 0, y = 0;
    const lr = 0.01;
    for(let i=0; i<10000; i++) {
        let gradX = 0, gradY = 0;
        for(const c of centers) {
            const rad = c.theta * Math.PI / 180;
            const cx = c.r * Math.cos(rad);
            const cy = c.r * Math.sin(rad);
            const targetR = c.rad;
            
            const dist = Math.sqrt((x - cx)**2 + (y - cy)**2);
            const error = dist - targetR; 
            if(dist > 0.0001) {
                gradX += 2 * error * (x - cx) / dist;
                gradY += 2 * error * (y - cy) / dist;
            }
        }
        x -= lr * gradX;
        y -= lr * gradY;
        if(Math.sqrt(gradX**2 + gradY**2) < 0.00001) break;
    }
     const r_sol = Math.sqrt(x*x + y*y);
    const theta_sol = Math.atan2(y, x) * 180 / Math.PI;
    const theta_pos = theta_sol >= 0 ? theta_sol : theta_sol + 360;
    return { r: r_sol, theta: theta_pos };
}

console.log("Run Calculation Check:");
console.log("Inputs: V0=7, V1=4, V2=3.5, V3=5");

const resB = solveIntersection(7, 4, 3.5, 5);
console.log(`Method B (Center=Vi, Radius=V0) Result: r=${resB.r.toFixed(3)}, theta=${resB.theta.toFixed(1)}`);

const resA = solveIntersectionMethodA(7, 4, 3.5, 5);
console.log(`Method A (Center=V0, Radius=Vi) Result: r=${resA.r.toFixed(3)}, theta=${resA.theta.toFixed(1)}`);
