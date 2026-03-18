import { Prisma } from "@prisma/client";
import { z } from "zod";

export interface AdminRouteError {
  error: string;
  status: number;
}

export function getAdminRouteError(error: unknown, fallbackMessage: string): AdminRouteError {
  if (error instanceof z.ZodError) {
    const message = error.issues
      .map((issue) => `${formatPath(issue.path)}: ${issue.message}`)
      .join("; ");

    return {
      error: message || fallbackMessage,
      status: 400
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return {
        error: "A title with this slug already exists.",
        status: 409
      };
    }

    if (error.code === "P2025") {
      return {
        error: "The requested title could not be found.",
        status: 404
      };
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return {
      error: error.message,
      status: 400
    };
  }

  return {
    error: fallbackMessage,
    status: 400
  };
}

function formatPath(path: Array<string | number>): string {
  return path.length > 0 ? path.join(".") : "body";
}
