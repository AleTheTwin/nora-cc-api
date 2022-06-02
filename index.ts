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
    owner: string;
    pareja?: string;
};

type ChatMessage = {
    tipo: Tipo;
    contenido: string;
};

enum Tipo {
    handshake = "handshake",
    mensajeAdmin = "mensajeAdmin",
    mensaje = "mensaje",
    reject = "reject",
    administradorConectado = "administradorConectado",
    disconnect = "disconnect",
    init = "init",
}

var conexiones: Conexión[] = [];
var cola: Conexión[] = [];
var administradoresConectados: Conexión[] = [];

wsServer.on("request", function (request: request) {
    const connection: connection = request.accept(
        "echo-protocol",
        request.origin
    );

    let conexión: Conexión | null = null;

    connection.on("message", async function (message: Message) {
        if (message.type === "utf8") {
            var payload: ChatMessage = JSON.parse(message.utf8Data);
            switch (payload.tipo) {
                case Tipo.handshake:
                    let nuevaConexión: Conexión | null =
                        await handleNuevaConexión(
                            payload.contenido,
                            connection
                        );
                    if (nuevaConexión != null) {
                        conexión = nuevaConexión;
                    }
                    break;
                case Tipo.mensajeAdmin:
                    handleMensaje(payload.contenido, conexión!, payload.tipo);
                    break;
                case Tipo.mensaje:
                    handleMensaje(payload.contenido, conexión!, payload.tipo);
                    break;
                case Tipo.disconnect:
                    handleDisconnect(conexión!);
            }
        }
    });
    connection.on("close", async function (reasonCode, description) {
        if (conexión === null) {
            return;
        }
        let mensajeDesconexión = {
            tipo: Tipo.disconnect,
            contenido: "Esta sesión ha sido terminada",
        };
        let pareja;
        try {
            const usuario: Usuario | null = await prisma.usuario.findUnique({
                where: {
                    matricula: conexión.owner,
                },
            });

            if (usuario !== null && usuario.rol == Rol.administrador) {
                if (conexión.pareja !== undefined) {
                    pareja = conexiones.find(
                        (usuario) => usuario.owner == conexión?.pareja
                    );
                    pareja!.pareja = undefined;
                    pareja?.socket.sendUTF(JSON.stringify(mensajeDesconexión));
                }
                administradoresConectados = administradoresConectados.filter(
                    (usuario) => usuario.owner != conexión?.owner
                );
            } else {
                if (conexión.pareja !== undefined) {
                    pareja = administradoresConectados.find(
                        (usuario) => usuario.owner == conexión?.pareja
                    );
                    pareja!.pareja = undefined;
                    pareja?.socket.sendUTF(JSON.stringify(mensajeDesconexión));
                }
                conexiones = conexiones.filter(
                    (usuario) => usuario.owner != conexión?.owner
                );
            }
        } catch (error) {
            console.log(error);
            return null;
        }
    });
});

async function handleDisconnect(conexión: Conexión) {
    let mensajeDesconexión = {
        tipo: Tipo.disconnect,
        contenido: "Esta sesión ha sido terminada",
    };
    let pareja;
    let usuarioDesconectándose;
    try {
        const usuario: Usuario | null = await prisma.usuario.findUnique({
            where: {
                matricula: conexión.owner,
            },
        });

        if (usuario !== null && usuario.rol == Rol.administrador) {
            usuarioDesconectándose = administradoresConectados.find(
                (usuario) => usuario.owner == conexión?.owner
            );
            if (conexión.pareja !== undefined) {
                pareja = conexiones.find(
                    (usuario) => usuario.owner == conexión?.pareja
                );
                pareja!.pareja = undefined;
                pareja?.socket.sendUTF(JSON.stringify(mensajeDesconexión));
            }
            usuarioDesconectándose!.pareja = undefined;

            if (cola.length > 0) {
                asignarDesdeCola(usuarioDesconectándose!);
            }
        } else {
            usuarioDesconectándose = conexiones.find(
                (usuario) => usuario.owner == conexión?.owner
            );
            if (conexión.pareja !== undefined) {
                pareja = administradoresConectados.find(
                    (usuario) => usuario.owner == conexión?.pareja
                );
                pareja?.socket.sendUTF(JSON.stringify(mensajeDesconexión));
                pareja!.pareja = undefined;
                if (cola.length > 0) {
                    asignarDesdeCola(pareja!);
                }
            }
            usuarioDesconectándose!.pareja = undefined;
            conexiones.filter((usuario) => usuario.owner != conexión?.owner);
        }
    } catch (error) {
        console.log(error);
        return null;
    }
}

async function handleMensaje(mensaje: string, conexión: Conexión, tipo: Tipo) {
    let mensajeSaliente = {
        tipo: Tipo.mensaje,
        remitente: conexión.owner,
        hora: Date.now(),
        contenido: mensaje,
    };

    let conexiónDestinatario;

    if (tipo == Tipo.mensajeAdmin) {
        conexiónDestinatario = conexiones.find(
            (usuarioConectado) => usuarioConectado.pareja == conexión.owner
        );
    } else {
        conexiónDestinatario = administradoresConectados.find(
            (usuarioConectado) => usuarioConectado.pareja == conexión.owner
        );
    }

    if (conexiónDestinatario !== undefined) {
        conexiónDestinatario.socket.sendUTF(JSON.stringify(mensajeSaliente));
    }
}

async function handleNuevaConexión(
    matricula: string,
    conexión: connection
): Promise<Conexión | null> {
    try {
        const usuario: Usuario | null = await prisma.usuario.findUnique({
            where: {
                matricula: matricula,
            },
        });

        let nuevaConexión: Conexión = {
            socket: conexión,
            owner: matricula,
        };

        if (usuario !== null && usuario.rol == Rol.administrador) {
            administradoresConectados.push(nuevaConexión);
        } else {
            conexiones.push(nuevaConexión);
        }
        asignarConversación(nuevaConexión);
        return nuevaConexión;
    } catch (error) {
        console.log(error);
        return null;
    }
}

async function asignarConversación(conexionAAsignar: Conexión) {
    try {
        const usuario: Usuario | null = await prisma.usuario.findUnique({
            where: {
                matricula: conexionAAsignar.owner,
            },
        });

        if (usuario !== null && usuario.rol == Rol.administrador) {
            if (cola.length > 0) {
                asignarDesdeCola(conexionAAsignar);
            }
            return;
        }

        cola.push(conexionAAsignar);

        let administradorDisponible = administradoresConectados.find(
            (administradorConectado) => {
                return administradorConectado.pareja === undefined;
            }
        );

        if (
            administradoresConectados.length === 0 ||
            administradorDisponible === undefined
        ) {
            conexionAAsignar.socket.sendUTF(
                JSON.stringify({
                    tipo: Tipo.mensaje,
                    contenido:
                        "Usted se encuentra el la cola de espera, pronto un administrador lo atenderá.",
                })
            );
            return;
        }

        asignarDesdeCola(administradorDisponible);
    } catch (error) {
        console.log(error);
        return null;
    }
}

function asignarDesdeCola(conexiónDeAdministrador: Conexión) {
    let conexiónSiguiente = cola.pop();
    conexiónSiguiente = conexiones.find(
        (conexión) => conexión.owner == conexiónSiguiente!.owner
    );
    conexiónSiguiente!.pareja = conexiónDeAdministrador.owner;
    let referencia = administradoresConectados.find(
        (usuario) => usuario.owner == conexiónDeAdministrador.owner
    );
    referencia!.pareja = conexiónSiguiente?.owner;
    sendInitialMessage(conexiónSiguiente!);
    sendInitialMessage(referencia!);
}

function sendInitialMessage(conexión: Conexión) {
    let initialMessage = {
        tipo: Tipo.init,
    };
    conexión.socket.sendUTF(JSON.stringify(initialMessage));
}
