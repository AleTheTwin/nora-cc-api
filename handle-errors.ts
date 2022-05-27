import { Response } from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

export default function handleError(error: Error, res: Response): void {
    console.log(error);
    if (error instanceof PrismaClientKnownRequestError) {
        let prismaError: PrismaClientKnownRequestError =
            error as PrismaClientKnownRequestError;

        res.status(500).json({
            ...prismaError,
            error: "Error de prisma, mira https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes para más información"
        });
        return;
    }
    res.status(500).json({
        error: error.message,
        code: "U0001",
    });
}
