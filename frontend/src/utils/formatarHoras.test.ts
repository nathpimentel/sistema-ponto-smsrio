import { describe, it, expect } from "vitest";
import { formatarDuracao, formatarHorario, formatarISOParaHorario } from "./formatarHoras";

// ── formatarDuracao ────────────────────────────────────────────────────────

describe("formatarDuracao", () => {
  it("formata horas e minutos corretamente", () => {
    expect(formatarDuracao("02:30")).toBe("2h e 30m");
  });

  it("formata zero horas com só minutos", () => {
    expect(formatarDuracao("00:45")).toBe("0h e 45m");
  });

  it("formata valor nulo como 0h e 0m", () => {
    expect(formatarDuracao(null)).toBe("0h e 0m");
    expect(formatarDuracao(undefined)).toBe("0h e 0m");
    expect(formatarDuracao("")).toBe("0h e 0m");
  });

  it("formata 00:00 como 0h e 0m", () => {
    expect(formatarDuracao("00:00")).toBe("0h e 0m");
  });

  it("formata horas acima de 9 sem truncar", () => {
    expect(formatarDuracao("10:05")).toBe("10h e 5m");
  });
});

// ── formatarHorario ────────────────────────────────────────────────────────

describe("formatarHorario", () => {
  it("retorna o valor sem alteração", () => {
    expect(formatarHorario("08:30")).toBe("08:30");
  });

  it("retorna traços quando valor ausente", () => {
    expect(formatarHorario(null)).toBe("--:--");
    expect(formatarHorario(undefined)).toBe("--:--");
    expect(formatarHorario("")).toBe("--:--");
  });
});

// ── formatarISOParaHorario ─────────────────────────────────────────────────

describe("formatarISOParaHorario", () => {
  it("retorna traços para valor ausente", () => {
    expect(formatarISOParaHorario(null)).toBe("--:--");
    expect(formatarISOParaHorario(undefined)).toBe("--:--");
  });

  it("converte ISO 8601 para HH:MM", () => {
    // 12:00 UTC → horário local do test runner; só verificamos o formato
    const resultado = formatarISOParaHorario("2025-06-10T12:00:00.000Z");
    expect(resultado).toMatch(/^\d{2}:\d{2}$/);
  });

  it("retorna traços para string inválida", () => {
    expect(formatarISOParaHorario("não-é-data")).toBe("--:--");
  });
});
