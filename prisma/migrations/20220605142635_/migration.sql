-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('alumno', 'profesor', 'administrador');

-- CreateEnum
CREATE TYPE "Carrera" AS ENUM ('LTC', 'LIS', 'LE', 'LRySC', 'NA');

-- CreateTable
CREATE TABLE "Usuario" (
    "nombre" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "carrera" "Carrera" NOT NULL,
    "rol" "Rol" NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("matricula")
);

-- CreateTable
CREATE TABLE "Materia" (
    "nrc" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "profesorId" TEXT NOT NULL,

    CONSTRAINT "Materia_pkey" PRIMARY KEY ("nrc")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" TEXT NOT NULL,
    "materiaNRC" TEXT NOT NULL,
    "horaSalida" TIMESTAMP(3) NOT NULL,
    "horaEntrada" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL,
    "objetivo" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL DEFAULT E'886dbac9-5951-4beb-9bc1-08dc586a7aa6',
    "solicitanteId" TEXT NOT NULL,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipo" (
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "numeroInventario" TEXT NOT NULL,

    CONSTRAINT "Equipo_pkey" PRIMARY KEY ("numeroInventario")
);

-- CreateTable
CREATE TABLE "Observacion" (
    "id" TEXT NOT NULL,
    "autorIp" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,

    CONSTRAINT "Observacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "_cursa" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Materia_nombre_key" ON "Materia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "token_id_key" ON "token"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_cursa_AB_unique" ON "_cursa"("A", "B");

-- CreateIndex
CREATE INDEX "_cursa_B_index" ON "_cursa"("B");

-- AddForeignKey
ALTER TABLE "Materia" ADD CONSTRAINT "Materia_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "Usuario"("matricula") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("matricula") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_materiaNRC_fkey" FOREIGN KEY ("materiaNRC") REFERENCES "Materia"("nrc") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("numeroInventario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observacion" ADD CONSTRAINT "Observacion_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("matricula") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observacion" ADD CONSTRAINT "Observacion_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("numeroInventario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_cursa" ADD CONSTRAINT "_cursa_A_fkey" FOREIGN KEY ("A") REFERENCES "Materia"("nrc") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_cursa" ADD CONSTRAINT "_cursa_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("matricula") ON DELETE CASCADE ON UPDATE CASCADE;
