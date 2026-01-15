import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.render("pages/index", { pageTitle: "Calculadora de Balanceo" });
});

export default router;