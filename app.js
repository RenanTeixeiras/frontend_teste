/* ======================================================
   CE Infinity • Front (HTML/CSS/JS) - App
   Compatível com o HTML enviado:
   - screen-dados / screen-perguntas / screen-resultados
   - form-empresa / form-pessoa
   - btn-avancar-dados (empresa) / btnSalvarLead (pessoa)
   - btn-enviar, btn-voltar-dados, btn-refazer, btn-pdf
====================================================== */

/* =========================
   CONFIG
========================= */
const API_BASE = "https://ce-infinity.onrender.com";

const API_EMPRESA_URL = `${API_BASE}/api/empresas`;
const API_PESSOA_URL = `${API_BASE}/api/pessoas`;
const API_DIAGNOSTICO_URL = `${API_BASE}/api/diagnostico`;
const API_VIABILIDADE_URL = `${API_BASE}/api/viabilidade`;

/**
 * IMPORTANTE:
 * - Diagnóstico empresarial: pontuação 2/1/0
 * - Viabilidade: endpoint também foi ajustado para 2/1/0 (mesma lógica)
 */
const answerOptions = [
  { label: "Sim", value: 2, desc: "2 pontos" },
  { label: "Não", value: 1, desc: "1 ponto" },
  { label: "Não sei", value: 0, desc: "0 pontos" },
];

/**
 * PERGUNTAS: devem bater com o que está no banco
 * (Você disse que já ajustamos para bater com o seed)
 *
 * Se você quiser, pode manter estas perguntas “hardcoded” aqui,
 * ou (melhor) carregar de um endpoint no futuro.
 */
const DIAGNOSTICO_AREAS = {
  "Marketing & Vendas": [
    // coloque exatamente as perguntas do seed/banco
    // (mantive placeholder se você já ajustou antes neste arquivo)
  ],
  "Operações & Logística": [],
  "Financeiro & Fiscal": [],
  "Pessoas & Cultura": [],
  "Processos & Qualidade": [],
  "Estratégia & Governança": [],
};

const VIABILIDADE_AREAS = {
  "Problema & Oportunidade": [],
  "Público-alvo & Mercado": [],
  "Produto / Serviço & Proposta de valor": [],
  "Operação & Estrutura": [],
  "Financeiro & Viabilidade": [],
};

/* =========================
   ESTADO
========================= */
let currentFormType = "diagnostico"; // "diagnostico" | "viabilidade"
let leadId = null; // se quiser usar depois p/ vincular resultados

/* =========================
   DOM
========================= */
const screenDados = document.getElementById("screen-dados");
const screenPerguntas = document.getElementById("screen-perguntas");
const screenResultados = document.getElementById("screen-resultados");

const formEmpresa = document.getElementById("form-empresa");
const formPessoa = document.getElementById("form-pessoa");

const btnAvancarEmpresa = document.getElementById("btn-avancar-dados");
const btnAvancarPessoa = document.getElementById("btnSalvarLead");

const btnVoltarDados = document.getElementById("btn-voltar-dados");
const btnEnviar = document.getElementById("btn-enviar");

const diagnosticoForm = document.getElementById("diagnostico-form");
const errorEl = document.getElementById("error");

const resultadosTitle = document.getElementById("resultados-title");
const resultGrid = document.getElementById("result-grid");
const btnRefazer = document.getElementById("btn-refazer");
const btnPdf = document.getElementById("btn-pdf");

const diagnosticoParecer = document.getElementById("diagnostico-parecer");
const viabilidadeParecer = document.getElementById("viabilidade-parecer");

const selectorBtns = document.querySelectorAll(".selector-btn");
const stepChips = document.querySelectorAll(".step-chip");

/* =========================
   HELPERS
========================= */
function setError(msg) {
  if (errorEl) errorEl.textContent = msg || "";
  if (msg) console.error(msg);
}

function clearError() {
  setError("");
}

function setStep(stepNumber) {
  stepChips.forEach((chip) => {
    const s = Number(chip.getAttribute("data-step"));
    chip.classList.toggle("active", s === stepNumber);
  });
}

function showScreen(screen) {
  screenDados.style.display = screen === "dados" ? "block" : "none";
  screenPerguntas.style.display = screen === "perguntas" ? "block" : "none";
  screenResultados.style.display = screen === "resultados" ? "block" : "none";
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFormData(formEl) {
  const data = {};
  const fd = new FormData(formEl);
  fd.forEach((value, key) => {
    data[key] = String(value ?? "").trim();
  });
  return data;
}

function resetRadios() {
  document
    .querySelectorAll('#diagnostico-form input[type="radio"]')
    .forEach((i) => (i.checked = false));
}

function clearResultsUI() {
  if (resultGrid) resultGrid.innerHTML = "";

  if (diagnosticoParecer) {
    diagnosticoParecer.style.display = "none";
    diagnosticoParecer.innerHTML = "";
  }
  if (viabilidadeParecer) {
    viabilidadeParecer.style.display = "none";
    viabilidadeParecer.innerHTML = "";
  }
  if (btnPdf) btnPdf.style.display = "none";
}

/* =========================
   FORM SWITCH (DIAGNÓSTICO / VIABILIDADE)
========================= */
function setFormType(type) {
  currentFormType = type;

  selectorBtns.forEach((b) => {
    b.classList.toggle("active", b.dataset.form === type);
  });

  if (type === "diagnostico") {
    if (formEmpresa) formEmpresa.style.display = "block";
    if (formPessoa) formPessoa.style.display = "none";
  } else {
    if (formEmpresa) formEmpresa.style.display = "none";
    if (formPessoa) formPessoa.style.display = "block";
  }

  // reset UI
  clearError();
  clearResultsUI();
  resetRadios();
  leadId = null;

  // volta para dados
  showScreen("dados");
  setStep(1);

  // quando trocar de formulário, regenerar perguntas na tela 2
  renderPerguntas();
}

selectorBtns.forEach((btn) => {
  btn.addEventListener("click", () => setFormType(btn.dataset.form));
});

/* =========================
   RENDER PERGUNTAS
========================= */
function getAreasConfig() {
  return currentFormType === "diagnostico" ? DIAGNOSTICO_AREAS : VIABILIDADE_AREAS;
}

function renderPerguntas() {
  if (!diagnosticoForm) return;

  diagnosticoForm.innerHTML = "";
  const AREAS = getAreasConfig();

  Object.entries(AREAS).forEach(([areaNome, perguntas]) => {
    const areaCard = document.createElement("section");
    areaCard.className = "area-card";

    const h2 = document.createElement("h2");
    h2.textContent = areaNome;
    areaCard.appendChild(h2);

    const ol = document.createElement("ol");
    ol.className = "question-list";

    perguntas.forEach((pergunta, index) => {
      const li = document.createElement("li");
      li.className = "question-item";

      const p = document.createElement("p");
      p.textContent = pergunta;
      li.appendChild(p);

      const answerGroup = document.createElement("div");
      answerGroup.className = "answer-group";

      answerOptions.forEach((opt) => {
        const label = document.createElement("label");
        label.className = "answer-pill";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `${areaNome}__${index}`;
        input.value = String(opt.value);

        const spanText = document.createElement("span");
        spanText.textContent = opt.label;

        const spanDesc = document.createElement("span");
        spanDesc.className = "answer-desc";
        spanDesc.textContent = ` (${opt.desc})`;

        label.appendChild(input);
        label.appendChild(spanText);
        label.appendChild(spanDesc);

        answerGroup.appendChild(label);
      });

      li.appendChild(answerGroup);
      ol.appendChild(li);
    });

    areaCard.appendChild(ol);
    diagnosticoForm.appendChild(areaCard);
  });
}

/* =========================
   COLETAR RESPOSTAS
========================= */
function collectAnswers() {
  const AREAS = getAreasConfig();
  const payload = {};

  for (const [areaNome, perguntas] of Object.entries(AREAS)) {
    const pontosArea = [];

    for (let i = 0; i < perguntas.length; i++) {
      const name = `${areaNome}__${i}`;
      const checked = document.querySelector(
        `input[name="${CSS.escape(name)}"]:checked`
      );

      if (!checked) {
        throw new Error(
          "Responda todas as perguntas de todas as áreas antes de enviar."
        );
      }

      pontosArea.push(Number(checked.value));
    }

    payload[areaNome] = pontosArea;
  }

  return payload;
}

/* =========================
   API HELPERS
========================= */
async function postJson(url, body) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    let msg = txt || `Erro HTTP ${resp.status}`;
    try {
      const j = JSON.parse(txt);
      if (j?.detail) msg = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
    } catch (_) {}
    throw new Error(msg);
  }

  return resp.json();
}

/* =========================
   RENDER RESULTADOS
========================= */
function renderGlobalDiagnostico(global) {
  if (!diagnosticoParecer) return;

  const fb = global?.feedback_global;
  if (!fb) {
    diagnosticoParecer.style.display = "none";
    diagnosticoParecer.innerHTML = "";
    return;
  }

  const solucoes = Array.isArray(fb.solucoes) ? fb.solucoes : [];
  const areasAlerta = Array.isArray(fb.areas_em_alerta) ? fb.areas_em_alerta : [];

  diagnosticoParecer.style.display = "block";
  diagnosticoParecer.innerHTML = `
    <div class="parecer-title">Parecer global — ${escapeHtml(fb.titulo)}</div>
    <div class="parecer-meta">
      Faixa: ${escapeHtml(fb.min_percentual)}% a ${escapeHtml(fb.max_percentual)}% •
      Global: ${escapeHtml(global.percentual)}%
    </div>
    <p class="parecer-text">${escapeHtml(fb.mensagem).replaceAll("\n", "<br />")}</p>
    ${
      areasAlerta.length
        ? `<p class="parecer-areas"><strong>Áreas em alerta:</strong> ${escapeHtml(
            areasAlerta.join(", ")
          )}</p>`
        : ""
    }
    ${
      solucoes.length
        ? `<div class="parecer-solucoes">
             <strong>Soluções recomendadas</strong>
             <ul>${solucoes.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
           </div>`
        : ""
    }
  `;
}

function renderGlobalViabilidade(global, percentualGlobal) {
  if (!viabilidadeParecer) return;
  if (!global) {
    viabilidadeParecer.style.display = "none";
    viabilidadeParecer.innerHTML = "";
    return;
  }

  const solucoes = Array.isArray(global.solucoes_ce_infinity) ? global.solucoes_ce_infinity : [];

  viabilidadeParecer.style.display = "block";
  viabilidadeParecer.innerHTML = `
    <div class="parecer-title">Parecer global — ${escapeHtml(
      global.classificacao_global
    )}</div>
    <div class="parecer-meta">
      Faixa: ${escapeHtml(global.min_percentual)}% a ${escapeHtml(
        global.max_percentual
      )}% • Maturidade: ${escapeHtml(percentualGlobal)}%
    </div>
    ${
      global.frase_impacto
        ? `<p class="parecer-text"><strong>${escapeHtml(
            global.frase_impacto
          )}</strong></p>`
        : ""
    }
    ${
      global.parecer_global
        ? `<p class="parecer-text">${escapeHtml(global.parecer_global).replaceAll(
            "\n",
            "<br />"
          )}</p>`
        : ""
    }
    ${
      global.direcionamento_estrategico
        ? `<p class="parecer-text"><strong>Direcionamento:</strong> ${escapeHtml(
            global.direcionamento_estrategico
          )}</p>`
        : ""
    }
    ${
      solucoes.length
        ? `<div class="parecer-solucoes">
             <strong>Soluções CE Infinity</strong>
             <ul>${solucoes.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
           </div>`
        : ""
    }
    ${
      global.cta
        ? `<p class="parecer-cta">${escapeHtml(global.cta)}</p>`
        : ""
    }
  `;
}

function renderResultadosDiagnostico(data) {
  if (resultadosTitle) resultadosTitle.textContent = "Resultados • Diagnóstico";
  if (!data) return;

  // global
  if (data.global) renderGlobalDiagnostico(data.global);

  // áreas
  const areas = data.areas || {};
  if (resultGrid) resultGrid.innerHTML = "";

  Object.entries(areas).forEach(([area, res]) => {
    const card = document.createElement("div");
    card.className = "result-card";

    const h3 = document.createElement("h3");
    h3.textContent = area;
    card.appendChild(h3);

    const pScore = document.createElement("p");
    pScore.className = "result-score";
    pScore.textContent = `Pontuação: ${res.total_pontos} / ${res.pontuacao_maxima} (${res.percentual}%)`;
    card.appendChild(pScore);

    const pMsg = document.createElement("p");
    pMsg.className = "result-message";
    pMsg.textContent = res.mensagem;
    card.appendChild(pMsg);

    resultGrid.appendChild(card);
  });
}

function renderResultadosViabilidade(data) {
  if (resultadosTitle) resultadosTitle.textContent = "Resultados • Viabilidade";
  if (!data) return;

  // global
  renderGlobalViabilidade(data.global, data.percentual_global);

  // áreas
  const areas = data.areas || {};
  if (resultGrid) resultGrid.innerHTML = "";

  Object.entries(areas).forEach(([area, res]) => {
    const card = document.createElement("div");
    card.className = "result-card";

    const h3 = document.createElement("h3");
    h3.textContent = area;
    card.appendChild(h3);

    const pScore = document.createElement("p");
    pScore.className = "result-score";
    pScore.textContent = `Pontuação: ${res.total_pontos} / ${res.pontuacao_maxima} (${res.percentual}%)`;
    card.appendChild(pScore);

    const pMsg = document.createElement("p");
    pMsg.className = "result-message";
    pMsg.textContent = res.mensagem;
    card.appendChild(pMsg);

    resultGrid.appendChild(card);
  });
}

/* =========================
   SALVAR LEAD + AVANÇAR PARA PERGUNTAS
========================= */
async function salvarLeadEAvancar() {
  const isDiagnostico = currentFormType === "diagnostico";

  let endpoint = null;
  let body = null;

  if (isDiagnostico) {
    const payload = getFormData(formEmpresa);

    body = {
      nome_empresa: payload.nome_empresa,
      nome_responsavel: payload.nome_responsavel,
      email: payload.email,
      whatsapp: payload.whatsapp,
      cidade: payload.cidade,
      estado: payload.estado,
      segmento: payload.segmento, // comercio | servicos | franquia
      tipo_negocio: payload.tipo_negocio,
      porte_empresa: payload.porte_empresa, // ME | EPP | PME
      faturamento_estimado: payload.faturamento_estimado,
      numero_unidades:
        payload.segmento === "franquia"
          ? Number(payload.numero_unidades || 0)
          : null,
      numero_colaboradores: Number(payload.numero_colaboradores || 0),
      tempo_operacao: payload.tempo_operacao,
    };

    endpoint = API_EMPRESA_URL;
  } else {
    const payload = getFormData(formPessoa);

    body = {
      nome_completo: payload.nome_completo,
      email: payload.email,
      whatsapp: payload.whatsapp,
      cidade: payload.cidade,
      estado: payload.estado,
      profissao_atual: payload.profissao_atual,
      ja_empreende: payload.ja_empreende, // sim | nao
      tipo_negocio_desejado: payload.tipo_negocio_desejado, // comercio | servico
      ideia: payload.ideia, // propria | franquia
      previsao_investimento: payload.previsao_investimento,
      prazo_para_abrir: payload.prazo_para_abrir,
    };

    endpoint = API_PESSOA_URL;
  }

  // regra franquia (evitar 400 desnecessário)
  if (
    isDiagnostico &&
    body.segmento === "franquia" &&
    (!body.numero_unidades || body.numero_unidades <= 0)
  ) {
    // mostra erro em alert pq na tela de dados não tem #error visível
    alert(
      "Se o segmento for Franquia, informe um número de unidades maior que 0."
    );
    return;
  }

  // ===== LOADING no botão “Avançar para perguntas” (pedido) =====
  const btn = isDiagnostico ? btnAvancarEmpresa : btnAvancarPessoa;
  const oldTxt = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Salvando...";

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(
        txt || `Erro ao salvar ${isDiagnostico ? "empresa" : "pessoa"}.`
      );
    }

    const data = await resp.json();
    leadId = data?.id ?? null;

    // gera perguntas e avança para tela 2
    renderPerguntas();
    showScreen("perguntas");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    alert(err?.message || "Erro ao salvar seus dados. Tente novamente.");
  } finally {
    btn.disabled = false;
    btn.textContent = oldTxt;
  }
}

btnAvancarEmpresa?.addEventListener("click", salvarLeadEAvancar);
btnAvancarPessoa?.addEventListener("click", salvarLeadEAvancar);

/* =========================
   VOLTAR PARA DADOS
========================= */
btnVoltarDados?.addEventListener("click", () => {
  clearError();
  showScreen("dados");
  setStep(1);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* =========================
   ENVIAR RESPOSTAS (PERGUNTAS)
========================= */
btnEnviar?.addEventListener("click", async () => {
  clearError();
  clearResultsUI();

  const oldTxt = btnEnviar.textContent;
  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviando...";

  try {
    const respostas = collectAnswers();

    if (currentFormType === "diagnostico") {
      // Diagnóstico: body root dict (áreas -> lista)
      const data = await postJson(API_DIAGNOSTICO_URL, respostas);
      showScreen("resultados");
      setStep(3);
      renderResultadosDiagnostico(data);
    } else {
      // Viabilidade: body no formato {"respostas": {...}}
      const data = await postJson(API_VIABILIDADE_URL, { respostas });
      showScreen("resultados");
      setStep(3);
      renderResultadosViabilidade(data);
    }

    if (btnPdf) btnPdf.style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    setError(err?.message || "Erro ao enviar.");
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = oldTxt;
  }
});

/* =========================
   REFAZER
========================= */
btnRefazer?.addEventListener("click", () => {
  clearError();
  clearResultsUI();
  resetRadios();
  leadId = null;

  showScreen("dados");
  setStep(1);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* =========================
   PDF (PRINT)
========================= */
btnPdf?.addEventListener("click", () => {
  window.print();
});

/* =========================
   INIT
========================= */
function init() {
  // se as perguntas estiverem vazias aqui, você deve colar as do seed/banco no objeto.
  renderPerguntas();
  setFormType("diagnostico");
}

document.addEventListener("DOMContentLoaded", init);
