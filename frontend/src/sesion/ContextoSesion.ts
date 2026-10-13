import { createContext } from "react";
import type { Credenciales, Permiso, UsuarioSesion } from "@peluqueria/compartido";

export type Sesion = {
  usuario: UsuarioSesion | null;
  puede: (permiso: Permiso) => boolean;
  entrar: (credenciales: Credenciales) => Promise<void>;
  salir: () => Promise<void>;
};

// Muchas pantallas y botones necesitan al usuario conectado; pasarlo por props
// a todos ellos añadiría ruido a componentes que solo lo transmitirían.
export const ContextoSesion = createContext<Sesion | null>(null);
