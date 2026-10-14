import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { editarTemporada } from "./editarTemporada";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({
  conectar: vi.fn(), bloquear: vi.fn(), consultar: vi.fn(), actualizar: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/bloquearConfiguracionHorario", () => ({ bloquearConfiguracionHorario: dobles.bloquear }));
vi.mock("../repositories/consultarTemporadas", () => ({ consultarTemporadas: dobles.consultar }));
vi.mock("../repositories/actualizarTemporada", () => ({ actualizarTemporada: dobles.actualizar }));
const datos = { nombre: "Verano", desde: "2026-07-01", hasta: "2026-08-31", activa: true };
beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.bloquear.mockResolvedValue(true);
  dobles.consultar.mockResolvedValue([{ ...datos, id: 2, horario: [] }]);
});
afterEach(() => vi.resetAllMocks());

describe("editar temporada", () => {
  it("permite mantener su rango y actualiza los datos sin modificar el horario", async () => {
    await editarTemporada(2, datos);
    expect(dobles.bloquear.mock.invocationCallOrder[0]).toBeLessThan(dobles.consultar.mock.invocationCallOrder[0]!);
    expect(dobles.consultar).toHaveBeenCalledWith(dobles.conexion, true);
    expect(dobles.actualizar).toHaveBeenCalledWith(2, datos, dobles.conexion);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
  it("al activar comprueba los demás rangos y da 409 si se solapan", async () => {
    dobles.consultar.mockResolvedValue([{ ...datos, id: 2, activa: false, horario: [] }, { ...datos, id: 3, horario: [] }]);
    await expect(editarTemporada(2, datos)).rejects.toThrow(ErrorConflicto);
    expect(dobles.actualizar).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
  });
  it("admite desactivar aunque haya otro rango activo", async () => {
    dobles.consultar.mockResolvedValue([{ ...datos, id: 2, horario: [] }, { ...datos, id: 3, horario: [] }]);
    await editarTemporada(2, { ...datos, activa: false });
    expect(dobles.actualizar).toHaveBeenCalledWith(2, { ...datos, activa: false }, dobles.conexion);
  });
  it("rechaza el rango invertido con 409", async () => {
    await expect(editarTemporada(2, { ...datos, hasta: "2026-06-30" })).rejects.toThrow(ErrorConflicto);
    expect(dobles.actualizar).not.toHaveBeenCalled();
  });
  it("da 404 si no existe la temporada", async () => {
    await expect(editarTemporada(99, datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.actualizar).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
  });
  it("revierte un fallo de escritura y libera la conexión", async () => {
    const error = new Error("Fallo de escritura");
    dobles.actualizar.mockRejectedValue(error);
    await expect(editarTemporada(2, datos)).rejects.toBe(error);
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
});
