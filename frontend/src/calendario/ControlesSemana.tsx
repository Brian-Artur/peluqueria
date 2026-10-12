type Props = {
  lunesVisible: Date;
  onAnterior: () => void;
  onSiguiente: () => void;
};

function ControlesSemana({ lunesVisible, onAnterior, onSiguiente }: Props) {
  return (
    <div>
      <button onClick={onAnterior}>← Anterior</button>
      <span>{lunesVisible.toLocaleDateString("es-ES")}</span>
      <button onClick={onSiguiente}>Siguiente →</button>
    </div>
  );
}

export default ControlesSemana;