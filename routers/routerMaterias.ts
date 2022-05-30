import express, { Router, Request, Response } from "express";
import { Equipo, Materia, PrismaClient } from "@prisma/client";
import handleError from "../handle-errors";
import validarAccesoAdministrador from "../controllers/validarAccesoAdmin";

const routerMaterias: Router = express.Router();
const prisma = new PrismaClient();

routerMaterias.get(
    "/",
    validarAccesoAdministrador,
    async (req: Request, res: Response) => {
        try {
            const materias: Equipo[] = await prisma.equipo.findMany();
            res.json(materias);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerMaterias.get("/:nrc/", async (req: Request, res: Response) => {
    const { nrc } = req.params;

    try {
        const materia: Materia | null = await prisma.materia.findUnique({
            where: {
                nrc,
            },
        });
        if (materia == null) {
            res.status(404).send({
                error: `Materia con nrc ${nrc} no encontrada.`,
                code: "R1001",
            });
            return;
        }
        res.json(materia);
    } catch (error: any) {
        handleError(error as Error, res);
    }
});

routerMaterias.post(
    "/",
    validarAccesoAdministrador,
    async (req: Request, res: Response) => {
        const nuevaMateria: Materia = req.body;

        if (!nuevaMateria.nombre) {
            res.status(500).json({
                error: "El campo nombre no puede estar vacío.",
                code: "P1001",
            });
            return;
        }

        if (nuevaMateria.nombre == "") {
            res.status(500).json({
                error: "El campo nombre no puede estar vacío.",
                code: "P1001",
            });
            return;
        }
        try {
            const materiaCreada: Materia = await prisma.materia.create({
                data: nuevaMateria,
            });
            res.json(materiaCreada);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerMaterias.delete(
    "/:nrc/",
    validarAccesoAdministrador,
    async (req: Request, res: Response) => {
        const { nrc } = req.params;

        try {
            const materiaBorrada: Materia = await prisma.materia.delete({
                where: {
                    nrc,
                },
            });
            res.json(materiaBorrada);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerMaterias.put(
    "/:nrc/",
    validarAccesoAdministrador,
    async (req: Request, res: Response) => {
        const { nrc } = req.params;
        const nuevaMateria: Materia = req.body;

        if (!nuevaMateria.nombre) {
            res.status(500).json({
                error: "El campo nombre no puede estar vacío.",
                code: "P1001",
            });
            return;
        }

        if (nuevaMateria.nombre == "") {
            res.json({
                error: "El campo nombre no puede estar vacío.",
                code: "P1001",
            });
            return;
        }

        nuevaMateria.nrc = nrc;

        try {
            const materiaActualizada: Materia = await prisma.materia.update({
                where: {
                    nrc,
                },
                data: nuevaMateria,
            });
            res.json(materiaActualizada);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

export default routerMaterias;
