import app from "./app";
import { writeFileSync } from "fs";
const port = 8080;

const listEndpoints = require("express-list-endpoints"); // npm i express-list-endpoints
let listaDeRutas = listEndpoints(app);

writeFileSync("./routes.json", JSON.stringify(listaDeRutas));

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
