import { afterEach, describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { esquemaEmpleadoResumen } from "@peluqueria/compartido";
import {
  actualizarEmpleado, bloquearEmpleado, buscarEmpleadoPorId, buscarEmpleadoPorUsuario,
  cambiarActividadEmpleado, consultarEmpleados, insertarEmpleado,
} from "./empleadoRepository";
import { ErrorConflicto } from "../errores";

const dobles = vi.hoisted(() => ({ pool: vi.fn(), conexion: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: dobles.pool } }));
afterEach(() => vi.resetAllMocks());
const conexion = { query: dobles.conexion } as unknown as Connection;
const fila = { id: 1, nombre: "Ana", telefono: null, email: null, activo: 1, usuario_id: 5, usuario_nombre: "Ana demo", contrato_vigente: "plantilla", num_competencias: "2" };

describe("repositorio de empleados sin BD", () => {
  it("traduce el resumen sin filtrar campos internos y ordena por nombre", async () => {
    dobles.pool.mockResolvedValue([[{ ...fila, creado_en: new Date() }], []]);
    const lista = await consultarEmpleados(false);
    expect(lista).toEqual([{ id: 1, nombre: "Ana", telefono: null, email: null, activo: true, contrato_vigente: "plantilla", num_competencias: 2 }]);
    expect(esquemaEmpleadoResumen.safeParse(lista[0]).success).toBe(true);
    expect(dobles.pool).toHaveBeenCalledWith(expect.stringContaining("ORDER BY e.nombre, e.id"), [false]);
    expect(dobles.pool.mock.calls[0][0]).toContain("e.activo = TRUE");
  });

  it("incluye inactivos cuando se pide y devuelve el usuario solo en la ficha", async () => {
    dobles.pool.mockResolvedValue([[{ ...fila, activo: 0 }], []]);
    await consultarEmpleados(true);
    expect(dobles.pool).toHaveBeenLastCalledWith(expect.any(String), [true]);
    await expect(buscarEmpleadoPorId(1)).resolves.toMatchObject({ activo: false, usuario_id: 5, usuario_nombre: "Ana demo" });
  });

  it("devuelve null sin empleado", async () => {
    dobles.pool.mockResolvedValue([[], []]);
    await expect(buscarEmpleadoPorId(99)).resolves.toBeNull();
    dobles.conexion.mockResolvedValue([[], []]);
    await expect(bloquearEmpleado(99, conexion)).resolves.toBeNull();
    await expect(buscarEmpleadoPorUsuario(99, conexion)).resolves.toBeNull();
  });

  it("bloquea el empleado y consulta enlaces por la conexión recibida", async () => {
    dobles.conexion.mockResolvedValue([[fila], []]);
    await expect(bloquearEmpleado(1, conexion)).resolves.toEqual({ id: 1, activo: true, usuario_id: 5 });
    expect(dobles.conexion).toHaveBeenCalledWith(expect.stringContaining("FOR UPDATE"), [1]);
    await expect(buscarEmpleadoPorUsuario(5, conexion)).resolves.toBe(1);
    expect(dobles.conexion).toHaveBeenLastCalledWith(expect.stringContaining("usuario_id = ? FOR UPDATE"), [5]);
    expect(dobles.pool).not.toHaveBeenCalled();
  });

  it("parametriza escrituras y desactiva sin borrar el historial", async () => {
    dobles.conexion.mockResolvedValue([{ insertId: 7 }, []]);
    const datos = { nombre: "O'Connor", telefono: null, email: null, usuario_id: null };
    await expect(insertarEmpleado(datos, conexion)).resolves.toBe(7);
    expect(dobles.conexion).toHaveBeenLastCalledWith(expect.stringContaining("VALUES (?, ?, ?, ?)"), ["O'Connor", null, null, null]);
    await actualizarEmpleado(7, datos, conexion);
    expect(dobles.conexion).toHaveBeenLastCalledWith(expect.stringContaining("UPDATE empleado SET"), ["O'Connor", null, null, null, 7]);
    await cambiarActividadEmpleado(7, false, conexion);
    expect(dobles.conexion).toHaveBeenLastCalledWith("UPDATE empleado SET activo = ? WHERE id = ?", [false, 7]);
    expect(dobles.pool).not.toHaveBeenCalled();
  });

  it("traduce UNIQUE a 409 tanto en alta como en edición y propaga otros fallos", async () => {
    const datos = { nombre: "Ana", telefono: null, email: null, usuario_id: 5 };
    dobles.conexion.mockRejectedValue({ code: "ER_DUP_ENTRY" });
    await expect(insertarEmpleado(datos, conexion)).rejects.toThrow(ErrorConflicto);
    await expect(actualizarEmpleado(1, datos, conexion)).rejects.toThrow(ErrorConflicto);
    const fallo = new Error("Fallo de conexión");
    dobles.conexion.mockRejectedValue(fallo);
    await expect(insertarEmpleado(datos, conexion)).rejects.toBe(fallo);
    await expect(actualizarEmpleado(1, datos, conexion)).rejects.toBe(fallo);
  });
});
