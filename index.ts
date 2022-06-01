import app from "./app";
import { writeFileSync } from "fs";
import { connection, Message, request } from "websocket";
import { PrismaClient, Rol, Usuario } from "@prisma/client";

const http = require("http");

const prisma = new PrismaClient();
const server = http.createServer(app);
const port = 8080;

const listEndpoints = require("express-list-endpoints"); // npm i express-list-endpoints
let listaDeRutas = listEndpoints(app);

writeFileSync("./routes.json", JSON.stringify(listaDeRutas));

// app.listen(port, () => {
//     console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
// });

const WebSocketServer = require("websocket").server;
server.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});

let wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false,
});

type Conexión = {
    socket: connection;
    owner?: string;
    pareja?: string;
};

type ChatMessage = {
    tipo: Tipo;
    contenido: string;
};

enum Tipo {
    handshake,
    mensaje,
    reject,
}

var conexiones: Conexión[] = [];
var administradoresConectados: Conexión[] = [];

wsServer.on("request", function (request: request) {
    const connection: connection = request.accept(
        "echo-protocol",
        request.origin
    );

    connection.on("message", function (message: Message) {
        if (message.type === "utf8") {
            var payload: ChatMessage = JSON.parse(message.utf8Data);
            switch (payload.tipo) {
                case Tipo.handshake:
                    handleNuevaConexión(payload.contenido, connection);
                    break;
                case Tipo.mensaje:
                    handleMensaje(payload.contenido, connection);
                    break;
            }
            // connection.sendUTF(message.utf8Data);
        } else if (message.type === "binary") {
            console.log(
                "Received Binary Message of " +
                    message.binaryData.length +
                    " bytes"
            );
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on("close", function (reasonCode, description) {
        console.log(
            new Date() + " Peer " + connection.remoteAddress + " disconnected."
        );
    });
});

async function handleMensaje(mensaje: string, conexión: connection) {
    conexión.sendUTF(mensaje);
}
async function handleNuevaConexión(matricula: string, conexión: connection) {
    try {
        const usuario: Usuario | null = await prisma.usuario.findUnique({
            where: {
                matricula: matricula,
            },
        });

        if (usuario !== null && usuario.rol == Rol.administrador) {
            administradoresConectados.push({
                socket: conexión,
                owner: usuario.matricula,
            });
            return;
        }

        // if(administradoresConectados.length > 0) {
        //     let pareja = 
        // }

        let nuevaConexión: Conexión = {
            socket: conexión,
            owner: matricula,
        };

        conexiones.push(nuevaConexión);
    } catch (error) {}
}
