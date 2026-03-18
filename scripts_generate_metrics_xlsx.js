/* eslint-disable @typescript-eslint/no-require-imports */
const ExcelJS = require("exceljs");

(async () => {
  const wb = new ExcelJS.Workbook();

  const p = wb.addWorksheet("Parametros");
  p.getCell("A1").value = "Parametro";
  p.getCell("B1").value = "Valor";
  p.getCell("A2").value = "Preco_mensal_CAD";
  p.getCell("B2").value = 16;
  p.getCell("A3").value = "Taxa_gateway_percentual";
  p.getCell("B3").value = 0.04;
  p.getCell("A4").value = "Taxa_gateway_fixa_CAD";
  p.getCell("B4").value = 0.3;
  p.getCell("A5").value = "Custo_variavel_por_assinante_CAD";
  p.getCell("B5").value = 1.5;
  p.getCell("A6").value = "Custo_fixo_mensal_CAD";
  p.getCell("B6").value = 120;
  p.getCell("A7").value = "Churn_mensal_esperado";
  p.getCell("B7").value = 0.06;
  p.getCell("A8").value = "Novos_assinantes_meta_mes";
  p.getCell("B8").value = 20;
  p.getCell("A10").value = "Receita_liquida_por_assinante";
  p.getCell("B10").value = { formula: "B2-(B2*B3+B4)" };
  p.getCell("A11").value = "Margem_contribuicao_por_assinante";
  p.getCell("B11").value = { formula: "B10-B5" };
  p.getCell("A12").value = "Assinantes_break_even";
  p.getCell("B12").value = { formula: "IFERROR(ROUNDUP(B6/B11,0),0)" };
  p.columns = [{ width: 42 }, { width: 22 }];

  const proj = wb.addWorksheet("Projecao_12_meses");
  proj.addRow([
    "Mes",
    "Assinantes_inicio",
    "Novos_mes",
    "Churn_percentual",
    "Cancelados_mes",
    "Assinantes_fim",
    "MRR_bruto",
    "Receita_liquida_gateway",
    "Custo_variavel_total",
    "Custo_fixo",
    "Lucro_operacional",
    "Churn_real",
  ]);

  proj.getCell("A2").value = 1;
  proj.getCell("B2").value = 0;
  proj.getCell("C2").value = { formula: "Parametros!B8" };
  proj.getCell("D2").value = { formula: "Parametros!B7" };
  proj.getCell("E2").value = { formula: "ROUND(B2*D2,0)" };
  proj.getCell("F2").value = { formula: "B2+C2-E2" };
  proj.getCell("G2").value = { formula: "F2*Parametros!B2" };
  proj.getCell("H2").value = { formula: "F2*Parametros!B10" };
  proj.getCell("I2").value = { formula: "F2*Parametros!B5" };
  proj.getCell("J2").value = { formula: "Parametros!B6" };
  proj.getCell("K2").value = { formula: "H2-I2-J2" };
  proj.getCell("L2").value = { formula: "IFERROR(E2/B2,0)" };

  for (let r = 3; r <= 13; r++) {
    const prev = r - 1;
    proj.getCell(`A${r}`).value = { formula: `A${prev}+1` };
    proj.getCell(`B${r}`).value = { formula: `F${prev}` };
    proj.getCell(`C${r}`).value = { formula: "Parametros!B8" };
    proj.getCell(`D${r}`).value = { formula: "Parametros!B7" };
    proj.getCell(`E${r}`).value = { formula: `ROUND(B${r}*D${r},0)` };
    proj.getCell(`F${r}`).value = { formula: `B${r}+C${r}-E${r}` };
    proj.getCell(`G${r}`).value = { formula: `F${r}*Parametros!B2` };
    proj.getCell(`H${r}`).value = { formula: `F${r}*Parametros!B10` };
    proj.getCell(`I${r}`).value = { formula: `F${r}*Parametros!B5` };
    proj.getCell(`J${r}`).value = { formula: "Parametros!B6" };
    proj.getCell(`K${r}`).value = { formula: `H${r}-I${r}-J${r}` };
    proj.getCell(`L${r}`).value = { formula: `IFERROR(E${r}/B${r},0)` };
  }

  proj.columns = [
    { width: 8 },
    { width: 18 },
    { width: 12 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 20 },
    { width: 18 },
    { width: 12 },
    { width: 16 },
    { width: 12 },
  ];

  const panel = wb.addWorksheet("Painel");
  panel.getCell("A1").value = "Indicador";
  panel.getCell("B1").value = "Valor";
  panel.getCell("A2").value = "Assinantes_atuais";
  panel.getCell("B2").value = {
    formula: 'LOOKUP(2,1/(Projecao_12_meses!A:A<>""),Projecao_12_meses!F:F)',
  };
  panel.getCell("A3").value = "MRR_bruto_atual";
  panel.getCell("B3").value = {
    formula: 'LOOKUP(2,1/(Projecao_12_meses!A:A<>""),Projecao_12_meses!G:G)',
  };
  panel.getCell("A4").value = "Receita_liquida_atual";
  panel.getCell("B4").value = {
    formula: 'LOOKUP(2,1/(Projecao_12_meses!A:A<>""),Projecao_12_meses!H:H)',
  };
  panel.getCell("A5").value = "Lucro_operacional_atual";
  panel.getCell("B5").value = {
    formula: 'LOOKUP(2,1/(Projecao_12_meses!A:A<>""),Projecao_12_meses!K:K)',
  };
  panel.getCell("A6").value = "Churn_real_atual";
  panel.getCell("B6").value = {
    formula: 'LOOKUP(2,1/(Projecao_12_meses!A:A<>""),Projecao_12_meses!L:L)',
  };
  panel.getCell("A7").value = "Break_even_assinantes";
  panel.getCell("B7").value = { formula: "Parametros!B12" };
  panel.getCell("A9").value = "LTV_meses";
  panel.getCell("B9").value = { formula: "IFERROR(1/Parametros!B7,0)" };
  panel.getCell("A10").value = "LTV_valor_aprox";
  panel.getCell("B10").value = { formula: "Parametros!B11*B9" };
  panel.getCell("A11").value = "CAC_max_payback_3_meses";
  panel.getCell("B11").value = { formula: "Parametros!B11*3" };
  panel.columns = [{ width: 34 }, { width: 22 }];

  const currencyFmt = "[$$-409]#,##0.00";
  const percentFmt = "0.00%";
  ["B2", "B4", "B5", "B6", "B10", "B11"].forEach((c) => (p.getCell(c).numFmt = currencyFmt));
  ["B3", "B7"].forEach((c) => (p.getCell(c).numFmt = percentFmt));
  for (let r = 2; r <= 13; r++) {
    proj.getCell(`D${r}`).numFmt = percentFmt;
    proj.getCell(`L${r}`).numFmt = percentFmt;
    ["G", "H", "I", "J", "K"].forEach((col) => (proj.getCell(`${col}${r}`).numFmt = currencyFmt));
  }
  ["B3", "B4", "B5", "B10", "B11"].forEach((c) => (panel.getCell(c).numFmt = currencyFmt));
  panel.getCell("B6").numFmt = percentFmt;

  for (const sheet of [p, proj, panel]) {
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  await wb.xlsx.writeFile("AuraFlow_Metrics_Model.xlsx");
  console.log("created AuraFlow_Metrics_Model.xlsx");
})();
