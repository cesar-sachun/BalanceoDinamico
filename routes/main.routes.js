import express from "express";
import BalancingMath from "../utils/BalancingMath.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.render("pages/index", { pageTitle: "Calculadora de Balanceo" });
});

router.post("/calculate", (req, res) => {
   const { v0, runs } = req.body;
   const solution = BalancingMath.solveIntersection(v0, runs);
   const vectors = BalancingMath.calculateVectors(runs);
   res.json({ solution, vectors });
});

export default router;