import { describe, expect, it } from "vitest";
import {
  esquemaTramo, esquemaHorarioSemanal, esquemaDatosTemporada, esquemaTemporada,
  esquemaDatosExcepcion, esquemaExcepcion, esquemaLocal, esquemaHorarioCompleto, esquemaDiaResuelto,
} from "./horario";

const tramo = { abre: "09:30", cierra: "14:00" };
const horario = [{ dia_semana: 2, tramos: [tramo, { abre: "16:00", cierra: "20:00" }] }];
const temporada = { nombre: "Verano", desde: "2026-07-01", hasta: "2026-08-31", activa: true };
const excepcion = { fecha: "2026-07-12", cerrado: false, motivo: "Bodas", tramos: [tramo] };

describe("contratos de horario", () => {
  it("admite varios tramos, tramos contiguos y días cerrados u omitidos", () => {
    expect(esquemaHorarioSemanal.parse(horario)).toEqual(horario);
    expect(esquemaHorarioSemanal.parse([])).toEqual([]);
    expect(esquemaHorarioSemanal.safeParse([{ dia_semana: 0, tramos: [] }]).success).toBe(true);
    expect(esquemaHorarioSemanal.safeParse([{ dia_semana: 6, tramos: [tramo, { abre: "14:00", cierra: "20:00" }] }]).success).toBe(true);
  });

  it.each(["9:00", "24:00", "10:60", "10:01", "09:00:00", "-1:00", "10:99", 9, null])("rechaza hora %j", (abre) => {
    expect(esquemaTramo.safeParse({ abre, cierra: "20:00" }).success).toBe(false);
  });

  it("rechaza tramos vacíos, invertidos, desordenados y solapados", () => {
    for (const cierra of ["09:30", "09:00"]) {
      expect(esquemaTramo.safeParse({ ...tramo, cierra }).success).toBe(false);
    }
    for (const tramos of [[tramo, { abre: "13:55", cierra: "15:00" }], [{ abre: "16:00", cierra: "20:00" }, tramo]]) {
      expect(esquemaHorarioSemanal.safeParse([{ dia_semana: 2, tramos }]).success).toBe(false);
      expect(esquemaDatosExcepcion.safeParse({ ...excepcion, tramos }).success).toBe(false);
    }
  });

  it.each([-1, 7, 1.5, "2", null])("rechaza día %j", (dia_semana) => {
    expect(esquemaHorarioSemanal.safeParse([{ dia_semana, tramos: [] }]).success).toBe(false);
  });

  it("rechaza días repetidos aunque los tramos estén separados", () => {
    expect(esquemaHorarioSemanal.safeParse([...horario, { dia_semana: 2, tramos: [] }]).success).toBe(false);
  });

  it.each(["2026-02-29", "2026-04-31", "01/07/2026", "2026-7-1", "2026-07-01T00:00:00Z"])("rechaza fecha %s", (fecha) => {
    expect(esquemaDatosTemporada.safeParse({ ...temporada, desde: fecha }).success).toBe(false);
    expect(esquemaDatosTemporada.safeParse({ ...temporada, hasta: fecha }).success).toBe(false);
    expect(esquemaDatosExcepcion.safeParse({ ...excepcion, fecha }).success).toBe(false);
  });

  it("admite bisiestos y deja el orden del rango al servicio (409)", () => {
    expect(esquemaDatosTemporada.safeParse({ ...temporada, desde: "2028-02-29" }).success).toBe(true);
    expect(esquemaDatosTemporada.safeParse({ ...temporada, desde: "2026-09-01" }).success).toBe(true);
  });

  it("exige coherencia entre cierre y tramos también en respuestas", () => {
    expect(esquemaDatosExcepcion.safeParse({ ...excepcion, cerrado: true }).success).toBe(false);
    expect(esquemaExcepcion.safeParse({ ...excepcion, id: 1, cerrado: true }).success).toBe(false);
    expect(esquemaDatosExcepcion.safeParse({ ...excepcion, tramos: [] }).success).toBe(false);
    expect(esquemaExcepcion.safeParse({ ...excepcion, id: 1, cerrado: true, tramos: [] }).success).toBe(true);
  });

  it("normaliza textos y respeta los límites de la BD", () => {
    expect(esquemaDatosTemporada.parse({ ...temporada, nombre: " Verano " }).nombre).toBe("Verano");
    expect(esquemaDatosExcepcion.parse({ ...excepcion, motivo: " " }).motivo).toBeNull();
    expect(esquemaDatosExcepcion.parse({ ...excepcion, motivo: " Bodas " }).motivo).toBe("Bodas");
    expect(esquemaDatosExcepcion.safeParse({ ...excepcion, motivo: null }).success).toBe(true);
    expect(esquemaDatosExcepcion.safeParse({ ...excepcion, motivo: "a".repeat(201) }).success).toBe(false);
    expect(esquemaDatosTemporada.safeParse({ ...temporada, nombre: "a".repeat(61) }).success).toBe(false);
    expect(esquemaLocal.safeParse({ nombre: "a".repeat(121), zona_horaria: "Europe/Madrid" }).success).toBe(false);
    expect(esquemaLocal.safeParse({ nombre: " ", zona_horaria: "Europe/Madrid" }).success).toBe(false);
    expect(esquemaDatosTemporada.safeParse({ ...temporada, activa: 1 }).success).toBe(false);
  });

  it("valida los contratos completos sin coerción", () => {
    const completa = { ...temporada, id: 1, horario };
    expect(esquemaTemporada.parse(completa)).toEqual(completa);
    expect(esquemaHorarioCompleto.parse({ general: horario, temporadas: [completa], excepciones: [{ ...excepcion, id: 1 }] }).general).toEqual(horario);
    expect(esquemaLocal.parse({ nombre: " Peluquería ", zona_horaria: "Europe/Madrid" }).nombre).toBe("Peluquería");
    expect(esquemaDiaResuelto.safeParse({ fecha: excepcion.fecha, tramos: [], origen: "general", motivo: null, temporada_nombre: null }).success).toBe(true);
    expect(esquemaDiaResuelto.safeParse({ fecha: excepcion.fecha, tramos: [], origen: "otro", motivo: null, temporada_nombre: null }).success).toBe(false);
    expect(esquemaTemporada.safeParse({ ...completa, id: "1" }).success).toBe(false);
  });
});
