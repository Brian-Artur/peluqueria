import type { Seleccion } from "../tipos";

type Props = {
  seleccion: Seleccion;
  onCerrar: () => void;
};

function Panel({ seleccion, onCerrar }: Props) {
  return (
    <div className="panel">
      <button onClick={onCerrar}>Cerrar</button>

      {seleccion.tipo === "hueco" && (
        <p>Nueva cita: {seleccion.inicio.toLocaleString("es-ES")}</p>
      )}
    </div>
  );
}

export default Panel;