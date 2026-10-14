import { describe, expect, it } from "vitest";
import { añadirTramo, cambiarTramosDeDia, horasDeCincoMinutos } from "./semanaHorario";

describe("cambiarTramosDeDia", () => {
  it("normaliza de lunes a domingo sin heredar tramos en los días que faltan", () => {
    const martes = [{ abre: "10:00", cierra: "14:00" }];
    const domingo = [{ abre: "09:00", cierra: "13:00" }];
    const original = [{ dia_semana: 2, tramos: martes }];
    const semana = cambiarTramosDeDia(original, 0, domingo);
    expect(semana.map((dia) => dia.dia_semana)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(semana[0].tramos).toEqual([]);
    expect(semana[1].tramos).toEqual(martes);
    expect(semana[6].tramos).toEqual(domingo);
    expect(original).toEqual([{ dia_semana: 2, tramos: martes }]);
  });
  it("permite cerrar un día quitando todos los tramos", () => {
    const semana = cambiarTramosDeDia([{ dia_semana: 1, tramos: [{ abre: "09:00", cierra: "14:00" }] }], 1, []);
    expect(semana[0].tramos).toEqual([]);
  });
});

describe("horasDeCincoMinutos", () => {
  it("ofrece las 288 horas posibles, en orden, hasta las 23:55", () => {
    const horas = horasDeCincoMinutos();
    expect(horas).toHaveLength(288);
    expect(horas.slice(0, 3)).toEqual(["00:00", "00:05", "00:10"]);
    expect(horas.at(-1)).toBe("23:55");
    expect(new Set(horas).size).toBe(288);
  });
});

describe("añadirTramo", () => {
  it("propone un primer tramo y un segundo sin solaparse", () => {
    const original = [{ abre: "09:00", cierra: "14:00" }];
    expect(añadirTramo([])).toEqual(original);
    expect(añadirTramo(original)).toEqual([...original, { abre: "14:00", cierra: "15:00" }]);
    expect(original).toHaveLength(1);
  });
  it("limita el cierre a las 23:55", () => {
    expect(añadirTramo([{ abre: "22:00", cierra: "23:30" }]).at(-1)).toEqual({ abre: "23:30", cierra: "23:55" });
  });
});
