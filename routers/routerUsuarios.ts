import express, { Router, Request, Response } from "express";
import { Carrera, PrismaClient, Rol, Usuario } from "@prisma/client";
import handleError from "../handle-errors";
import hashPassword from "../controllers/hashPassword";
import validarAcceso from "../controllers/validarAcceso";
import validarAccesoAdministrador from "../controllers/validarAccesoAdmin";

const routerUsuarios: Router = express.Router();
const prisma = new PrismaClient();

routerUsuarios.get(
    "/",
    validarAccesoAdministrador,
    async (req: Request, res: Response) => {
        try {
            const usuarios: Usuario[] = await prisma.usuario.findMany();
            res.json(usuarios);
        } catch (error: any) {
            handleError(error as Error, res);
        }
    }
);

routerUsuarios.get("/:matricula/", validarAcceso, async (req: Request, res: Response) => {
    const { matricula } = req.params;
    const usuario: Usuario = req.usuario;

    if (!((usuario.matricula == matricula) || (usuario.rol == Rol.administrador))) {
        res.status(401).send({
            error: "No tienes acceso a este recurso",
            code: "T1003",
        });
        return;
    }
    try {
        const usuarioObtenido: Usuario | null = await prisma.usuario.findUnique(
            {
                where: {
                    matricula,
                },
            }
        );
        if (usuarioObtenido == null) {
            res.status(404).send({
                error: `Usuario con matrícula ${matricula} no encontrado.`,
                code: "R1001",
            });
            return;
        }
        res.json(usuarioObtenido);
    } catch (error: any) {
        handleError(error as Error, res);
    }
});

routerUsuarios.post("/", validarAccesoAdministrador, async (req: Request, res: Response) => {
    const nuevoUsuario: Usuario = req.body;
    if (
        nuevoUsuario.rol != Rol.administrador &&
        nuevoUsuario.rol != Rol.alumno &&
        nuevoUsuario.rol != Rol.profesor
    ) {
        nuevoUsuario.rol = Rol.alumno;
    }

    if (
        nuevoUsuario.carrera != Carrera.LE &&
        nuevoUsuario.carrera != Carrera.LIS &&
        nuevoUsuario.carrera != Carrera.LRySC &&
        nuevoUsuario.carrera != Carrera.NA &&
        nuevoUsuario.carrera != Carrera.LTC
    ) {
        res.status(500).json({
            error: "Carrera no válida",
            code: "P1002",
        });
        return;
    }

    if(!nuevoUsuario.nombre || !nuevoUsuario.password) {
        res.status(500).json({
            error: "Los campos nombre y password no pueden estar vacíos",
            code: "P1001",
        });
        return;
    }

    if (nuevoUsuario.nombre == "" || nuevoUsuario.password == "") {
        res.json({
            error: "Los campos nombre y password no pueden estar vacíos",
            code: "P1001",
        });
        return;
    }
    try {
        nuevoUsuario.password = await hashPassword(nuevoUsuario.password);
        const usuario: Usuario = await prisma.usuario.create({
            data: nuevoUsuario,
        });
        res.json(usuario);
    } catch (error: any) {
        handleError(error as Error, res);
    }
});

routerUsuarios.delete("/:matricula/", validarAcceso, async (req: Request, res: Response) => {
    const { matricula } = req.params;
    const usuario: Usuario = req.usuario;

    if (!((usuario.matricula == matricula) || (usuario.rol == Rol.administrador))) {
        res.status(401).send({
            error: "No tienes acceso a este recurso",
            code: "T1003",
        });
        return;
    }
    try {
        const usuarioBorrado: Usuario = await prisma.usuario.delete({
            where: {
                matricula,
            },
        });
        res.json(usuarioBorrado);
    } catch (error: any) {
        handleError(error as Error, res);
    }
});

routerUsuarios.put("/:matricula/", validarAccesoAdministrador, async (req: Request, res: Response) => {
    const { matricula } = req.params;
    const usuario: Usuario = req.usuario;

    if (!((usuario.matricula == matricula) || (usuario.rol == Rol.administrador))) {
        res.status(401).send({
            error: "No tienes acceso a este recurso",
            code: "T1003",
        });
        return;
    }

    const nuevoUsuario: Usuario = req.body;
    if (
        nuevoUsuario.rol != undefined &&
        nuevoUsuario.rol != Rol.administrador &&
        nuevoUsuario.rol != Rol.alumno &&
        nuevoUsuario.rol != Rol.profesor
    ) {
        nuevoUsuario.rol = Rol.alumno;
    }

    if (
        nuevoUsuario.carrera != undefined &&
        nuevoUsuario.carrera != Carrera.LE &&
        nuevoUsuario.carrera != Carrera.LIS &&
        nuevoUsuario.carrera != Carrera.LRySC &&
        nuevoUsuario.carrera != Carrera.LTC
    ) {
        res.status(500).json({
            error: "Carrera no válida",
            code: "P1002",
        });
        return;
    }
    nuevoUsuario.matricula = matricula;
    if (nuevoUsuario.nombre == "" || nuevoUsuario.password == "") {
        res.json({
            error: "Los campos nombre y password no pueden estar vacíos",
            code: "P1001",
        });
        return;
    }
    if (nuevoUsuario.password != undefined) {
        nuevoUsuario.password = await hashPassword(nuevoUsuario.password);
    }
    try {
        const usuarioActualizado: Usuario = await prisma.usuario.update({
            where: {
                matricula,
            },
            data: nuevoUsuario,
        });
        res.json(usuarioActualizado);
    } catch (error: any) {
        handleError(error as Error, res);
    }
});

export default routerUsuarios;
