export class ErrorNoEncontrado extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorNoEncontrado";
  }
}

export class ErrorConflicto extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorConflicto";
  }
}