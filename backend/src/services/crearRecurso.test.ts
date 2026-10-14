import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";
import { crearRecurso } from "./crearRecurso";

const dobles = vi.hoisted(() => ({ buscar: vi.fn(), insertar: vi.fn() }));
vi.mock("../repositories/buscarTipoRecurso", () => ({ buscarTipoRecurso: dobles.buscar }));
vi.mock("../repositories/insertarRecurso", () => ({ insertarRecurso: dobles.insertar }));
afterEach(() => vi.resetAllMocks());
const datos = { nombre: "Butaca 1", tipo_recurso_id: 1, fuera_de_servicio: false, motivo: null, activo: true };

describe("crear un recurso", () => {
  it("crea con un tipo activo y conserva sus datos", async () => {
    dobles.buscar.mockResolvedValue({ id: 1, activo: true });
    dobles.insertar.mockResolvedValue(4);
    await expect(crearRecurso(datos)).resolves.toBe(4);
    expect(dobles.insertar).toHaveBeenCalledWith(datos);
  });
  it("rechaza un tipo inactivo incluso al crear un recurso dado de baja", async () => {
    dobles.buscar.mockResolvedValue({ id: 1, activo: false });
    await expect(crearRecurso({ ...datos, activo: false })).rejects.toThrow(ErrorConflicto);
    expect(dobles.insertar).not.toHaveBeenCalled();
  });
  it("rechaza un tipo inexistente", async () => {
    dobles.buscar.mockResolvedValue(null);
    await expect(crearRecurso(datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.insertar).not.toHaveBeenCalled();
  });
});
