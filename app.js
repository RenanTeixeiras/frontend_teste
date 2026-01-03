/* =========================================================
   CE Infinity • Diagnóstico & Viabilidade (Front Vanilla)
   - Mantém layout atual (HTML/CSS)
   - Fluxo: 1) Dados -> 2) Perguntas -> 3) Resultado
   - Salva lead (empresa/pessoa) antes de ir para perguntas
   ========================================================= */

/* =========================
   CONFIG
   ========================= */
const API_BASE = "https://ce-infinity.onrender.com/api";

/**
 * Endpoints (ajuste se necessário):
 * - POST /leads/empresa  (ou /empresa)
 * - POST /leads/pessoa   (ou /pessoa)
 * - POST /diagnostico
 * - POST /viabilidade
 */
const ENDPOINTS = {
  empresa: `${API_BASE}/empresa`,
  pessoa: `${API_BASE}/pessoa`,
  diagnostico: `${API_BASE}/diagnostico`,
  viabilidade: `${API_BASE}/viabilidade`,
};

/* =========================
   PERGUNTAS (BATENDO COM O BANCO)
   ========================= */
const DIAGNOSTICO_AREAS = {
  "Marketing & Vendas": [
    "A empresa possui uma estratégia clara de aquisição de clientes?",
    "Existem canais definidos de vendas e marketing (online e offline)?",
    "A precificação está baseada em custos, mercado e percepção de valor?",
    "O relacionamento com o cliente é estruturado (CRM, pós-venda, fidelização)?",
    "A empresa monitora metas e indicadores comerciais (faturamento, conversão, ticket)?",
  ],
  "Operações & Logística": [
    "Os processos operacionais estão documentados e padronizados?",
    "A empresa possui controle eficiente de estoques e suprimentos (quando aplicável)?",
    "Há capacidade produtiva adequada para atender a demanda atual?",
    "A entrega do produto/serviço ocorre com qualidade e dentro dos prazos?",
    "Existem rotinas de melhoria contínua e redução de desperdícios?",
  ],
  "Financeiro & Fiscal": [
    "A empresa possui controle de fluxo de caixa atualizado e projetado?",
    "Existe apuração de resultados (DRE) e análise periódica de lucratividade?",
    "Há planejamento orçamentário e acompanhamento do realizado x orçado?",
    "A empresa tem controles e rotinas fiscais organizadas e regulares?",
    "Existem indicadores financeiros acompanhados (margem, endividamento, capital de giro)?",
  ],
  "Pessoas & Cultura": [
    "As responsabilidades e funções estão bem definidas para a equipe?",
    "A empresa possui rotinas de gestão de desempenho e feedback?",
    "Existem treinamentos ou capacitações para evolução dos colaboradores?",
    "O clima organizacional e engajamento são monitorados?",
    "A empresa possui políticas claras de contratação, retenção e desenvolvimento de talentos?",
  ],
  "Processos & Qualidade": [
    "Os processos internos estão mapeados e possuem responsáveis definidos?",
    "Existem indicadores (KPIs) para medir eficiência e qualidade?",
    "A empresa utiliza tecnologia/automação para aumentar produtividade?",
    "Há rotina de auditoria ou controle de qualidade dos processos?",
    "Existe um plano de melhoria contínua baseado em análise de dados?",
  ],
  "Estratégia & Governança": [
    "A empresa possui planejamento estratégico formalizado (metas, visão e prioridades)?",
    "Há acompanhamento periódico de indicadores estratégicos e resultados?",
    "A tomada de decisão é baseada em dados e relatórios confiáveis?",
    "Existe governança definida (papéis, responsabilidades, processos decisórios)?",
    "A empresa possui visão clara de expansão, crescimento e inovação?",
  ],
};

const VIABILIDADE_AREAS = {
  "Problema & Oportunidade": [
    "Você consegue explicar claramente qual problema seu negócio pretende resolver?",
    "Esse problema afeta um público numeroso ou relevante?",
    "As pessoas afetadas reconhecem que esse problema existe?",
    "Existem evidências de que esse problema gera demanda por soluções?",
    "Há tendências favoráveis no mercado relacionadas ao seu negócio?",
  ],
  "Público-alvo & Mercado": [
    "Você sabe claramente quem é o cliente ideal do negócio?",
    "Você sabe quanto o cliente estaria disposto a pagar pela solução?",
    "Você já conversou com potenciais clientes sobre sua ideia?",
    "Você conhece o tamanho estimado do mercado onde vai atuar?",
    "Sua ideia atende a um nicho específico e bem definido?",
  ],
  "Produto / Serviço & Proposta de valor": [
    "Você consegue explicar sua solução de forma simples e objetiva?",
    "Sua solução tem diferenciais claros em relação ao que já existe no mercado?",
    "O modelo de receita do negócio já está definido?",
    "A entrega do produto/serviço é viável com os recursos iniciais disponíveis?",
    "A solução permite escalabilidade no médio ou longo prazo?",
  ],
  "Operação & Estrutura": [
    "Você sabe como seu produto/serviço será produzido, entregue ou executado?",
    "Já consegue identificar quais funções e profissionais serão necessários?",
    "Você já tem acesso (ou caminhos de acesso) aos fornecedores e parceiros principais?",
    "Você possui protótipo, MVP ou qualquer validação inicial da solução?",
    "O início da operação exige investimento baixo ou moderado?",
  ],
  "Financeiro & Viabilidade": [
    "Você sabe o valor necessário para iniciar o negócio?",
    "Já conhece seus custos fixos e variáveis?",
    "Consegue estimar a receita prevista nos primeiros meses?",
    "Você sabe qual é o ponto de equilíbrio do negócio?",
    "Já identificou os principais riscos do negócio e possíveis mitigadores?",
  ],
};

/* =========================
   OPÇÕES DE RESPOSTA
   - Ambas usam 0/1/2 (conforme sua API atual)
   ========================= */
const answerOptions = [
  { label: "Sim", value: 2, description: "2 pontos" },
  { label: "Não", value: 1, description: "1 ponto" },
  { label: "Não sei", value: 0, description: "0 pontos" },
];

/* =========================
   STATE
   ========================= */
let currentFormType = "diagnostico"; // "diagnostico" | "viabilidade"
let leadId = null; // opcional se sua API retornar id
let leadPayload = null; // payload enviado ao endpoint de lead

/* =========================
   DOM HELPERS
   ========================= */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function show(el) {
  el.style.display = "";
}
function hide(el) {
  el.style.display = "none";
}

function setStep(step) {
  // step: 1,2,3
  $$(".step-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.step === String(step));
  });

  const screenDados = $("#screen-dados");
  const screenPerguntas = $("#screen-perguntas");
  const screenResultados = $("#screen-resultados");

  if (step === 1) {
    show(screenDados);
    hide(screenPerguntas);
    hide(screenResultados);
  } else if (step === 2) {
    hide(screenDados);
    show(screenPerguntas);
    hide(screenResultados);
  } else {
    hide(screenDados);
    hide(screenPerguntas);
    show(screenResultados);
  }
}

function setFormType(type) {
  currentFormType = type;

  // Botões selector
  $$(".selector-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.form === type);
  });

  // Formulários dados
  const formEmpresa = $("#form-empresa");
  const formPessoa = $("#form-pessoa");

  if (type === "diagnostico") {
    show(formEmpresa);
    hide(formPessoa);
    $("#resultados-title").textContent = "Resultados por área";
  } else {
    hide(formEmpresa);
    show(formPessoa);
    $("#resultados-title").textContent = "Resultados por área";
  }

  // reset do fluxo
  $("#error").textContent = "";
  $("#diagnostico-form").innerHTML = "";
  $("#result-grid").innerHTML = "";
  $("#diagnostico-parecer").style.display = "none";
  $("#viabilidade-parecer").style.display = "none";
  $("#btn-pdf").style.display = "none";
  leadId = null;
  leadPayload = null;

  setStep(1);
}

/* =========================
   UI: Render Perguntas
   ========================= */
function renderPerguntas() {
  const formEl = $("#diagnostico-form");
  formEl.innerHTML = "";

  const AREAS = currentFormType === "diagnostico" ? DIAGNOSTICO_AREAS : VIABILIDADE_AREAS;

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

/* =========================
   API Helpers
   ========================= */
async function apiPost(url, body) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`Erro ao chamar API (${resp.status}): ${detail || "sem detalhes"}`);
  }

  return resp.json();
}

/* =========================
   Dados -> salvar lead + loading
   ========================= */
function setLoadingButton(btn, isLoading, loadingText = "Salvando...") {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = loadingText;
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || btn.textContent;
  }
}

async function handleAvancarDados(btn) {
  $("#error").textContent = "";

  try {
    const isDiag = currentFormType === "diagnostico";

    const form = isDiag ? $("#form-empresa") : $("#form-pessoa");
    if (!form) throw new Error("Formulário não encontrado.");

    // validação HTML5
    if (!form.reportValidity()) {
      return;
    }

    // coletar dados
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    // normalizações simples
    if (isDiag) {
      // números
      if (data.numero_unidades !== undefined && data.numero_unidades !== "") {
        data.numero_unidades = Number(data.numero_unidades);
      } else {
        delete data.numero_unidades;
      }
      if (data.numero_colaboradores !== undefined && data.numero_colaboradores !== "") {
        data.numero_colaboradores = Number(data.numero_colaboradores);
      }
    }

    setLoadingButton(btn, true, "Salvando...");

    // salvar lead
    const endpoint = isDiag ? ENDPOINTS.empresa : ENDPOINTS.pessoa;
    const saved = await apiPost(endpoint, data);

    // se sua API retorna {id: ...} ou algo do tipo
    leadId = saved?.id ?? null;
    leadPayload = data;

    // render perguntas e avançar
    renderPerguntas();
    setStep(2);
  } catch (err) {
    console.error(err);
    $("#error").textContent = err?.message || "Erro ao salvar os dados.";
  } finally {
    setLoadingButton(btn, false);
  }
}

/* =========================
   Enviar perguntas -> API
   ========================= */
function buildPayloadRespostas() {
  const AREAS = currentFormType === "diagnostico" ? DIAGNOSTICO_AREAS : VIABILIDADE_AREAS;
  const payload = {};

  for (const [areaNome, perguntas] of Object.entries(AREAS)) {
    const pontosArea = [];

    for (let i = 0; i < perguntas.length; i++) {
      const name = `${areaNome}__${i}`;
      const checked = document.querySelector(`input[name="${CSS.escape(name)}"]:checked`);
      if (!checked) {
        throw new Error("Responda todas as perguntas de todas as áreas antes de enviar.");
      }
      pontosArea.push(Number(checked.value));
    }

    payload[areaNome] = pontosArea;
  }

  return payload;
}

function renderResultadoCards(areasObj) {
  const resultGrid = $("#result-grid");
  resultGrid.innerHTML = "";

  Object.entries(areasObj).forEach(([area, res]) => {
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
    pMsg.textContent = res.mensagem || "";
    card.appendChild(pMsg);

    resultGrid.appendChild(card);
  });
}

function renderParecerViabilidade(globalObj, percentualGlobal) {
  const box = $("#viabilidade-parecer");
  if (!globalObj) {
    box.style.display = "none";
    return;
  }

  const faixa = `${globalObj.min_percentual}% a ${globalObj.max_percentual}%`;
  const solucoes = Array.isArray(globalObj.solucoes_ce_infinity)
    ? globalObj.solucoes_ce_infinity
    : [];

  box.innerHTML = `
    <h3>Parecer global — ${globalObj.classificacao_global || ""}</h3>
    <p class="result-score">Faixa: ${faixa} • Maturidade: ${percentualGlobal}%</p>
    ${globalObj.frase_impacto ? `<p><strong>${globalObj.frase_impacto}</strong></p>` : ""}
    ${globalObj.parecer_global ? `<p>${globalObj.parecer_global}</p>` : ""}
    ${globalObj.direcionamento_estrategico ? `<p><strong>Direcionamento estratégico:</strong> ${globalObj.direcionamento_estrategico}</p>` : ""}
    ${
      solucoes.length
        ? `<div class="parecer-solucoes">
            <strong>Soluções CE Infinity recomendadas</strong>
            <ul>${solucoes.map((s) => `<li>${s}</li>`).join("")}</ul>
          </div>`
        : ""
    }
    ${globalObj.cta ? `<p class="parecer-cta"><strong>CTA:</strong> ${globalObj.cta}</p>` : ""}
  `;
  box.style.display = "block";
}

function renderParecerDiagnostico(globalObj) {
  const box = $("#diagnostico-parecer");
  if (!globalObj) {
    box.style.display = "none";
    return;
  }

  const fb = globalObj.feedback_global;
  if (!fb) {
    box.style.display = "none";
    return;
  }

  const faixa = `${fb.min_percentual}% a ${fb.max_percentual}%`;
  const solucoes = Array.isArray(fb.solucoes) ? fb.solucoes : [];
  const areasAlerta = Array.isArray(fb.areas_em_alerta) ? fb.areas_em_alerta : [];

  box.innerHTML = `
    <h3>Parecer global — ${fb.titulo || ""}</h3>
    <p class="result-score">Faixa: ${faixa} • Desempenho: ${globalObj.percentual}%</p>
    ${fb.mensagem ? `<p>${fb.mensagem}</p>` : ""}

    ${
      areasAlerta.length
        ? `<p><strong>Áreas em alerta:</strong> ${areasAlerta.join(", ")}</p>`
        : ""
    }

    ${
      solucoes.length
        ? `<div class="parecer-solucoes">
            <strong>Soluções CE Infinity recomendadas</strong>
            <ul>${solucoes.map((s) => `<li>${s}</li>`).join("")}</ul>
          </div>`
        : ""
    }
  `;

  box.style.display = "block";
}

async function handleEnviarPerguntas() {
  $("#error").textContent = "";

  const btnEnviar = $("#btn-enviar");
  btnEnviar.disabled = true;
  const original = btnEnviar.textContent;
  btnEnviar.textContent = "Enviando...";

  try {
    const respostas = buildPayloadRespostas();

    // montar body conforme endpoints
    const isDiag = currentFormType === "diagnostico";
    const url = isDiag ? ENDPOINTS.diagnostico : ENDPOINTS.viabilidade;

    const body = isDiag
      ? respostas
      : { respostas };

    const data = await apiPost(url, body);

    // Render resultados
    setStep(3);
    $("#btn-pdf").style.display = "inline-block";

    // Diagnóstico: { global: {...}, areas: {...} }
    // Viabilidade: { percentual_global, global, areas }
    if (isDiag) {
      renderParecerDiagnostico(data.global);
      $("#viabilidade-parecer").style.display = "none";
      renderResultadoCards(data.areas || {});
    } else {
      const percentualGlobal = data.percentual_global ?? 0;
      renderParecerViabilidade(data.global, percentualGlobal);
      $("#diagnostico-parecer").style.display = "none";
      renderResultadoCards(data.areas || {});
    }
  } catch (err) {
    console.error(err);
    $("#error").textContent = err?.message || "Erro ao enviar.";
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = original;
  }
}

/* =========================
   PDF (impressão)
   ========================= */
function handlePdf() {
  window.print();
}

/* =========================
   Refazer / Voltar
   ========================= */
function handleVoltarDados() {
  $("#error").textContent = "";
  setStep(1);
}

function handleRefazer() {
  // reseta respostas e volta para dados mantendo tipo
  $("#diagnostico-form").innerHTML = "";
  $("#result-grid").innerHTML = "";
  $("#diagnostico-parecer").style.display = "none";
  $("#viabilidade-parecer").style.display = "none";
  $("#btn-pdf").style.display = "none";
  leadId = null;
  leadPayload = null;

  // limpa forms
  $("#form-empresa")?.reset();
  $("#form-pessoa")?.reset();

  setStep(1);
}

/* =========================
   INIT
   ========================= */
function init() {
  // Selector tipo formulário
  $$(".selector-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setFormType(btn.dataset.form);
    });
  });

  // Botões avançar dados
  const btnAvancarDados = $("#btn-avancar-dados");
  const btnSalvarLead = $("#btnSalvarLead");

  if (btnAvancarDados) {
    btnAvancarDados.addEventListener("click", () => handleAvancarDados(btnAvancarDados));
  }
  if (btnSalvarLead) {
    btnSalvarLead.addEventListener("click", () => handleAvancarDados(btnSalvarLead));
  }

  // Enviar perguntas
  $("#btn-enviar")?.addEventListener("click", handleEnviarPerguntas);

  // Voltar
  $("#btn-voltar-dados")?.addEventListener("click", handleVoltarDados);

  // Refazer
  $("#btn-refazer")?.addEventListener("click", handleRefazer);

  // PDF
  $("#btn-pdf")?.addEventListener("click", handlePdf);

  // default
  setFormType("diagnostico");
}

document.addEventListener("DOMContentLoaded", init);
