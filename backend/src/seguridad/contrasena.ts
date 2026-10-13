import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

function derivarContrasena(texto: string, sal: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(texto, sal, 64, (error, hash) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(hash);
    });
  });
}

export async function cifrarContrasena(texto: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await derivarContrasena(texto, sal);
  return `scrypt$${sal.toString("base64")}$${hash.toString("base64")}`;
}

export async function comprobarContrasena(texto: string, guardado: string): Promise<boolean> {
  const partes = guardado.split("$");
  if (partes.length !== 3 || partes[0] !== "scrypt") return false;

  const sal = Buffer.from(partes[1]!, "base64");
  const esperado = Buffer.from(partes[2]!, "base64");
  // Buffer.from tolera base64 mal formado: comprobamos también su forma canónica.
  if (sal.length !== 16 || esperado.length !== 64) return false;
  if (sal.toString("base64") !== partes[1] || esperado.toString("base64") !== partes[2]) return false;

  const obtenido = await derivarContrasena(texto, sal);
  return timingSafeEqual(obtenido, esperado);
}
