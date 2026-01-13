const API_BASE = "https://ce-infinity.onrender.com/api";

const $ = (sel) => document.querySelector(sel);

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "0%";
  return `${Number(value).toFixed(2)}%`;
}

function toIsoDate(dateObj) {
  return dateObj.toISOString().slice(0, 10);
}

function setDefaultDates() {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 30);
  $("#start-date").value = toIsoDate(start);
  $("#end-date").value = toIsoDate(today);
}

function renderTable(headers, rows) {
  if (!rows.length) {
    return '<p class="empty-state">Sem dados no período.</p>';
  }

  const thead = `
    <thead>
      <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
    </thead>
  `;
  const tbody = `
    <tbody>
      ${rows.map((cols) => `<tr>${cols.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}
    </tbody>
  `;
  return `<table class="metric-table">${thead}${tbody}</table>`;
}

function renderKpis(leads) {
  const grid = $("#kpi-grid");
  const cards = [
    { title: "Leads empresa", value: leads.empresas_total },
    { title: "Leads pessoa", value: leads.pessoas_total },
    { title: "Avaliações diagnóstico", value: leads.avaliacoes.diagnostico_total },
    { title: "Avaliações viabilidade", value: leads.avaliacoes.viabilidade_total },
    { title: "Conversão diagnóstico", value: formatPercent(leads.conversao.diagnostico.percentual) },
    { title: "Conversão viabilidade", value: formatPercent(leads.conversao.viabilidade.percentual) },
    { title: "Conclusão diagnóstico", value: formatPercent(leads.taxa_conclusao.diagnostico) },
    { title: "Conclusão viabilidade", value: formatPercent(leads.taxa_conclusao.viabilidade) },
  ];

  grid.innerHTML = cards
    .map(
      (card) => `
        <div class="kpi-card">
          <span>${card.title}</span>
          <strong>${card.value}</strong>
        </div>
      `
    )
    .join("");
}

function renderMaturidade(data) {
  const diagRows = data.distribuicao_maturidade.diagnostico.map((item) => [
    item.faixa,
    item.titulo || "-",
    item.count,
    formatPercent(item.percentual),
  ]);
  const viaRows = data.distribuicao_maturidade.viabilidade.map((item) => [
    item.faixa,
    item.classificacao_global || "-",
    item.count,
    formatPercent(item.percentual),
  ]);

  $("#maturidade-diagnostico").innerHTML = renderTable(
    ["Faixa", "Classificação", "Total", "%"],
    diagRows
  );
  $("#maturidade-viabilidade").innerHTML = renderTable(
    ["Faixa", "Classificação", "Total", "%"],
    viaRows
  );
}

function renderRankingAreas(data) {
  const diagRows = data.ranking_areas.diagnostico.map((item) => [
    item.area,
    formatPercent(item.percentual_medio),
    item.total_respostas,
  ]);
  const viaRows = data.ranking_areas.viabilidade.map((item) => [
    item.area,
    formatPercent(item.percentual_medio),
    item.total_respostas,
  ]);

  $("#ranking-diagnostico").innerHTML = renderTable(
    ["Área", "Percentual médio", "Respostas"],
    diagRows
  );
  $("#ranking-viabilidade").innerHTML = renderTable(
    ["Área", "Percentual médio", "Respostas"],
    viaRows
  );
}

function renderAlertas(data) {
  const rows = data.areas_alerta.por_segmento.map((item) => [
    item.segmento,
    item.area,
    item.alertas,
    item.total,
    formatPercent(item.percentual),
  ]);
  $("#alertas-segmento").innerHTML = renderTable(
    ["Segmento", "Área", "Alertas", "Total", "%"],
    rows
  );
}

function renderSegmentacao(data) {
  const diag = data.segmentacao.diagnostico;
  const via = data.segmentacao.viabilidade;

  function buildSegmentTable(title, rows, key) {
    const table = renderTable(
      [title, "Percentual médio", "Total"],
      rows.map((item) => [item[key], formatPercent(item.percentual_medio), item.total])
    );
    return `<div class="mini-table"><h4>${title}</h4>${table}</div>`;
  }

  const diagHtml = [
    buildSegmentTable("Segmento", diag.por_segmento, "segmento"),
    buildSegmentTable("Porte", diag.por_porte, "porte"),
    buildSegmentTable("Estado", diag.por_estado, "estado"),
    buildSegmentTable("Cidade", diag.por_cidade, "cidade"),
    buildSegmentTable("Tempo de operação", diag.por_tempo_operacao, "tempo_operacao"),
  ].join("");

  const viaHtml = [
    buildSegmentTable("Estado", via.por_estado, "estado"),
    buildSegmentTable("Cidade", via.por_cidade, "cidade"),
    buildSegmentTable("Já empreende", via.por_ja_empreende, "ja_empreende"),
    buildSegmentTable("Tipo de negócio", via.por_tipo_negocio, "tipo_negocio"),
    buildSegmentTable("Ideia", via.por_ideia, "ideia"),
  ].join("");

  $("#segmentacao-diagnostico").innerHTML = diagHtml || '<p class="empty-state">Sem dados no período.</p>';
  $("#segmentacao-viabilidade").innerHTML = viaHtml || '<p class="empty-state">Sem dados no período.</p>';
}

function renderPerguntasCriticas(data) {
  const rows = data.perguntas_criticas.map((item) => [
    item.tipo,
    item.area,
    item.pergunta,
    item.nao,
    item.nao_sei,
    item.total,
    formatPercent(item.percentual_critico),
  ]);
  $("#perguntas-criticas").innerHTML = renderTable(
    ["Tipo", "Área", "Pergunta", "Não", "Não sei", "Total", "%"],
    rows
  );
}

function renderSolucoes(data) {
  const diagRows = data.top_solucoes.diagnostico.map((item) => [item.solucao, item.count]);
  const viaRows = data.top_solucoes.viabilidade.map((item) => [item.solucao, item.count]);

  $("#solucoes-diagnostico").innerHTML = renderTable(["Solução", "Total"], diagRows);
  $("#solucoes-viabilidade").innerHTML = renderTable(["Solução", "Total"], viaRows);
}

function renderFunilOrigem(data) {
  if (data.funil_origem.disponivel) {
    $("#funil-origem").innerHTML = "<p>Dados disponíveis.</p>";
    return;
  }
  $("#funil-origem").innerHTML = `<p class="empty-state">${data.funil_origem.motivo}</p>`;
}

async function loadMetrics() {
  const startDate = $("#start-date").value;
  const endDate = $("#end-date").value;

  const query = new URLSearchParams();
  if (startDate) query.set("start_date", startDate);
  if (endDate) query.set("end_date", endDate);

  const resp = await fetch(`${API_BASE}/admin/metrics?${query.toString()}`);
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(detail || `Erro ${resp.status} ao carregar métricas.`);
  }

  const data = await resp.json();
  $("#period-range").textContent = `${data.periodo.inicio} a ${data.periodo.fim}`;

  renderKpis(data.leads);
  renderMaturidade(data);
  renderRankingAreas(data);
  renderAlertas(data);
  renderSegmentacao(data);
  renderPerguntasCriticas(data);
  renderSolucoes(data);
  renderFunilOrigem(data);
}

function init() {
  setDefaultDates();

  $("#btn-load").addEventListener("click", () => {
    loadMetrics().catch((err) => {
      console.error(err);
      alert(err.message || "Erro ao carregar métricas.");
    });
  });

  loadMetrics().catch((err) => {
    console.error(err);
  });
}

document.addEventListener("DOMContentLoaded", init);
