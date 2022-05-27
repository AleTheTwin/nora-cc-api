import { Usuario } from "@prisma/client";

const jwt = require("jwt-simple");
const moment = require("moment");
const apiKey = process.env.API_KEY || "akljfhaksdfhkasjdfhkasfkj";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

export default function createToken(usuario: Usuario): Promise<string> {
    var payload = {
        subscriber: usuario.matricula,
        createdAt: moment().unix(),
        expiration: moment().add(30, "days").unix(),
    };
    const token = jwt.encode(payload, apiKey);
    return new Promise((resolve, reject) => {
        prisma.token
            .create({
                data: {
                    id: token,
                    isActive: true,
                },
            })
            .then(() => {
                resolve(token);
            })
            .catch((err: any) => {
                reject(err);
            });
    });
};