import { DIAS, FRANJAS_POR_HORA, HORA_APERTURA } from "./constantes";

type Props = {
  hora: number;
};

function FilaHora({ hora }: Props) {
  const filaInicio = (hora - HORA_APERTURA) * FRANJAS_POR_HORA + 2;

  return (
    <>
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
            // dia 0 -> col 2
            gridColumn: d + 2,
            gridRow: `${filaInicio} / span ${FRANJAS_POR_HORA}`,
            // 60 / 5 = 12 franjas
          }}
        />
      ))}
    </>
  );
}

export default FilaHora;