import express, { Router, Request, Response } from "express";
import {
    Carrera,
    Equipo,
    Materia,
    Observacion,
    PrismaClient,
    Rol,
    Usuario,
} from "@prisma/client";
import handleError from "../handle-errors";
import validarAcceso from "../controllers/validarAcceso";
import validarAccesoAdministrador from "../controllers/validarAccesoAdmin";

const routerObservaciones: Router = express.Router();
const prisma = new PrismaClient();

routerObservaciones.get(
    "/equipos/:numeroInventario/observaciones/",
    validarAcceso,
    async (req: Request, res: Response) => {
        const { numeroInventario } = req.params;
        const usuario: Usuario = req.usuario;
        try {
            const observaciones: Observacion[] =
                await prisma.observacion.findMany({
                    where: {
                        equipoId: numeroInventario,
                    },
                });
            const hizoComentario: Boolean =
                observaciones.find((observacion) => {
                    observacion.autorId == usuario.matricula;
                }) != undefined;

            if (!hizoComentario) {
                res.status(401).send({
                    error: `Para poder ver la lista de observaciones del equipo ${numeroInventario} debes hacer primero una observación.`,
                    code: "R1001",
                });
                return;
            }

            res.json(observaciones);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerObservaciones.get(
    "/observaciones/",
    validarAccesoAdministrador,
    async (req: Request, res: Response) => {
        try {
            const observaciones: Observacion[] =
                await prisma.observacion.findMany();
            res.json(observaciones);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerObservaciones.get(
    "/observaciones/:id/",
    async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            const observacion: Observacion | null =
                await prisma.observacion.findUnique({
                    where: {
                        id,
                    },
                });
            if (observacion == null) {
                res.status(404).send({
                    error: `Observación con id ${id} no encontrada.`,
                    code: "R1001",
                });
                return;
            }
            res.json(observacion);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerObservaciones.post(
    "/equipos/:numeroInventario/observaciones/",
    validarAcceso,
    async (req: Request, res: Response) => {
        const nuevaObservacion: Observacion = req.body;
        const usuario: Usuario = req.usuario;
        const { numeroInventario } = req.params;
        const ip = (req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress!);
        
        if (!nuevaObservacion.contenido) {
            res.status(500).json({
                error: "El campo nombre no puede estar vacío.",
                code: "P1001",
            });
            return;
        }
        
        if (nuevaObservacion.contenido == "") {
            res.status(500).json({
                error: "El campo nombre no puede estar vacío.",
                code: "P1001",
            });
            return;
        }
        
        try {
            const observacionCreada: Observacion =
                await prisma.observacion.create({
                    data: {
                        autorIp: ip,
                        contenido: nuevaObservacion.contenido,
                        autor: {
                            connect: {
                                matricula: usuario.matricula,
                            },
                        },
                        equipo: {
                            connect: {
                                numeroInventario: numeroInventario,
                            },
                        },
                    },
                });
            res.json(observacionCreada);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerObservaciones.delete(
    "/observaciones/:id",
    validarAccesoAdministrador,
    async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            const observacionBorrada: Observacion = await prisma.observacion.delete({
                where: {
                    id,
                },
            });
            res.json(observacionBorrada);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerObservaciones.put(
    "/observaciones/:id",
    validarAccesoAdministrador,
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const nuevaObservacion: Observacion = req.body;

        if (nuevaObservacion.contenido == "") {
            res.json({
                error: "El campo contenido no puede estar vacío.",
                code: "P1001",
            });
            return;
        }

        nuevaObservacion.id = id;

        try {
            const observacionActualizada: Observacion = await prisma.observacion.update({
                where: {
                    id,
                },
                data: nuevaObservacion,
            });
            res.json(observacionActualizada);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

export default routerObservaciones;
