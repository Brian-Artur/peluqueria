import { emitKeypressEvents, type Key } from "node:readline";

export function leerContrasena(pregunta: string): Promise<string> {
  const entrada = process.stdin;
  if (!entrada.isTTY) {
    return Promise.reject(new Error("La contraseña debe introducirse en una terminal interactiva"));
  }

  return new Promise((resolve, reject) => {
    const modoAnterior = entrada.isRaw;
    let contrasena = "";
    emitKeypressEvents(entrada);
    process.stdout.write(pregunta);
    entrada.setRawMode(true);
    entrada.resume();

    function terminar(error?: Error): void {
      entrada.off("keypress", alPulsar);
      entrada.setRawMode(modoAnterior);
      entrada.pause();
      process.stdout.write("\n");
      if (error) {
        reject(error);
        return;
      }
      resolve(contrasena);
    }

    function alPulsar(texto: string | undefined, tecla: Key): void {
      if (tecla.ctrl && (tecla.name === "c" || tecla.name === "d")) {
        terminar(new Error("Creación de usuario cancelada"));
        return;
      }
      if (tecla.name === "return" || tecla.name === "enter") {
        terminar();
        return;
      }
      if (tecla.name === "backspace") {
        // Conservamos caracteres completos si la contraseña contiene Unicode.
        contrasena = Array.from(contrasena).slice(0, -1).join("");
        return;
      }
      if (texto && !tecla.ctrl && !tecla.meta && !/[\x00-\x1f\x7f]/.test(texto)) {
        contrasena += texto;
      }
    }

    entrada.on("keypress", alPulsar);
  });
}
