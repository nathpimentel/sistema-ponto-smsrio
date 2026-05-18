import jsPDF from "jspdf";

import logoPrefeitura from "../assets/prefeitura-logo.png";
import { formatarHorasMinutos } from "./formatarHoras";

interface Registro {
  nome?: string;
  curso?: string;
  unidade?: string;
  cargaHorariaSemanal?: number | null;
  data: string;
  entrada: string | null;
  saida: string | null;
  tempoTrabalhado?: string | null;
}

interface BolsistaRelatorio {
  nome: string;
  curso: string;
  unidade: string;
  cargaSemanal: string;
  registros: Registro[];
}

export async function gerarPdfPresenca(
  nome: string,
  mes: number,
  ano: number,
  registros: Registro[]
) {
  const pdf = new jsPDF("p", "mm", "a4");
  const bolsistas = agruparRegistrosPorBolsista(
    registros,
    nome
  );

  bolsistas.forEach((bolsista, index) => {
    if (index > 0) {
      pdf.addPage();
    }

    desenharPagina(
      pdf,
      bolsista,
      mes,
      ano
    );
  });

  const nomeArquivo =
    bolsistas.length === 1
      ? bolsistas[0].nome
      : "bolsistas";

  pdf.save(`relatorio-ponto-${nomeArquivo}.pdf`);
}

function desenharPagina(
  pdf: jsPDF,
  bolsista: BolsistaRelatorio,
  mes: number,
  ano: number
) {
  const dataGeracao = new Date().toLocaleDateString("pt-BR");
  const totalHoras = formatarTotalHoras(bolsista.registros);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(25, 37, 55);

  pdf.addImage(
    logoPrefeitura,
    "PNG",
    14,
    12,
    52,
    19
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text(
    "Relatório Individual de Ponto",
    105,
    24,
    { align: "center" }
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(
    `Mês/Ano: ${mes.toString().padStart(2, "0")}/${ano}`,
    196,
    34,
    { align: "right" }
  );

  desenharBlocoDados(pdf, bolsista, dataGeracao);
  desenharTabelaRegistros(pdf, bolsista.registros);
  desenharRodapeAssinaturas(pdf, totalHoras, dataGeracao);
}

function desenharBlocoDados(
  pdf: jsPDF,
  bolsista: BolsistaRelatorio,
  dataGeracao: string
) {
  pdf.setDrawColor(192, 199, 208);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(14, 42, 182, 42, 2, 2);

  const linhas = [
    ["Nome", bolsista.nome],
    ["Curso", bolsista.curso || "-"],
    ["Carga Horária Semanal", bolsista.cargaSemanal],
    ["Unidade/Orgão", bolsista.unidade || "-"],
    ["Data de Geração", dataGeracao]
  ];

  linhas.forEach(([label, valor], index) => {
    const y = 51 + index * 7;

    pdf.setFont("helvetica", "bold");
    pdf.text(`${label}:`, 20, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(valor, 62, y, { maxWidth: 128 });
  });
}

function desenharTabelaRegistros(
  pdf: jsPDF,
  registros: Registro[]
) {
  const inicioY = 96;
  const colunas = [
    { titulo: "Data", x: 18, largura: 38 },
    { titulo: "Entrada", x: 60, largura: 32 },
    { titulo: "Saída", x: 96, largura: 32 },
    { titulo: "Carga Horária", x: 132, largura: 44 }
  ];

  pdf.setFillColor(234, 239, 246);
  pdf.rect(14, inicioY, 182, 9, "F");
  pdf.setDrawColor(192, 199, 208);
  pdf.rect(14, inicioY, 182, 9);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);

  colunas.forEach(coluna => {
    pdf.text(coluna.titulo, coluna.x, inicioY + 6);
  });

  pdf.setFont("helvetica", "normal");

  if (registros.length === 0) {
    pdf.text(
      "Nenhum registro de ponto encontrado para o periodo.",
      18,
      inicioY + 18
    );

    return;
  }

  let y = inicioY + 9;

  registros.forEach((registro, index) => {
    if (y > 230) {
      pdf.addPage();
      y = 22;
    }

    if (index % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(14, y, 182, 8, "F");
    }

    pdf.setDrawColor(226, 232, 240);
    pdf.line(14, y + 8, 196, y + 8);

    pdf.text(registro.data, colunas[0].x, y + 5.5);
    pdf.text(
      registro.entrada ? formatarHorasMinutos(registro.entrada) : "-",
      colunas[1].x,
      y + 5.5
    );
    pdf.text(
      registro.saida ? formatarHorasMinutos(registro.saida) : "-",
      colunas[2].x,
      y + 5.5
    );
    pdf.text(
      horasDoRegistro(registro),
      colunas[3].x,
      y + 5.5
    );

    y += 8;
  });
}

function desenharRodapeAssinaturas(
  pdf: jsPDF,
  totalHoras: string,
  dataGeracao: string
) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(
    `Carga Horária Total: ${totalHoras}`,
    14,
    246
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Data: ${dataGeracao}`, 14, 254);

  pdf.line(18, 276, 86, 276);
  pdf.line(124, 276, 192, 276);
  pdf.text(
    "Assinatura do Estagiário",
    29,
    282
  );
  pdf.text(
    "Assinatura do Supervisor",
    135,
    282
  );
}

function agruparRegistrosPorBolsista(
  registros: Registro[],
  nomePadrao: string
) {
  const grupos = new Map<string, BolsistaRelatorio>();

  registros
    .filter(registro => registro.data)
    .sort((a, b) => {
      const nomeA = a.nome || nomePadrao;
      const nomeB = b.nome || nomePadrao;

      return nomeA.localeCompare(nomeB) ||
        dataParaTempo(a.data) - dataParaTempo(b.data);
    })
    .forEach(registro => {
      const nome = registro.nome || nomePadrao;

      if (!grupos.has(nome)) {
        grupos.set(nome, {
          nome,
          curso: registro.curso || "",
          unidade: registro.unidade || "",
          cargaSemanal: registro.cargaHorariaSemanal
            ? `${registro.cargaHorariaSemanal}H`
            : "30H",
          registros: []
        });
      }

      grupos.get(nome)!.registros.push(registro);
    });

  if (grupos.size === 0) {
    grupos.set(nomePadrao, {
      nome: nomePadrao,
      curso: "",
      unidade: "",
      cargaSemanal: "30H",
      registros: []
    });
  }

  return Array.from(grupos.values());
}

function dataParaTempo(data: string) {
  const [dia, mes, ano] = data
    .split("/")
    .map(Number);

  return new Date(ano, mes - 1, dia).getTime();
}

function formatarTotalHoras(registros: Registro[]) {
  const totalMinutos = registros.reduce(
    (total, registro) =>
      total + minutosDoRegistro(registro),
    0
  );
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  return formatarHorasMinutos(
    `${horas.toString().padStart(2, "0")}:${minutos
      .toString()
      .padStart(2, "0")}`
  );
}

function horasDoRegistro(registro: Registro) {
  const minutos = minutosDoRegistro(registro);
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  return formatarHorasMinutos(
    `${horas.toString().padStart(2, "0")}:${minutosRestantes
      .toString()
      .padStart(2, "0")}`
  );
}

function minutosDoRegistro(registro: Registro) {
  if (registro.tempoTrabalhado) {
    const [horas, minutos] = registro.tempoTrabalhado
      .split(":")
      .map(Number);

    return horas * 60 + minutos;
  }

  if (!registro.entrada || !registro.saida) {
    return 0;
  }

  const [entradaHoras, entradaMinutos] = registro.entrada
    .split(":")
    .map(Number);
  const [saidaHoras, saidaMinutos] = registro.saida
    .split(":")
    .map(Number);
  const entradaTotal = entradaHoras * 60 + entradaMinutos;
  const saidaTotal = saidaHoras * 60 + saidaMinutos;

  return Math.max(0, saidaTotal - entradaTotal);
}
