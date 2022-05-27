import { Usuario } from "@prisma/client";
import express from "express";

declare global {
    namespace Express {
        interface Request {
            usuario?: Record<Usuario >;
        }
    }
}
