import { Usuario } from "@prisma/client";
import express, { Express, Request, Response } from "express";
import handleError from "./handle-errors";
import passwordVerify from "./controllers/passwordVerify";
import createToken from "./controllers/createToken";
import { PrismaClient } from "@prisma/client";

import routerUsuarios from "./routers/routerUsuarios";
import routerEquipos from "./routers/routerEquipos";
import routerMaterias from "./routers/routerMaterias";
import routerObservaciones from "./routers/routerObservaciones";
import routerSolicitudes from "./routers/routerSolicitudes";

const app: Express = express();
const prisma = new PrismaClient();

app.use(express.json());

app.use("/api/v1/usuarios/", routerUsuarios);
app.use("/api/v1/equipos/", routerEquipos);
app.use("/api/v1/", routerObservaciones);
app.use("/api/v1/", routerSolicitudes);
app.use("/api/v1/materias/", routerMaterias);

app.post("/api/v1/login/", async (req: Request, res: Response) => {
    const { matricula, password } = req.body;

    if (!matricula || !password) {
        res.status(500).json({
            error: "Parámetros incompletos",
            code: "P0000",
        });
        return;
    }

    try {
        const usuario: Usuario | null = await prisma.usuario.findUnique({
            where: {
                matricula,
            },
        });
        if (
            usuario == null ||
            !(await passwordVerify(password, usuario.password))
        ) {
            res.status(500).json({
                error: "Credenciales incorrectas",
                code: "C1001",
            });
            return;
        }
        res.json({
            nombre: usuario.nombre,
            matricula: usuario.matricula,
            rol: usuario.rol,
            carrera: usuario.carrera,
            token: await createToken(usuario),
        });
    } catch (error: any) {
        handleError(error as Error, res);
    }
});

app.get("/", (req: Request, res: Response) => {
    res.json({
        mensaje: "Nora Computers api",
    });
});

export default app;
