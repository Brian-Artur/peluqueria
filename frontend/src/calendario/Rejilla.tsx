import { DIAS, FRANJAS, FRANJAS_POR_HORA, HORA_APERTURA, MINUTOS_FRANJA } from "./constantes";

function Rejilla() {
  const franjas = Array.from({ length: FRANJAS }, (_, i) => i);

  return (
    <>
      {franjas.map((i) => {
        const minutosDesdeApertura = i * MINUTOS_FRANJA;
        const enPunto = minutosDesdeApertura % 60 === 0;

        if (!enPunto) return null;

        const hora = HORA_APERTURA + minutosDesdeApertura / 60;
        const filaInicio = i + 2;

        return (
          <div key={i} style={{ display: "contents" }}>
            <div
              className="etiqueta-hora"
              style={{ gridRow: `${filaInicio} / span ${FRANJAS_POR_HORA}` }}
            >
              {hora}:00
            </div>

            {DIAS.map((dia, d) => (
              <div
                key={dia}
                className="celda"
                style={{
                  gridColumn: d + 2,
                  gridRow: `${filaInicio} / span ${FRANJAS_POR_HORA}`,
                }}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

export default Rejilla;