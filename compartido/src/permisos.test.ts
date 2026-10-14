import { describe, expect, it } from "vitest";
import { esquemaRol, type Rol } from "./usuario";
import { esquemaPermiso, rolesPorPermiso, puede } from "./permisos";

describe("la tabla completa de roles y permisos", () => {
  // Orden: ver citas, gestionar citas, completar citas, ver clientes,
  // gestionar clientes, gestionar servicios, gestionar usuarios, cambiar la propia contraseña,
  // ver empleados, gestionar empleados, ver rendimiento y gestionar rendimiento.
  const esperados: Record<Rol, boolean[]> = {
    admin: [true, true, true, true, true, true, true, true, true, true, true, true],
    encargado: [true, true, true, true, true, true, false, true, true, true, true, true],
    recepcion: [true, true, true, true, true, false, false, true, true, false, false, false],
    empleado: [true, false, true, true, false, false, false, true, false, false, false, false],
  };

  it("incluye exactamente los permisos definidos", () => {
    expect(Object.keys(rolesPorPermiso)).toEqual(esquemaPermiso.options);
  });

  for (const rol of esquemaRol.options) {
    esquemaPermiso.options.forEach((permiso, indice) => {
      it(`${rol}: ${permiso} = ${esperados[rol][indice]}`, () => {
        expect(puede(rol, permiso)).toBe(esperados[rol][indice]);
      });
    });
  }
});
