/* =========================================================
   CE Infinity • Front (HTML/CSS/JS)
   - Fluxo: 1) Dados -> 2) Perguntas -> 3) Resultado
   - Tipos: "diagnostico" (empresa) | "viabilidade" (pessoa)
   ========================================================= */

/* =========================
   CONFIG
   ========================= */

// Base da API (Render). Ex.: https://ce-infinity.onrender.com/api
// IMPORTANTE: se sua API estiver sem prefixo "/api", ajuste aqui.
const API_BASE = "https://ce-infinity.onrender.com/api";

const ENDPOINTS = {
  empresa: `${API_BASE}/empresas`,
  pessoa: `${API_BASE}/pessoas`,
  diagnostico: `${API_BASE}/diagnostico`,
  viabilidade: `${API_BASE}/viabilidade`,
};

/* =========================
   STATE
   ========================= */

let currentFormType = "diagnostico"; // "diagnostico" | "viabilidade"
let empresaId = null; // id retornado ao salvar empresa
let pessoaId = null;  // id retornado ao salvar pessoa
let leadPayload = null; // payload enviado ao endpoint de lead

/* =========================
   HELPERS UI
   ========================= */

function setActiveSelector(formType) {
  currentFormType = formType;

  document.querySelectorAll(".selector-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.form === formType);
  });

  // alterna forms
  const formEmpresa = document.getElementById("form-empresa");
  const formPessoa = document.getElementById("form-pessoa");

  if (formEmpresa && formPessoa) {
    formEmpresa.style.display = formType === "diagnostico" ? "" : "none";
    formPessoa.style.display = formType === "viabilidade" ? "" : "none";
  }

  // reseta telas
  showScreen("dados");
}

function setActiveStep(step) {
  document.querySelectorAll(".step-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.step === String(step));
  });
}

function showScreen(which) {
  const screenDados = document.getElementById("screen-dados");
  const screenPerguntas = document.getElementById("screen-perguntas");
  const screenResultados = document.getElementById("screen-resultados");

  if (!screenDados || !screenPerguntas || !screenResultados) return;

  screenDados.style.display = which === "dados" ? "" : "none";
  screenPerguntas.style.display = which === "perguntas" ? "" : "none";
  screenResultados.style.display = which === "resultados" ? "" : "none";

  if (which === "dados") setActiveStep(1);
  if (which === "perguntas") setActiveStep(2);
  if (which === "resultados") setActiveStep(3);
}

function showError(msg) {
  const el = document.getElementById("error");
  if (el) el.textContent = msg || "";
}

function clearError() {
  showError("");
}

function setButtonLoading(btn, isLoading, loadingText = "Enviando...") {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
    btn.classList.add("is-loading");
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
    btn.classList.remove("is-loading");
  }
}

/* =========================
   API
   ========================= */

async function apiPost(url, body) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Erro ao chamar API (${resp.status}): ${txt || "sem detalhes"}`);
  }

  return resp.json();
}

/* =========================
   QUESTIONS (SEEDS NO FRONT)
   =========================
   IMPORTANTE:
   - Aqui ficam as perguntas do diagnóstico e viabilidade
   - Você pediu para bater com o banco. Se você já atualizou antes, mantenha.
   - Caso precise atualizar novamente, altere aqui.
*/

const DIAGNOSTICO_AREAS = {
  "Marketing & Vendas": [],
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

// Opções de resposta (0/1/2) alinhado com sua última lógica
const answerOptions = [
  { label: "Sim", value: 2, description: "2 pontos" },
  { label: "Não", value: 1, description: "1 ponto" },
  { label: "Não sei", value: 0, description: "0 pontos" },
];

/* =========================
   FORM BUILD (Perguntas)
   ========================= */

function getQuestionsByArea() {
  return currentFormType === "diagnostico" ? DIAGNOSTICO_AREAS : VIABILIDADE_AREAS;
}

function renderPerguntas() {
  const formEl = document.getElementById("diagnostico-form");
  if (!formEl) return;

  formEl.innerHTML = "";

  const areas = getQuestionsByArea();

  Object.entries(areas).forEach(([areaNome, perguntas]) => {
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
        spanDesc.style.opacity = "0.7";
        spanDesc.style.fontSize = "0.75rem";
        spanDesc.textContent = ` (${opt.description})`;

        label.appendChild(input);
        label.appendChild(spanText);
        label.appendChild(spanDesc);

        answerGroup.appendChild(label);
      });

      li.appendChild(answerGroup);
      ol.appendChild(li);
    });

    areaCard.appendChild(ol);
    formEl.appendChild(areaCard);
  });
}

function buildPayloadRespostas() {
  const areas = getQuestionsByArea();
  const payload = {};

  for (const [areaNome, perguntas] of Object.entries(areas)) {
    const pontosArea = [];

    for (let i = 0; i < perguntas.length; i++) {
      const name = `${areaNome}__${i}`;
      const checked = document.querySelector(`input[name="${CSS.escape(name)}"]:checked`);

      if (!checked) {
        throw new Error("Responda todas as perguntas antes de enviar.");
      }

      pontosArea.push(Number(checked.value));
    }

    payload[areaNome] = pontosArea;
  }

  return payload;
}

/* =========================
   RENDER RESULTADOS
   ========================= */

function renderCardsPorArea(dataAreas) {
  const resultGrid = document.getElementById("result-grid");
  if (!resultGrid) return;

  resultGrid.innerHTML = "";

  Object.entries(dataAreas || {}).forEach(([area, res]) => {
    const card = document.createElement("div");
    card.className = "result-card";

    const h3 = document.createElement("h3");
    h3.textContent = area;
    card.appendChild(h3);

    const pScore = document.createElement("p");
    pScore.className = "result-score";
    pScore.textContent = `Pontuação: ${res.total_pontos} / ${res.pontuacao_maxima} (${res.percentual}%)`;
    card.appendChild(pScore);

    if (res.faixa?.min_percentual != null && res.faixa?.max_percentual != null) {
      const pFaixa = document.createElement("p");
      pFaixa.className = "result-score";
      pFaixa.textContent = `Faixa: ${res.faixa.min_percentual}% a ${res.faixa.max_percentual}%`;
      card.appendChild(pFaixa);
    }

    if (res.mensagem) {
      const pMsg = document.createElement("p");
      pMsg.className = "result-message";
      pMsg.textContent = res.mensagem;
      card.appendChild(pMsg);
    }

    resultGrid.appendChild(card);
  });
}

function renderParecerViabilidade(data) {
  const el = document.getElementById("viabilidade-parecer");
  const elDiag = document.getElementById("diagnostico-parecer");

  if (elDiag) elDiag.style.display = "none";
  if (!el) return;

  if (!data?.global) {
    el.style.display = "none";
    el.innerHTML = "";
    return;
  }

  const g = data.global;

  el.style.display = "block";
  el.innerHTML = `
    <h3>Parecer global — ${g.classificacao_global || ""}</h3>
    <p class="result-score">
      Faixa: ${g.min_percentual}% a ${g.max_percentual}% • Maturidade: ${data.percentual_global}%
    </p>
    ${g.frase_impacto ? `<p><strong>${g.frase_impacto}</strong></p>` : ""}
    ${g.parecer_global ? `<p>${g.parecer_global}</p>` : ""}
    ${g.direcionamento_estrategico ? `<p><strong>Direcionamento:</strong> ${g.direcionamento_estrategico}</p>` : ""}
    ${
      Array.isArray(g.solucoes_ce_infinity) && g.solucoes_ce_infinity.length
        ? `<p><strong>Soluções CE Infinity recomendadas:</strong></p>
           <ul>${g.solucoes_ce_infinity.map((s) => `<li>${s}</li>`).join("")}</ul>`
        : ""
    }
    ${g.cta ? `<p><strong>${g.cta}</strong></p>` : ""}
  `;
}

function renderParecerDiagnostico(data) {
  const el = document.getElementById("diagnostico-parecer");
  const elVia = document.getElementById("viabilidade-parecer");

  if (elVia) elVia.style.display = "none";
  if (!el) return;

  const g = data?.global;
  if (!g) {
    el.style.display = "none";
    el.innerHTML = "";
    return;
  }

  // aqui deixo o mínimo (você pode ajustar conforme seu formato final do endpoint)
  el.style.display = "block";
  el.innerHTML = `
    <h3>Parecer global</h3>
    <p class="result-score">Maturidade: ${g.percentual}%</p>
    ${
      g.feedback_global
        ? `
          <p><strong>${g.feedback_global.titulo || ""}</strong></p>
          <p>${g.feedback_global.mensagem || ""}</p>
          ${
            Array.isArray(g.feedback_global.solucoes) && g.feedback_global.solucoes.length
              ? `<p><strong>Soluções recomendadas:</strong></p>
                 <ul>${g.feedback_global.solucoes.map((s) => `<li>${s}</li>`).join("")}</ul>`
              : ""
          }
        `
        : ""
    }
  `;
}

/* =========================
   FLOW: Dados -> Perguntas
   ========================= */

async function handleAvancarDados(isFromPessoaForm) {
  clearError();

  // decide tipo pelo form em foco
  const isDiag = currentFormType === "diagnostico";
  const btn = isFromPessoaForm
    ? document.getElementById("btnSalvarLead")
    : document.getElementById("btn-avancar-dados");

  setButtonLoading(btn, true, "Salvando...");

  try {
    const form = isDiag ? document.getElementById("form-empresa") : document.getElementById("form-pessoa");
    if (!form) throw new Error("Formulário não encontrado no HTML.");

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    // Normalizações (caso o backend espere números)
    if (payload.numero_unidades !== undefined && payload.numero_unidades !== "") {
      payload.numero_unidades = Number(payload.numero_unidades);
    }
    if (payload.numero_colaboradores !== undefined && payload.numero_colaboradores !== "") {
      payload.numero_colaboradores = Number(payload.numero_colaboradores);
    }

    // endpoint de lead
    const url = isDiag ? ENDPOINTS.empresa : ENDPOINTS.pessoa;

    const saved = await apiPost(url, payload);

    // id retornado pelo endpoint de lead
    const idSalvo = saved?.id ?? null;
    if (!idSalvo) {
      throw new Error("A API não retornou o 'id' do lead (empresa/pessoa). Verifique o endpoint.");
    }
    if (isDiag) {
      empresaId = idSalvo;
    } else {
      pessoaId = idSalvo;
    }
    leadPayload = payload;

    // renderiza perguntas e vai para tela 2
    renderPerguntas();
    showScreen("perguntas");
  } catch (err) {
    console.error(err);
    showError(err.message || "Erro ao salvar dados.");
  } finally {
    setButtonLoading(btn, false);
  }
}

/* =========================
   FLOW: Perguntas -> Resultado
   ========================= */

async function handleEnviarPerguntas() {
  clearError();

  const btnEnviar = document.getElementById("btn-enviar");
  setButtonLoading(btnEnviar, true, "Enviando...");

  try {
    const respostas = buildPayloadRespostas();

    const isDiag = currentFormType === "diagnostico";
    const url = isDiag ? ENDPOINTS.diagnostico : ENDPOINTS.viabilidade;

    // garante que existe lead salvo
    if (isDiag && !empresaId) {
      throw new Error("Antes de enviar, preencha e salve os dados da empresa.");
    }
    if (!isDiag && !pessoaId) {
      throw new Error("Antes de enviar, preencha e salve seus dados.");
    }

    // corpo da requisição conforme a API
    const body = isDiag
      ? { empresa_id: empresaId, respostas }
      : { pessoa_id: pessoaId, respostas };

    const data = await apiPost(url, body);

    // render resultado
    showScreen("resultados");

    // título
    const title = document.getElementById("resultados-title");
    if (title) title.textContent = isDiag ? "Resultados do Diagnóstico" : "Resultados da Viabilidade";

    // pareceres
    if (isDiag) {
      renderParecerDiagnostico(data);
    } else {
      renderParecerViabilidade(data);
    }

    // cards por área
    const areas = data.areas || data; // fallback
    renderCardsPorArea(areas);

    // botão PDF (impressão)
    const btnPdf = document.getElementById("btn-pdf");
    if (btnPdf) btnPdf.style.display = "inline-block";
  } catch (err) {
    console.error(err);
    showError(err.message || "Erro ao enviar.");
  } finally {
    setButtonLoading(btnEnviar, false);
  }
}

/* =========================
   RESET
   ========================= */

function resetAll() {
  empresaId = null;
  pessoaId = null;
  leadPayload = null;

  // limpa inputs marcados
  document.querySelectorAll('#diagnostico-form input[type="radio"]').forEach((i) => (i.checked = false));

  // limpa resultados
  const grid = document.getElementById("result-grid");
  if (grid) grid.innerHTML = "";

  const diagParecer = document.getElementById("diagnostico-parecer");
  const viaParecer = document.getElementById("viabilidade-parecer");
  if (diagParecer) {
    diagParecer.innerHTML = "";
    diagParecer.style.display = "none";
  }
  if (viaParecer) {
    viaParecer.innerHTML = "";
    viaParecer.style.display = "none";
  }

  showScreen("dados");
}

/* =========================
   INIT
   ========================= */

function init() {
  // selector
  document.querySelectorAll(".selector-btn").forEach((btn) => {
    btn.addEventListener("click", () => setActiveSelector(btn.dataset.form));
  });

  // avançar dados (empresa)
  const btnAvancarDados = document.getElementById("btn-avancar-dados");
  if (btnAvancarDados) {
    btnAvancarDados.addEventListener("click", () => handleAvancarDados(false));
  }

  // avançar dados (pessoa)
  const btnSalvarLead = document.getElementById("btnSalvarLead");
  if (btnSalvarLead) {
    btnSalvarLead.addEventListener("click", () => handleAvancarDados(true));
  }

  // voltar
  const btnVoltar = document.getElementById("btn-voltar-dados");
  if (btnVoltar) btnVoltar.addEventListener("click", () => showScreen("dados"));

  // enviar
  const btnEnviar = document.getElementById("btn-enviar");
  if (btnEnviar) btnEnviar.addEventListener("click", handleEnviarPerguntas);

  // pdf
  const btnPdf = document.getElementById("btn-pdf");
  if (btnPdf) btnPdf.addEventListener("click", () => window.print());

  // refazer
  const btnRefazer = document.getElementById("btn-refazer");
  if (btnRefazer) btnRefazer.addEventListener("click", resetAll);

  // start
  setActiveSelector("diagnostico");
}

document.addEventListener("DOMContentLoaded", init);
