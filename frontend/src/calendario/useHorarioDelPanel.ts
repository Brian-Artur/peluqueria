import { useEffect, useState } from "react";
import type { DiaResuelto } from "@peluqueria/compartido";
import { lunesDeEstaSemana } from "./fechas";
import { fechaDeDia } from "./horario";
import { esAbortada, mensajeDeError } from "../peticion";

type Semana = { desde: string; dias: DiaResuelto[] };
type Resultado = { dias: DiaResuelto[] | null; error: string | null; reintentar: () => void };

export function useHorarioDelPanel(
  inicio: Date,
  semanaVisible: Semana | null,
  consultarSemana: (desde: string, signal: AbortSignal) => Promise<DiaResuelto[]>,
): Resultado {
  const desde = fechaDeDia(lunesDeEstaSemana(inicio));
  const [consultada, setConsultada] = useState<Semana | null>(null);
  const [falloConsulta, setFalloConsulta] = useState<{ desde: string; mensaje: string } | null>(null);
  const [intento, setIntento] = useState(0);
  const reintentar = (): void => setIntento((anterior) => anterior + 1);
  const visible = semanaVisible?.desde === desde;

  useEffect(() => {
    if (visible) return;
    const controlador = new AbortController();
    consultarSemana(desde, controlador.signal)
      .then((dias) => {
        if (controlador.signal.aborted) return;
        setConsultada({ desde, dias });
        setFalloConsulta(null);
      })
      .catch((fallo) => {
        if (controlador.signal.aborted || esAbortada(fallo)) return;
        setFalloConsulta({ desde, mensaje: `No se pudo comprobar el horario: ${mensajeDeError(fallo)}` });
      });
    return () => controlador.abort();
  }, [desde, visible, consultarSemana, intento]);

  if (visible && semanaVisible) return { dias: semanaVisible.dias, error: null, reintentar };
  const dias = consultada?.desde === desde ? consultada.dias : null;
  const error = falloConsulta?.desde === desde ? falloConsulta.mensaje : null;
  return { dias, error, reintentar };
}
