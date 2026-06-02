/**
 * Formata "HH:mm" (duração) → "2h e 30m"
 * Usado para exibir horas trabalhadas.
 */
export function formatarDuracao(valor?: string | null): string {
  if (!valor) {
    return "0h e 0m";
  }

  const [horas = "0", minutos = "0"] = valor.split(":");
  const h = Number(horas);
  const m = Number(minutos);

  return `${Number.isNaN(h) ? 0 : h}h e ${Number.isNaN(m) ? 0 : m}m`;
}

/**
 * Formata "HH:mm" (horário já convertido pelo backend) → "08:30"
 * Não interpreta como duração.
 */
export function formatarHorario(valor?: string | null): string {
  if (!valor) return "--:--";
  return valor;
}

/**
 * Formata string ISO 8601 UTC para horário local do browser.
 * Usado quando o backend retorna timestamps completos (ex: inicioExpediente).
 */
export function formatarISOParaHorario(iso?: string | null): string {
  if (!iso) return "--:--";

  try {
    return new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "--:--";
  }
}

/** @deprecated use formatarDuracao para horas trabalhadas */
export function formatarHorasMinutos(valor?: string | null): string {
  return formatarDuracao(valor);
}
