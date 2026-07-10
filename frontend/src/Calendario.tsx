import { useEffect, useState } from "react";
import "./Calendario.css";

const HORA_APERTURA = 9;
const HORA_CIERRE = 20;
const MINUTOS_FRANJA = 5;

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const FRANJAS = ((HORA_CIERRE - HORA_APERTURA) * 60) / MINUTOS_FRANJA;

type Cita = {
  id: number;
  inicio: string;
  fin: string;
  estado: "reservada" | "cancelada" | "completada";
  cliente_nombre: string;
  servicio_nombre: string;
};

// getDay(): 0=domingo, 1=lunes... 6=sábado
// columnas:  domingo=8, lunes=2 ... sábado=7
function columnaDeDia(fecha: Date): number {
  const dia = fecha.getDay();
  return dia === 0 ? 8 : dia + 1;
}

// Cuántas franjas de 30 min desde la apertura, + 2 por la fila de cabecera
function filaDeHora(fecha: Date): number {
  const minutosDesdeApertura =
    (fecha.getHours() - HORA_APERTURA) * 60 + fecha.getMinutes();
  return minutosDesdeApertura / MINUTOS_FRANJA + 2;
}

function Calendario() {
  const [citas, setCitas] = useState<Cita[]>([]);

  useEffect(() => {
    fetch("/api/citas")
      .then((res) => res.json())
      .then(setCitas)
      .catch(() => setCitas([]));
  }, []);

  const franjas = Array.from({ length: FRANJAS }, (_, i) => i);

  return (
    <div className="calendario">
      <div className="esquina" />

      {DIAS.map((dia, i) => (
        <div key={dia} className="cabecera-dia" style={{ gridColumn: i + 2 }}>
          {dia}
        </div>
      ))}

       {franjas.map((i) => {
        const minutosDesdeApertura = i * MINUTOS_FRANJA;
        const enPunto = minutosDesdeApertura % 60 === 0;
        const hora = HORA_APERTURA + minutosDesdeApertura / 60;

        if (!enPunto) return null;

        return (
          <div key={i} style={{ display: "contents" }}>
            <div className="etiqueta-hora" style={{ gridRow: `${i + 2} / span 12` }}>
              {hora}:00
            </div>

            {DIAS.map((dia, d) => (
              <div
                key={dia}
                className="celda"
                style={{ gridColumn: d + 2, gridRow: `${i + 2} / span 12` }}
              />
            ))}
          </div>
        );
      })}

      {citas.map((cita) => {
        const inicio = new Date(cita.inicio);
        const fin = new Date(cita.fin);

        return (
          <div
            key={cita.id}
            className={`cita ${cita.estado}`}
            style={{
              gridColumn: columnaDeDia(inicio),
              gridRow: `${filaDeHora(inicio)} / ${filaDeHora(fin)}`,
            }}
          >
            <div className="cita-cliente">{cita.cliente_nombre}</div>
            <div className="cita-servicio">{cita.servicio_nombre}</div>
          </div>
        );
      })}
    </div>
  );
}

export default Calendario;