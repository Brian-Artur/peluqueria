import { DIAS } from "./constantes";

function CabeceraDias() {
  return (
    <>
      <div className="esquina" />
      {DIAS.map((dia, i) => (
        <div key={dia} className="cabecera-dia" style={{ gridColumn: i + 2 }}>
          {dia}
        </div>
      ))}
    </>
  );
}

export default CabeceraDias;