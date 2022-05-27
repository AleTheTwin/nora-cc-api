import express, { Router, Request, Response } from "express";
import { Equipo, PrismaClient } from "@prisma/client";
import handleError from "../handle-errors";
import validarAccesoAdministrador from "../controllers/validarAccesoAdmin";

const routerEquipos: Router = express.Router();
const prisma = new PrismaClient();

routerEquipos.get("/", async (req: Request, res: Response) => {
    try {
        const equipos: Equipo[] = await prisma.equipo.findMany();
        res.json(equipos);
    } catch (error: any) {
        handleError(error as Error, res);
    }
});

routerEquipos.get(
    "/:numeroInventario/",
    async (req: Request, res: Response) => {
        const { numeroInventario } = req.params;

        try {
            const equipo: Equipo | null = await prisma.equipo.findUnique({
                where: {
                    numeroInventario,
                },
            });
            if (equipo == null) {
                res.status(404).send({
                    error: `Equipo con número de inventario ${numeroInventario} no encontrado.`,
                    code: "R1001",
                });
                return;
            }
            res.json(equipo);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerEquipos.post(
    "/",
    validarAccesoAdministrador,
    async (req: Request, res: Response) => {
        const nuevoEquipo: Equipo = req.body;

        if (nuevoEquipo.nombre == "") {
            res.json({
                error: "El campo nombre no puede estar vacío.",
                code: "P1001",
            });
            return;
        }
        try {
            const equipoCreado: Equipo = await prisma.equipo.create({
                data: nuevoEquipo,
            });
            res.json(equipoCreado);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerEquipos.delete(
    "/:numeroInventario/",
    validarAccesoAdministrador,
    async (req: Request, res: Response) => {
        const { numeroInventario } = req.params;

        try {
            const equipoBorrado: Equipo = await prisma.equipo.delete({
                where: {
                    numeroInventario,
                },
            });
            res.json(equipoBorrado);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerEquipos.put(
    "/:numeroInventario/",
    validarAccesoAdministrador,
    async (req: Request, res: Response) => {
        const { numeroInventario } = req.params;
        const nuevoEquipo: Equipo = req.body;

        if (nuevoEquipo.nombre == "") {
            res.json({
                error: "El campo nombre no puede estar vacío.",
                code: "P1001",
            });
            return;
        }

        nuevoEquipo.numeroInventario = numeroInventario;

        try {
            const equipoActualizado: Equipo = await prisma.equipo.update({
                where: {
                    numeroInventario,
                },
                data: nuevoEquipo,
            });
            res.json(equipoActualizado);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

export default routerEquipos;
