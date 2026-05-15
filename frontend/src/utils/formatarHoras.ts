export function formatarHorasMinutos(valor?: string | null) {
  if (!valor) {
    return "0h e 0m";
  }

  const [horas = "0", minutos = "0"] = valor.split(":");
  const horasNumero = Number(horas);
  const minutosNumero = Number(minutos);

  return `${Number.isNaN(horasNumero) ? 0 : horasNumero}h e ${Number.isNaN(minutosNumero) ? 0 : minutosNumero}m`;
}
