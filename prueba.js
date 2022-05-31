const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const equipos = await prisma.equipo.findMany({
        include: {
            solicitudes: true,
        },
    });
    console.log(equipos);
}

main();
