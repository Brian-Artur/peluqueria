import {
  findAllCitas,
  createCita,
  findCitaById,
  updateInicioFin,
  updateEstado,
} from "../repositories/citaRepository";
import { findClienteById } from "../repositories/clienteRepository";
import { findServicioById } from "../repositories/servicioRepository";
import { ErrorNoEncontrado, ErrorConflicto } from "../errores";

export async function listarCitas() {
  return findAllCitas();
}

export async function crearCita(
  cliente_id: number,
  servicio_id: number,
  inicio: string
) {
  const cliente = await findClienteById(cliente_id);
  if (!cliente) throw new ErrorNoEncontrado("Cliente no encontrado");

  const servicio = await findServicioById(servicio_id);
  if (!servicio) throw new ErrorNoEncontrado("Servicio no encontrado");

  const fechaInicio = new Date(inicio);
  const fechaFin = calcularFin(fechaInicio, servicio.duracion_min);

  return createCita(cliente_id, servicio_id, fechaInicio, fechaFin);
}

export async function moverCita(id: number, inicio: string) {
  const cita = await findCitaById(id);
  if (!cita) throw new ErrorNoEncontrado("Cita no encontrada");

  if (cita.estado !== "reservada") {
    throw new ErrorConflicto("Solo se pueden mover citas reservadas");
  }

  const servicio = await findServicioById(cita.servicio_id);
  if (!servicio) throw new ErrorNoEncontrado("Servicio no encontrado");

  const fechaInicio = new Date(inicio);
  const fechaFin = calcularFin(fechaInicio, servicio.duracion_min);

  await updateInicioFin(id, fechaInicio, fechaFin);
}

export async function cancelarCita(id: number) {
  const cita = await findCitaById(id);
  if (!cita) throw new ErrorNoEncontrado("Cita no encontrada");

  if (cita.estado !== "reservada") {
    throw new ErrorConflicto("Solo se pueden cancelar citas reservadas");
  }

  await updateEstado(id, "cancelada");
}

// El fin de una cita es su inicio más la duración del servicio (snapshot)
function calcularFin(inicio: Date, duracionMin: number): Date {
  return new Date(inicio.getTime() + duracionMin * 60_000);
}