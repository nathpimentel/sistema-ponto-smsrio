export function formatarHorasMinutos(valor?: string | null) {
  if (!valor) {
    return "0h e 0m";
  }

  const [horas = "0", minutos = "0"] = valor.split(":");
  const horasNumero = Number(horas);
  const minutosNumero = Number(minutos);

  return `${Number.isNaN(horasNumero) ? 0 : horasNumero}h e ${Number.isNaN(minutosNumero) ? 0 : minutosNumero}m`;
}

export function formatarHorarioLocal(valor?: string | null) {
  if (!valor) {
    return "";
  }

  if (!valor.includes("T")) {
    return valor;
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatarDataPonto(valor?: string | null) {
  if (!valor) {
    return "";
  }

  const dataCivil = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dataCivil) {
    const [, ano, mes, dia] = dataCivil;
    return `${dia}/${mes}/${ano}`;
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return data.toLocaleDateString("pt-BR");
}
