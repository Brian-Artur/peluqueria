import { useEffect, useState, type ReactElement } from "react";
import type { Cita, Cliente, Servicio, Seleccion } from "./tipos";
import { mensajeDeError, pedir, pedirJson } from "./peticion";
import CabeceraDias from "./calendario/CabeceraDias";
import Rejilla from "./calendario/Rejilla";
import TarjetaCita from "./calendario/TarjetaCita";
import { lunesDeEstaSemana, sumarDias } from "./calendario/fechas";
import { diasVisibles } from "./calendario/diasVisibles";
import { columnaDeFecha } from "./calendario/posicion";
import styles from "./Calendario.module.css";
import Panel from "./calendario/Panel";


function Calendario(): ReactElement {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [mostrarCerrados, setMostrarCerrados] = useState(false);
  const [lunesVisible, setLunesVisible] = useState(() =>
    lunesDeEstaSemana(new Date())
  );
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refrescarCitas = async (): Promise<void> => {
    try {
      setCitas(await pedirJson<Cita[]>("/api/citas"));
    } catch (fallo) {
      const aviso = `No se pudieron cargar las citas: ${mensajeDeError(fallo)}`;
      // Si también falló la acción, conservar su motivo ayuda a corregirla.
      setError((anterior) => anterior ? `${anterior} ${aviso}` : aviso);
    }
  };

  // Mismo ciclo para crear, mover, cancelar y completar. Si falla, el panel
  // sigue abierto con el motivo, y se refresca igualmente: tras un 409 lo
  // que se ve está desactualizado.
  const ejecutarAccion = async (
    accion: () => Promise<Response>,
    porDefecto: string
  ): Promise<void> => {
    try {
      await accion();
    } catch (fallo) {
      setError(mensajeDeError(fallo, porDefecto));
      await refrescarCitas();
      return;
    }

    setError(null);
    await refrescarCitas();
    setSeleccion(null);
  };

  const seleccionarHueco = (dia: Date, hora: number, minuto: number): void => {
    const inicio = new Date(dia);
    inicio.setHours(hora, minuto, 0, 0);
    setError(null);
    setSeleccion({ tipo: "hueco", inicio });
  };

  const seleccionarCita = (id: number) => {
    setError(null);
    setSeleccion({ tipo: "cita", id });
  };

  const crearCita = (clienteId: number, servicioId: number, inicio: Date) =>
    ejecutarAccion(
      () => pedir("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          servicio_id: servicioId,
          inicio: inicio.toISOString(),
        }),
      }),
      "No se pudo crear la cita"
    );

  const cancelarCita = (id: number) =>
    ejecutarAccion(
      () => pedir(`/api/citas/${id}/cancelar`, { method: "POST" }),
      "No se pudo cancelar la cita"
    );

  const completarCita = (id: number) =>
    ejecutarAccion(
      () => pedir(`/api/citas/${id}/completar`, { method: "POST" }),
      "No se pudo completar la cita"
    );

  useEffect(() => {
    pedirJson<Cita[]>("/api/citas")
      .then(setCitas)
      .catch((fallo) => setError(`No se pudieron cargar las citas: ${mensajeDeError(fallo)}`));
  }, []);

  useEffect(() => {
    pedirJson<Cliente[]>("/api/clientes")
      .then(setClientes)
      .catch((fallo) => setError(`No se pudieron cargar los clientes: ${mensajeDeError(fallo)}`));
  }, []);

  useEffect(() => {
    pedirJson<Servicio[]>("/api/servicios")
      .then(setServicios)
      .catch((fallo) => setError(`No se pudieron cargar los servicios: ${mensajeDeError(fallo)}`));
  }, []);


  const semanaAnterior = () => setLunesVisible(sumarDias(lunesVisible, -7));
  const semanaSiguiente = () => setLunesVisible(sumarDias(lunesVisible, 7));

  const citaSeleccionada =
    seleccion?.tipo === "cita"
      ? citas.find((c) => c.id === seleccion.id) ?? null
      : null;

  const moverCita = (id: number, inicio: string) =>
    ejecutarAccion(
      () => pedir(`/api/citas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inicio }),
      }),
      "No se pudo mover la cita"
    );

  const domingoSiguiente = sumarDias(lunesVisible, 7);

  const citasDeLaSemana = citas.filter((cita) => {
    const inicio = new Date(cita.inicio);
    return inicio >= lunesVisible && inicio < domingoSiguiente;
  });
  const dias = diasVisibles(lunesVisible, citasDeLaSemana, mostrarCerrados);

  return (
    <div className={styles.distribucion}>
      <div className={styles.agenda}>
        <div className={styles.opciones}>
          {seleccion === null && error !== null && (
            <p role="alert" className={styles.error}>{error}</p>
          )}
          <label className={styles.mostrarCerrados}>
            <input
              type="checkbox"
              checked={mostrarCerrados}
              onChange={(evento) => setMostrarCerrados(evento.target.checked)}
            />
            Mostrar días cerrados
          </label>
        </div>

        <div
          className={styles.calendario}
          style={{ gridTemplateColumns: `60px repeat(${dias.length}, minmax(0, 1fr))` }}
        >
          <CabeceraDias dias={dias} onAnterior={semanaAnterior} onSiguiente={semanaSiguiente} />
          <Rejilla
            dias={dias}
            huecoSeleccionado={seleccion?.tipo === "hueco" ? seleccion.inicio : null}
            onSeleccionarHueco={seleccionarHueco}
          />
          {citasDeLaSemana.map((cita) => {
            const columna = columnaDeFecha(new Date(cita.inicio), dias);
            if (columna === null) {
              return null;
            }

            return (
              <TarjetaCita
                key={cita.id}
                cita={cita}
                columna={columna}
                seleccionada={seleccion?.tipo === "cita" && seleccion.id === cita.id}
                onSeleccionarCita={seleccionarCita}
              />
            );
          })}
        </div>
      </div>

      <div className={styles.columnaPanel}>
        {seleccion === null && (
          <p className={styles.ayuda}>
            Pulsa un hueco para crear una cita o una cita para verla.
          </p>
        )}
        {seleccion && (
          <Panel
            key={
              seleccion.tipo === "cita"
                ? `cita-${seleccion.id}`
                : `hueco-${seleccion.inicio.toISOString()}`
            }
            seleccion={seleccion}
            clientes={clientes}
            servicios={servicios}
            citaSeleccionada={citaSeleccionada}
            error={error}
            onCrear={crearCita}
            onCancelar={cancelarCita}
            onCompletar={completarCita}
            onMover={moverCita}
            onCerrar={() => {
              setError(null);
              setSeleccion(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Calendario;
