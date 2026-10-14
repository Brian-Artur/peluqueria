import { describe, expect, it } from "vitest";
import type { Excepcion, HorarioSemanal, Temporada } from "@peluqueria/compartido";
import { resolverHorarioDia } from "./resolverHorarioDia";

const general: HorarioSemanal = [{ dia_semana: 2, tramos: [{ abre: "09:30", cierra: "14:00" }, { abre: "16:00", cierra: "20:00" }] }];
const temporada: Temporada = { id: 1, nombre: "Verano", desde: "2026-07-01", hasta: "2026-08-31", activa: true, horario: [{ dia_semana: 2, tramos: [{ abre: "08:00", cierra: "15:00" }] }] };
const excepcion: Excepcion = { id: 1, fecha: "2026-07-07", cerrado: true, motivo: "Festivo", tramos: [] };

describe("resolver el horario de un día", () => {
  it("devuelve los tramos generales de un día normal", () => {
    expect(resolverHorarioDia("2026-06-30", general, [], [])).toEqual({ fecha: "2026-06-30", tramos: general[0].tramos, origen: "general", motivo: null, temporada_nombre: null });
  });
  it("un día omitido o explícitamente cerrado no tiene tramos", () => {
    expect(resolverHorarioDia("2026-06-29", general, [], []).tramos).toEqual([]);
    expect(resolverHorarioDia("2026-06-30", [{ dia_semana: 2, tramos: [] }], [], []).tramos).toEqual([]);
  });
  it("usa la temporada activa dentro de su rango", () => {
    expect(resolverHorarioDia("2026-07-07", general, [temporada], [])).toEqual({ fecha: "2026-07-07", tramos: temporada.horario[0].tramos, origen: "temporada", motivo: null, temporada_nombre: "Verano" });
  });
  it("ignora temporadas inactivas y fechas fuera del rango", () => {
    expect(resolverHorarioDia("2026-07-07", general, [{ ...temporada, activa: false }], []).origen).toBe("general");
    expect(resolverHorarioDia("2026-09-01", general, [temporada], []).origen).toBe("general");
  });
  it.each(["2026-07-01", "2026-08-31"])("incluye el límite %s", (fecha) => {
    expect(resolverHorarioDia(fecha, general, [temporada], []).origen).toBe("temporada");
  });
  it("no recupera el general si la temporada cierra ese día", () => {
    expect(resolverHorarioDia("2026-07-07", general, [{ ...temporada, horario: [] }], []).tramos).toEqual([]);
  });
  it("una excepción cerrada gana al general y conserva el motivo", () => {
    expect(resolverHorarioDia(excepcion.fecha, general, [], [excepcion])).toEqual({ fecha: excepcion.fecha, tramos: [], origen: "excepcion", motivo: "Festivo", temporada_nombre: null });
  });
  it("una excepción permite abrir un domingo con tramos especiales", () => {
    const bodas = { ...excepcion, fecha: "2026-07-12", cerrado: false, motivo: "Bodas", tramos: [{ abre: "09:00", cierra: "14:00" }] };
    expect(resolverHorarioDia(bodas.fecha, general, [], [bodas]).tramos).toEqual(bodas.tramos);
  });
  it("la excepción gana dentro de la temporada, tanto al cerrar como al abrir", () => {
    expect(resolverHorarioDia(excepcion.fecha, general, [temporada], [excepcion]).origen).toBe("excepcion");
    const abierta = { ...excepcion, cerrado: false, tramos: [{ abre: "16:00", cierra: "20:00" }] };
    const dia = resolverHorarioDia(excepcion.fecha, general, [temporada], [abierta]);
    expect(dia.tramos).toEqual(abierta.tramos);
    expect(dia.temporada_nombre).toBeNull();
  });
});
