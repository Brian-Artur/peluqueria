import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export type { CountryCode } from "libphonenumber-js";

export function normalizarTelefono(numero: string, pais: CountryCode): string | null {
  // Evita extraer un número válido de un texto que contiene otros datos.
  const telefono = parsePhoneNumberFromString(numero, { defaultCountry: pais, extract: false });
  if (!telefono?.isValid()) return null;
  return telefono.number;
}

export function formatearTelefono(e164: string): string {
  const telefono = parsePhoneNumberFromString(e164, { extract: false });
  if (!telefono) return e164;

  if (telefono.country === "ES" && telefono.nationalNumber.length === 9) {
    // En España se usan tres grupos de tres, frente al agrupado de la librería.
    const nacional = telefono.nationalNumber;
    return `+34 ${nacional.slice(0, 3)} ${nacional.slice(3, 6)} ${nacional.slice(6)}`;
  }
  return telefono.formatInternational();
}

export function separarTelefono(e164: string): { pais: CountryCode; nacional: string } {
  const telefono = parsePhoneNumberFromString(e164, { extract: false });
  if (!telefono?.country) return { pais: "ES", nacional: e164 };
  return { pais: telefono.country, nacional: telefono.nationalNumber };
}
