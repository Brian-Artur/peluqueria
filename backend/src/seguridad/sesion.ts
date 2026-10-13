import { createHash } from "node:crypto";

export const DURACION_SESION_SEGUNDOS = 12 * 60 * 60;

export function cifrarToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
