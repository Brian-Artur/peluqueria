import { useContext } from "react";
import { ContextoSesion, type Sesion } from "./ContextoSesion";

export function useSesion(): Sesion {
  const sesion = useContext(ContextoSesion);
  if (sesion === null) throw new Error("useSesion necesita un SesionProvider");
  return sesion;
}
