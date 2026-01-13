const API_BASE = "https://ce-infinity.onrender.com/api";

const $ = (sel) => document.querySelector(sel);

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "0%";
  return `${Number(value).toFixed(2)}%`;
}

function renderKeyValue(obj) {
  if (!obj) return '<p class="empty-state">Lead não encontrado.</p>';
  const rows = Object.entries(obj).map(([key, value]) => [
    key.replace(/_/g, " "),
    value ?? "-",
  ]);
  return renderTable(["Campo", "Valor"], rows);
}

function renderTable(headers, rows) {
  if (!rows.length) {
    return '<p class="empty-state">Sem dados.</p>';
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

function renderGlobal(globalData, tipo) {
  const header = `
    <p class="result-score">Pontuação: ${globalData.total_pontos} / ${globalData.pontuacao_maxima}</p>
    <p class="result-score">Percentual: ${formatPercent(globalData.percentual)}</p>
  `;

  if (tipo === "diagnostico") {
    const parecer = globalData.parecer;
    const solucoes = Array.isArray(parecer.solucoes) ? parecer.solucoes : [];
    return `
      ${header}
      <h4>${parecer.titulo}</h4>
      <p>${parecer.mensagem}</p>
      ${
        parecer.areas_em_alerta?.length
          ? `<p><strong>Áreas em alerta:</strong> ${parecer.areas_em_alerta.join(", ")}</p>`
          : ""
      }
      ${
        solucoes.length
          ? `<div class="parecer-solucoes"><strong>Soluções recomendadas</strong><ul>${solucoes
              .map((item) => `<li>${item}</li>`)
              .join("")}</ul></div>`
          : ""
      }
    `;
  }

  const parecer = globalData.parecer;
  const solucoes = Array.isArray(parecer.solucoes_ce_infinity) ? parecer.solucoes_ce_infinity : [];
  return `
    ${header}
    <h4>${parecer.classificacao_global || ""}</h4>
    ${parecer.frase_impacto ? `<p><strong>${parecer.frase_impacto}</strong></p>` : ""}
    ${parecer.parecer_global ? `<p>${parecer.parecer_global}</p>` : ""}
    ${parecer.direcionamento_estrategico ? `<p><strong>Direcionamento:</strong> ${parecer.direcionamento_estrategico}</p>` : ""}
    ${
      solucoes.length
        ? `<div class="parecer-solucoes"><strong>Soluções recomendadas</strong><ul>${solucoes
            .map((item) => `<li>${item}</li>`)
            .join("")}</ul></div>`
        : ""
    }
    ${parecer.cta ? `<p><strong>CTA:</strong> ${parecer.cta}</p>` : ""}
  `;
}

function renderAreas(areas) {
  if (!areas.length) {
    return '<p class="empty-state">Sem dados.</p>';
  }
  return areas
    .map(
      (area) => `
      <div class="metric-card">
        <h3>${area.area}</h3>
        <p class="result-score">Pontuação: ${area.total_pontos} / ${area.pontuacao_maxima}</p>
        <p class="result-score">Percentual: ${formatPercent(area.percentual)}</p>
        <p>${area.feedback}</p>
      </div>
    `
    )
    .join("");
}

function renderPerguntas(areas) {
  const rows = [];
  areas.forEach((area) => {
    area.perguntas.forEach((pergunta) => {
      rows.push([area.area, pergunta.pergunta, pergunta.resposta, pergunta.valor]);
    });
  });

  return renderTable(["Área", "Pergunta", "Resposta", "Valor"], rows);
}

async function loadLead() {
  const tipo = $("#lead-tipo").value;
  const leadId = $("#lead-select").value;

  if (!leadId) {
    alert("Selecione um lead.");
    return;
  }

  const url = new URL(`${API_BASE}/admin/lead-result`);
  url.searchParams.set("tipo", tipo);
  url.searchParams.set("lead_id", leadId);

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(detail || `Erro ${resp.status} ao buscar lead.`);
  }

  const data = await resp.json();

  $("#lead-match").innerHTML = "";

  $("#lead-info").innerHTML = renderKeyValue(data.lead);
  $("#lead-global").innerHTML = renderGlobal(data.global, data.tipo);
  $("#lead-areas").innerHTML = renderAreas(data.areas);
  $("#lead-perguntas").innerHTML = renderPerguntas(data.areas);
}

async function searchLeads() {
  const tipo = $("#lead-tipo").value;
  const leadNome = $("#lead-nome").value.trim();

  if (!leadNome) {
    alert("Informe um nome para buscar.");
    return;
  }

  const url = new URL(`${API_BASE}/admin/lead-search`);
  url.searchParams.set("tipo", tipo);
  url.searchParams.set("nome", leadNome);

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(detail || `Erro ${resp.status} ao buscar leads.`);
  }

  const data = await resp.json();
  const select = $("#lead-select");
  const options = data.leads || [];

  select.innerHTML = '<option value="">Selecione…</option>';
  options.forEach((lead) => {
    const option = document.createElement("option");
    option.value = lead.id;
    option.textContent = `${lead.nome} (ID ${lead.id})`;
    select.appendChild(option);
  });

  if (options.length) {
    select.value = options[0].id;
    $("#lead-match").innerHTML = `<p class="empty-state">Encontrados ${data.total} leads.</p>`;
  } else {
    $("#lead-match").innerHTML = '<p class="empty-state">Nenhum lead encontrado.</p>';
  }
}

function init() {
  $("#btn-search-lead").addEventListener("click", () => {
    searchLeads().catch((err) => {
      console.error(err);
      alert(err.message || "Erro ao buscar leads.");
    });
  });

  $("#btn-load-lead").addEventListener("click", () => {
    loadLead().catch((err) => {
      console.error(err);
      alert(err.message || "Erro ao buscar avaliação.");
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
