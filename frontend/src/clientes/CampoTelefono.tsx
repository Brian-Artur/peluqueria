import type { ReactElement } from "react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import type { CountryCode } from "@peluqueria/compartido";
import styles from "./CampoTelefono.module.css";

type Props = {
  id: string;
  pais: CountryCode;
  numero: string;
  onCambiarPais: (pais: CountryCode) => void;
  onCambiarNumero: (numero: string) => void;
  error?: string;
};

const nombres = new Intl.DisplayNames(["es"], { type: "region" });
const paises = getCountries().map((pais) => ({
  pais,
  nombre: nombres.of(pais) ?? pais,
  prefijo: getCountryCallingCode(pais),
}));
paises.sort((a, b) => {
  if (a.pais === "ES") return -1;
  if (b.pais === "ES") return 1;
  return a.nombre.localeCompare(b.nombre, "es");
});

function CampoTelefono({ id, pais, numero, onCambiarPais, onCambiarNumero, error }: Props): ReactElement {
  return (
    <div className={styles.campoTelefono}>
      <select
        className={styles.campo}
        aria-label="País y prefijo del teléfono"
        value={pais}
        onChange={(evento) => onCambiarPais(evento.target.value as CountryCode)}
      >
        {paises.map((opcion) => (
          <option key={opcion.pais} value={opcion.pais}>{opcion.nombre} +{opcion.prefijo}</option>
        ))}
      </select>
      <input
        id={id}
        className={styles.campo}
        type="tel"
        value={numero}
        onChange={(evento) => onCambiarNumero(evento.target.value)}
        autoComplete="tel-national"
        aria-invalid={error !== undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </div>
  );
}

export default CampoTelefono;
