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

export class ErrorNoAutenticado extends Error {
  constructor(mensaje: string = "Debes iniciar sesión") {
    super(mensaje);
    this.name = "ErrorNoAutenticado";
  }
}

export class ErrorProhibido extends Error {
  constructor(mensaje: string = "No tienes permiso para esta acción") {
    super(mensaje);
    this.name = "ErrorProhibido";
  }
}
