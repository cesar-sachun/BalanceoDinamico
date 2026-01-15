import express from "express";
import expressLayouts from "express-ejs-layouts";
import routes from "./routes/main.routes.js";


const app = express();
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set('layout', "layouts/main.ejs");

app.use(express.json());
app.use(express.static("public"));

app.use("/", routes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});