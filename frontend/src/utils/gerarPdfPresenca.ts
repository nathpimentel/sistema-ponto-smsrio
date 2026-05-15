import jsPDF from "jspdf";

import template from "../assets/frequencia.jpg";

interface Registro {
  data: string;
  entrada: string;
  saida: string;
}

export async function gerarPdfPresenca(
  nome: string,
  mes: number,
  ano: number,
  registros: Registro[]
) {

  const pdf = new jsPDF("p", "mm", "a4");

  // TEMPLATE

  pdf.addImage(
    template,
    "JPEG",
    0,
    0,
    210,
    297
  );

  pdf.setFont("helvetica");

  pdf.setFontSize(10);

  // NOME

  pdf.text(
    nome.toUpperCase(),
    40,
48
  );

  // MÊS/ANO

  pdf.text(
  `${mes.toString().padStart(2, "0")}/${ano}`,
  101,
  73
);

  // POSIÇÃO INICIAL TABELA

  let y = 95;

const rowHeight = 4.85;

  const diasNoMes =
    new Date(ano, mes, 0).getDate();

  for (let dia = 1; dia <= diasNoMes; dia++) {

    const dataFormatada =
      `${dia.toString().padStart(2, "0")}/${mes.toString().padStart(2, "0")}/${ano}`;

    const registro =
      registros.find(r =>
        r.data === dataFormatada
      );

    const dataObj =
      new Date(ano, mes - 1, dia);

    const diaSemana =
      dataObj.getDay();

    // DIA

    pdf.text(
      dia.toString(),
      15,
      y
    );

    // ENTRADA

    if (registro?.entrada) {

      pdf.text(
        registro.entrada,
        52,
        y
      );
    }

    // SAÍDA

    if (registro?.saida) {

      pdf.text(
        registro.saida,
        78,
        y
      );
    }

    // OBSERVAÇÕES

    if (diaSemana === 0) {

      pdf.text(
        "DOMINGO",
        125,
        y
      );

    } else if (diaSemana === 6) {

      pdf.text(
        "SÁBADO",
        122,
        y
      );
    }

    y += rowHeight;
  }

  // CARGA HORÁRIA TOTAL

  pdf.text(
    "30H",
    170,
257
  );

  pdf.save(
    `ficha-presenca-${nome}.pdf`
  );
}