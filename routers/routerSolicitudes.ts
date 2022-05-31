import express, { Router, Request, Response } from "express";
import moment from "moment";
import {
    Materia,
    Observacion,
    Solicitud,
    PrismaClient,
    Rol,
    Usuario,
    Equipo,
} from "@prisma/client";
import handleError from "../handle-errors";
import validarAcceso from "../controllers/validarAcceso";
import validarAccesoAdministrador from "../controllers/validarAccesoAdmin";
import validarAccesoProfesor from "../controllers/validarAccesoProfesor";
import validarAccesoAlumno from "../controllers/validarAccesoAlumno";

const routerSolicitudes: Router = express.Router();
const prisma = new PrismaClient();

routerSolicitudes.get(
    "/solicitudes/:id/",
    validarAccesoProfesor,
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const usuario: Usuario = req.usuario;
        try {
            var solicitud: Solicitud | null = await prisma.solicitud.findFirst({
                where: {
                    id,
                },
            });
            if (solicitud == null) {
                res.status(404).send({
                    error: `Solicitud con id ${id} no encontrada.`,
                    code: "R1001",
                });
                return;
            }
            if (usuario.rol == Rol.profesor) {
                const materias: Materia[] = await prisma.materia.findMany({
                    where: {
                        profesorId: usuario.matricula,
                    },
                });
                let materiaInSolicitud =
                    materias.find((materia) => {
                        return materia.nrc == solicitud?.materiaNRC;
                    }) != undefined;
                if (!materiaInSolicitud) {
                    res.status(401).send({
                        error: "No tienes acceso a este recurso",
                        code: "T1003",
                    });
                    return;
                }
            }
            res.json(solicitud);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerSolicitudes.get(
    "/solicitudes/",
    validarAccesoProfesor,
    async (req: Request, res: Response) => {
        const usuario: Usuario = req.usuario;
        try {
            var solicitudes: Solicitud[] = await prisma.solicitud.findMany({
                orderBy: {
                    horaSalida: "asc",
                },
            });
            if (usuario.rol == Rol.profesor) {
                const materias: Materia[] = await prisma.materia.findMany({
                    where: {
                        profesorId: usuario.matricula,
                    },
                });
                solicitudes = solicitudes.filter((solicitud) => {
                    return (
                        materias.find((materia) => {
                            return materia.nrc == solicitud.materiaNRC;
                        }) != undefined
                    );
                });
            }
            res.json(solicitudes);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerSolicitudes.post(
    "/solicitudes/",
    validarAccesoAlumno,
    async (req: Request, res: Response) => {
        const nuevaSolicitud: Solicitud = req.body;
        const usuario: Usuario = req.usuario;
        try {
            const equipos: any[] = await prisma.equipo.findMany({
                include: {
                    solicitudes: true,
                },
            });

            let equipoDisponible = equipos.find((equipo) => {
                if(equipo.solicitudes.length == 0) {
                    return true;
                }
                let resultados = equipo.solicitudes.map((solicitud: Solicitud) => {
                    return (
                        nuevaSolicitud.horaEntrada >= solicitud.horaSalida ||
                        (nuevaSolicitud.horaEntrada < solicitud.horaEntrada &&
                            nuevaSolicitud.horaSalida <= solicitud.horaEntrada)
                    );
                });
                return !resultados.includes(false);
            });

            if(equipoDisponible == undefined) {
                res.status(500).send({
                    error: "No hay equipos disponibles en el horario solicitado",
                    code: "R1003",
                });
                return;
            }

            const solicitudCreada: Solicitud = await prisma.solicitud.create({
                data: {
                    creadoEn: moment().toISOString(),
                    horaEntrada: nuevaSolicitud.horaEntrada,
                    horaSalida: nuevaSolicitud.horaSalida,
                    materia: {
                        connect: {
                            nrc: nuevaSolicitud.materiaNRC,
                        },
                    },
                    objetivo: nuevaSolicitud.objetivo,
                    solicitante: {
                        connect: {
                            matricula: usuario.matricula,
                        },
                    },
                    equipo: {
                        connect: {
                            numeroInventario: equipoDisponible?.numeroInventario
                        }
                    }
                },
            });

            res.json(solicitudCreada);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerSolicitudes.delete(
    "observaciones/:id",
    validarAccesoAdministrador,
    async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            const solicitudBorrada: Solicitud = await prisma.solicitud.delete({
                where: {
                    id,
                },
            });
            res.json(solicitudBorrada);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerSolicitudes.put(
    "/observaciones/:id",
    validarAccesoAdministrador,
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const nuevaObservacion: Observacion = req.body;

        if (!nuevaObservacion.contenido) {
            res.status(500).json({
                error: "El campo contenido no puede estar vacío.",
                code: "P1001",
            });
            return;
        }

        if (nuevaObservacion.contenido == "") {
            res.status(500).json({
                error: "El campo contenido no puede estar vacío.",
                code: "P1001",
            });
            return;
        }

        nuevaObservacion.id = id;

        try {
            const observacionActualizada: Observacion =
                await prisma.observacion.update({
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

export default routerSolicitudes;
