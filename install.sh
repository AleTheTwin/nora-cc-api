# 
#   Autores:
#     Alejandro de Jesús ¨Sánchez Morales
#     Emanuel Alejandro Solórzano Guzmán
# 

#!/bin/sh

reset="\033[0m"
cyan="\033[36m"
green="\033[32m"
yellow="\033[33m"
magenta="\033[35m"
blue="\033[34m"
red="\033[31m"


printf "${reset}\n"
printf "${cyan}Instslando api de Nora CC\n"
printf "${reset}\n"

printf "${reset}Ingresa el puerto en el que el servicio va a correr: default [8080]:\n"
read PORT

if [ "$PORT" = "" ]; then
    PORT=8080
fi

DB_USER=root
DB_PASSWORD=root

printf "${cyan}Generando la llave secreta para la decodificación de los tokens de acceso...\n"

API_KEY=$(openssl rand -hex 20)
printf "${green}[ Generada ] ${cyan}${API_KEY}\n"


printf "${cyan}Creando archivos .env...\n"
echo "
# Variables de entorno para la api

DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
PORT=$PORT
API_KEY=$API_KEY


# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB (Preview).
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="'"mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:3306/mydb"'"

" > .env
DB_HOST=localhost
DATABASE_URL='"'mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:3306/mydb'"'

printf "${reset}\n"
printf "${cyan}Iniciando el servicio para su configuración inicial...\n"
docker-compose up -d --build db

printf "${reset}\n"
printf "${cyan}Instalando módulos de node...\n"

docker run -it --rm -w /app -v $(pwd):/app node:16 npm i

printf "${reset}\n"
printf "${cyan}Compilando proyecto...\n"

npm run build

printf "${reset}\n"
printf "${cyan}Creando base de datos..."

# npx prisma migrate dev --name init
echo $DATABASE_URL

docker run -it --rm --network="host" -w /app -v $(pwd):/app node:16 npx prisma migrate dev --name init

printf "${reset}Ingresa el nombre del administrador del sistema: default [admin]:\n"
read ADMIN_NOMBRE

if [ "$ADMIN_NOMBRE" = "" ]; then
    ADMIN_NOMBRE=admin
fi

printf "${reset}Ingresa la contraseña para el administrador del sistema: default [admin]:\n"
read ADMIN_PASSWORD

if [ "$ADMIN_PASSWORD" = "" ]; then
    ADMIN_PASSWORD=admin
fi

echo "'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator['throw'](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { 'default': mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
const client_1 = require('@prisma/client');
const hashPassword_1 = __importDefault(require('./controllers/hashPassword'));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const usuario = yield prisma.usuario.create({
            data: {
                matricula: 'zs00000000',
                nombre: '$ADMIN_NOMBRE',
                carrera: 'LTC',
                password: yield (0, hashPassword_1.default)('$ADMIN_PASSWORD'),
                rol: 'administrador',
            },
        });
        console.log(usuario);
    });
}
main()
    .catch((e) => {
    throw e;
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$""disconnect();
}));
" > dist/create-user.js

docker run -it --rm --network="host" -w /app -v $(pwd):/app node:16 node dist/create-user

printf "${reset}\n"

printf "${cyan}Dando de baja el servicio de base de datos...\n"
docker-compose down
echo "
version: '3.3'
services:
    db:
        image: mariadb
        restart: always
        environment:
            - MARIADB_ROOT_PASSWORD=root
            - MARIADB_USER=${DB_USER}
            - MARIADB_PASSWORD=${DB_PASSWORD}
            - MARIADB_DATABASE=mydb
        volumes:
            - ./db:/var/lib/mysql/
    api:
        image: node:16
        volumes:
            - ./:/home/node/app
        user: node
        working_dir: /home/node/app/
        command: "'"'npm start'"'"
        links:
            - db
        ports:
            - ${PORT}:8080
        environment:
            - DB_HOST=db
        depends_on:
            - db
" > docker-compose.yml
printf "${reset}\n"
printf "${green}Instalación completa"

printf "${reset}\n"
printf "${reset}Ahora puedes correr los servicios con el comando:\n"
echo ""
printf "${reset}\t$ ${blue}docker-compose up -d"
printf "${reset}\n"
echo ""


