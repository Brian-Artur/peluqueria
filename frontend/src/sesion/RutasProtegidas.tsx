import type { ReactElement } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useSesion } from "./useSesion";

export default function RutasProtegidas(): ReactElement {
  const { usuario } = useSesion();
  const ubicacion = useLocation();
  if (usuario === null) {
    const volverA = ubicacion.pathname + ubicacion.search + ubicacion.hash;
    return <Navigate to="/entrar" replace state={{ volverA }} />;
  }
  return <Outlet />;
}
