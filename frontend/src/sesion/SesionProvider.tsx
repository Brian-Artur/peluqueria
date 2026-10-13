import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import {
  esquemaCredenciales, esquemaUsuarioSesion, puede as tienePermiso,
  type Credenciales, type Permiso, type UsuarioSesion,
} from "@peluqueria/compartido";
import { alPerderSesion, esAbortada, mensajeDeError, pedir, pedirJson } from "../peticion";
import { ContextoSesion } from "./ContextoSesion";

export function SesionProvider({ children }: { children: ReactNode }): ReactElement {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    let sesionPerdida = false;
    const dejarDeEscuchar = alPerderSesion((): void => {
      sesionPerdida = true;
      setUsuario(null);
    });

    pedirJson("/api/sesion", esquemaUsuarioSesion, { signal: controlador.signal })
      .then((conectado) => {
        if (!controlador.signal.aborted && !sesionPerdida) setUsuario(conectado);
      })
      .catch((fallo: unknown) => {
        if (controlador.signal.aborted || esAbortada(fallo) || sesionPerdida) return;
        setError(mensajeDeError(fallo));
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });

    return (): void => {
      controlador.abort();
      dejarDeEscuchar();
    };
  }, []);

  const entrar = async (credenciales: Credenciales): Promise<void> => {
    const resultado = esquemaCredenciales.safeParse(credenciales);
    if (!resultado.success) {
      throw new Error(resultado.error.issues[0]?.message ?? "Revisa el usuario y la contraseña");
    }
    const conectado = await pedirJson("/api/sesion", esquemaUsuarioSesion, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultado.data),
    });
    setUsuario(conectado);
  };

  const salir = async (): Promise<void> => {
    await pedir("/api/sesion", { method: "DELETE" });
    setUsuario(null);
  };

  const puede = (permiso: Permiso): boolean => {
    if (usuario === null) return false;
    return tienePermiso(usuario.rol, permiso);
  };

  if (cargando) return <p role="status">Cargando…</p>;
  if (error !== null) {
    return (
      <div>
        <p role="alert">{error}</p>
        <button type="button" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return (
    <ContextoSesion.Provider value={{ usuario, puede, entrar, salir }}>
      {children}
    </ContextoSesion.Provider>
  );
}
