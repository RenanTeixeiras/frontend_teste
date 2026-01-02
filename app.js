/* ============================
   CONFIG
============================ */
const API_BASE = "https://ce-infinity.onrender.com/api";

// Endpoints
const API_DIAGNOSTICO = `${API_BASE}/diagnostico`;
const API_VIABILIDADE = `${API_BASE}/viabilidade`;

// Leads (ajuste se seus endpoints forem outros)
const API_EMPRESAS = `${API_BASE}/empresas`;
const API_PESSOAS = `${API_BASE}/pessoas`;

/* ============================
   PERGUNTAS (ATUALIZADAS)
   (mesmos nomes do banco/seed)
============================ */
const DIAGNOSTICO_AREAS = {
  "Marketing & Vendas": [
    "Existe uma estratégia de marketing e vendas definida e em execução?",
    "A empresa conhece e acompanha seu funil comercial (leads, conversão, ticket médio)?",
    "Os canais de aquisição e relacionamento com o cliente são bem utilizados?",
    "O atendimento e pós-venda seguem um padrão de qualidade definido?",
    "A empresa possui indicadores comerciais e metas acompanhadas regularmente?",
  ],
  "Operações & Logística": [
    "A empresa possui processos operacionais padronizados e documentados?",
    "Existe controle eficiente de estoque ou capacidade de produção/atendimento?",
    "O ciclo operacional (do pedido à entrega) é medido e otimizado?",
    "Há monitoramento de perdas, devoluções ou retrabalhos?",
    "A empresa possui fornecedores e parcerias estratégicas bem gerenciadas?",
  ],
  "Financeiro & Fiscal": [
    "A empresa possui controle de fluxo de caixa (real e projetado)?",
    "A empresa apura e analisa DRE mensalmente?",
    "Existe planejamento financeiro e orçamentário anual?",
    "A precificação é baseada em custos, impostos e margem desejada?",
    "A empresa acompanha indicadores financeiros e fiscais (inadimplência, impostos, etc.)?",
  ],
  "Pessoas & Cultura": [
    "Cargos e responsabilidades estão claramente definidos?",
    "A empresa realiza treinamentos ou capacitações periódicas?",
    "Existe avaliação de desempenho ou feedback estruturado?",
    "O clima organizacional é acompanhado e discutido com a equipe?",
    "A empresa monitora rotatividade e mantém políticas de retenção?",
  ],
  "Processos & Qualidade": [
    "A empresa possui manuais, fluxogramas ou rotinas documentadas?",
    "Existe controle de qualidade e padrões para execução do serviço/produto?",
    "Os indicadores de desempenho (KPIs) são definidos e acompanhados?",
    "Há rotina de revisão e melhoria contínua dos processos?",
    "A empresa realiza auditorias internas ou controles de conformidade?",
  ],
  "Estratégia & Governança": [
    "A empresa possui planejamento estratégico e metas claras?",
    "As decisões são tomadas com base em dados e relatórios de desempenho?",
    "Há acompanhamento periódico de indicadores estratégicos?",
    "Existe clareza sobre oportunidades de expansão, inovação ou novos produtos?",
    "A empresa possui governança definida (papéis, sócios, gestão, processos decisórios)?",
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

/* ============================
   OPÇÕES DE RESPOSTA
   (API agora usa 2/1/0 em ambos)
============================ */
const ANSWER_OPTIONS = [
  { label: "Sim", value: 2, description: "2 pontos" },
  { label: "Não", value: 1, description: "1 ponto" },
  { label: "Não sei", value: 0, description: "0 pontos" },
];

/* ============================
   STATE + HELPERS
============================ */
let currentFormType = "diagnostico"; // "diagnostico" | "viabilidade"
let leadId = null;

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizePercent(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round(x * 100) / 100;
}

function showScreen(screenId) {
  const screens = ["screen-dados", "screen-perguntas", "screen-resultados"];
  screens.forEach((id) => {
    const el = $(id);
    if (el) el.style.display = id === screenId ? "block" : "none";
  });

  // step chips
  const stepByScreen = {
    "screen-dados": "1",
    "screen-perguntas": "2",
    "screen-resultados": "3",
  };
  const currentStep = stepByScreen[screenId];
  document.querySelectorAll(".step-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.step === currentStep);
  });
}

function setFormType(type) {
  currentFormType = type;

  // selector buttons
  document.querySelectorAll(".selector-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.form === type);
  });

  // switch data forms (empresa/pessoa)
  const formEmpresa = $("form-empresa");
  const formPessoa = $("form-pessoa");
  if (type === "diagnostico") {
    if (formEmpresa) formEmpresa.style.display = "block";
    if (formPessoa) formPessoa.style.display = "none";
  } else {
    if (formEmpresa) formEmpresa.style.display = "none";
    if (formPessoa) formPessoa.style.display = "block";
  }

  // clear errors/results
  const errorEl = $("error");
  if (errorEl) errorEl.textContent = "";

  // rebuild questions (screen 2)
  buildQuestionsForm();
}

/* ============================
   BUILD QUESTIONS FORM
============================ */
function buildQuestionsForm() {
  const formEl = $("diagnostico-form");
  if (!formEl) return;
  formEl.innerHTML = "";

  const AREAS =
    currentFormType === "diagnostico" ? DIAGNOSTICO_AREAS : VIABILIDADE_AREAS;

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

      ANSWER_OPTIONS.forEach((opt) => {
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

/* ============================
   LEAD SUBMIT (empresa/pessoa)
============================ */
async function salvarEmpresa() {
  const form = $("form-empresa");
  if (!form) throw new Error("Formulário da empresa não encontrado.");

  const fd = new FormData(form);
  const payload = Object.fromEntries(fd.entries());

  // normalizações simples
  payload.numero_unidades = payload.numero_unidades ? Number(payload.numero_unidades) : 0;
  payload.numero_colaboradores = payload.numero_colaboradores
    ? Number(payload.numero_colaboradores)
    : 0;

  const resp = await fetch(API_EMPRESAS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Erro ao salvar empresa (${resp.status}): ${t}`);
  }

  const data = await resp.json();
  leadId = data.id ?? null;
  return data;
}

async function salvarPessoa() {
  const form = $("form-pessoa");
  if (!form) throw new Error("Formulário da pessoa não encontrado.");

  const fd = new FormData(form);
  const payload = Object.fromEntries(fd.entries());

  // map boolean-ish / enums se necessário
  // (mantive simples)

  const resp = await fetch(API_PESSOAS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Erro ao salvar pessoa (${resp.status}): ${t}`);
  }

  const data = await resp.json();
  leadId = data.id ?? null;
  return data;
}

/* ============================
   SEND QUESTIONS
============================ */
function buildPayloadFromAnswers() {
  const AREAS =
    currentFormType === "diagnostico" ? DIAGNOSTICO_AREAS : VIABILIDADE_AREAS;

  const payload = {};

  for (const [areaNome, perguntas] of Object.entries(AREAS)) {
    const pontosArea = [];

    for (let i = 0; i < perguntas.length; i++) {
      const name = `${areaNome}__${i}`;
      const checked = document.querySelector(
        `input[name="${CSS.escape(name)}"]:checked`
      );

      if (!checked) {
        throw new Error("Responda todas as perguntas antes de enviar.");
      }

      pontosArea.push(Number(checked.value));
    }

    payload[areaNome] = pontosArea;
  }

  return payload;
}

async function enviarDiagnostico(payload) {
  const resp = await fetch(API_DIAGNOSTICO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload), // RootModel: dict direto
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Erro ao chamar diagnóstico (${resp.status}): ${t}`);
  }

  return resp.json();
}

async function enviarViabilidade(payload) {
  const resp = await fetch(API_VIABILIDADE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // ViabilidadeRequest: { respostas: {...} }
    body: JSON.stringify({ respostas: payload }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Erro ao chamar viabilidade (${resp.status}): ${t}`);
  }

  return resp.json();
}

/* ============================
   RENDER RESULTS
============================ */
function renderResultados(data) {
  const resultadosTitle = $("resultados-title");
  const resultGrid = $("result-grid");
  const diagnosticoParecer = $("diagnostico-parecer");
  const viabilidadeParecer = $("viabilidade-parecer");

  if (!resultGrid || !resultadosTitle) return;

  resultGrid.innerHTML = "";
  if (diagnosticoParecer) {
    diagnosticoParecer.style.display = "none";
    diagnosticoParecer.innerHTML = "";
  }
  if (viabilidadeParecer) {
    viabilidadeParecer.style.display = "none";
    viabilidadeParecer.innerHTML = "";
  }

  resultadosTitle.textContent =
    currentFormType === "diagnostico"
      ? "Resultados (Diagnóstico Empresarial)"
      : "Resultados (Viabilidade de Novas Ideias)";

  if (currentFormType === "diagnostico") {
    // formato atual:
    // { global: {percentual, feedback_global{...}}, areas: {...} }
    const areasData = data.areas || {};

    Object.entries(areasData).forEach(([area, res]) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const total = res.total_pontos ?? "-";
      const max = res.pontuacao_maxima ?? "-";
      const perc = normalizePercent(res.percentual ?? 0);

      card.innerHTML = `
        <h3>${escapeHtml(area)}</h3>
        <p class="result-score">Pontuação: ${total} / ${max} (${perc}%)</p>
        <p class="result-message">${escapeHtml(res.mensagem ?? "")}</p>
      `;

      resultGrid.appendChild(card);
    });

    // GLOBAL vindo do banco (via API)
    const g = data.global || data.global_ || null;
    const fg = g?.feedback_global || null;

    if (fg && diagnosticoParecer) {
      const percGlobal = normalizePercent(g.percentual ?? 0);

      const areasEmAlerta =
        Array.isArray(fg.areas_em_alerta) && fg.areas_em_alerta.length
          ? fg.areas_em_alerta
          : [];

      const solucoes =
        Array.isArray(fg.solucoes) && fg.solucoes.length ? fg.solucoes : [];

      diagnosticoParecer.style.display = "block";
      diagnosticoParecer.innerHTML = `
        <div class="parecer-title">Parecer global — ${escapeHtml(fg.titulo || "")}</div>
        <div class="parecer-meta">Faixa: ${fg.min_percentual}% a ${fg.max_percentual}% • Global: ${percGlobal}%</div>
        <div class="parecer-msg" style="white-space: pre-wrap;">${escapeHtml(fg.mensagem || "")}</div>

        ${
          areasEmAlerta.length
            ? `
              <h4 style="margin: 12px 0 6px;">Áreas em alerta</h4>
              <ul style="margin:0; padding-left: 18px;">
                ${areasEmAlerta.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}
              </ul>
            `
            : ""
        }

        ${
          solucoes.length
            ? `
              <h4 style="margin: 12px 0 6px;">Soluções recomendadas</h4>
              <ul style="margin:0; padding-left: 18px;">
                ${solucoes.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
              </ul>
            `
            : ""
        }
      `;
    }
  } else {
    // viabilidade atual:
    // { percentual_global, areas: { area: {percentual, mensagem, faixa} } }
    const areasData = data.areas || {};

    Object.entries(areasData).forEach(([area, res]) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const total = res.total_pontos ?? "-";
      const max = res.pontuacao_maxima ?? "-";
      const perc = normalizePercent(res.percentual ?? 0);

      const faixaTxt = res.faixa
        ? `Faixa: ${res.faixa.min_percentual}% a ${res.faixa.max_percentual}%`
        : "";

      card.innerHTML = `
        <h3>${escapeHtml(area)}</h3>
        <p class="result-score">Pontuação: ${total} / ${max} (${perc}%)</p>
        ${faixaTxt ? `<p class="result-score">${escapeHtml(faixaTxt)}</p>` : ""}
        ${res.mensagem ? `<p class="result-message">${escapeHtml(res.mensagem)}</p>` : ""}
      `;

      resultGrid.appendChild(card);
    });

    // se sua API devolver parecer_global no futuro, já deixei pronto:
    if (data.parecer_global && viabilidadeParecer) {
      const pg = data.parecer_global;
      const maturidade = normalizePercent(
        data.percentual_maturidade ?? data.percentual_global ?? 0
      );

      const msg = pg.mensagem || "";
      const hasSolucoesNoTexto = /Soluções\s*CE\s*Infinity\s*recomendadas/i.test(msg);

      let solucoesHtml = "";
      if (Array.isArray(pg.solucoes) && pg.solucoes.length && !hasSolucoesNoTexto) {
        solucoesHtml = `
          <h4 style="margin: 12px 0 6px;">Soluções CE Infinity recomendadas</h4>
          <ul style="margin:0; padding-left: 18px;">
            ${pg.solucoes.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
          </ul>
        `;
      }

      viabilidadeParecer.style.display = "block";
      viabilidadeParecer.innerHTML = `
        <div class="parecer-title">Parecer global — ${escapeHtml(pg.classificacao || "")}</div>
        <div class="parecer-meta">Faixa: ${pg.min_percentual}% a ${pg.max_percentual}% • Maturidade: ${maturidade}%</div>
        <div class="parecer-msg" style="white-space: pre-wrap;">${escapeHtml(msg)}</div>
        ${solucoesHtml}
      `;
    }
  }

  showScreen("screen-resultados");
}

/* ============================
   EVENTS
============================ */
function bindEvents() {
  // selector
  document.querySelectorAll(".selector-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setFormType(btn.dataset.form);
    });
  });

  // avançar (empresa)
  const btnAvancarDados = $("btn-avancar-dados");
  if (btnAvancarDados) {
    btnAvancarDados.addEventListener("click", async () => {
      const errorEl = $("error");
      if (errorEl) errorEl.textContent = "";

      try {
        await salvarEmpresa();
        buildQuestionsForm();
        showScreen("screen-perguntas");
      } catch (e) {
        console.error(e);
        if (errorEl) errorEl.textContent = e.message || "Erro ao salvar empresa.";
      }
    });
  }

  // avançar (pessoa)
  const btnSalvarLead = $("btnSalvarLead");
  if (btnSalvarLead) {
    btnSalvarLead.addEventListener("click", async () => {
      const errorEl = $("error");
      if (errorEl) errorEl.textContent = "";

      try {
        await salvarPessoa();
        buildQuestionsForm();
        showScreen("screen-perguntas");
      } catch (e) {
        console.error(e);
        if (errorEl) errorEl.textContent = e.message || "Erro ao salvar pessoa.";
      }
    });
  }

  // voltar
  const btnVoltar = $("btn-voltar-dados");
  if (btnVoltar) {
    btnVoltar.addEventListener("click", () => {
      showScreen("screen-dados");
    });
  }

  // enviar respostas
  const btnEnviar = $("btn-enviar");
  if (btnEnviar) {
    btnEnviar.addEventListener("click", async () => {
      const errorEl = $("error");
      if (errorEl) errorEl.textContent = "";

      btnEnviar.disabled = true;
      const oldText = btnEnviar.textContent;
      btnEnviar.textContent = "Enviando...";

      try {
        const payload = buildPayloadFromAnswers();

        const data =
          currentFormType === "diagnostico"
            ? await enviarDiagnostico(payload)
            : await enviarViabilidade(payload);

        renderResultados(data);
      } catch (e) {
        console.error(e);
        if (errorEl) errorEl.textContent = e.message || "Erro ao enviar.";
      } finally {
        btnEnviar.disabled = false;
        btnEnviar.textContent = oldText;
      }
    });
  }

  // refazer
  const btnRefazer = $("btn-refazer");
  if (btnRefazer) {
    btnRefazer.addEventListener("click", () => {
      // limpa respostas
      document
        .querySelectorAll(`#diagnostico-form input[type="radio"]`)
        .forEach((i) => (i.checked = false));

      const errorEl = $("error");
      if (errorEl) errorEl.textContent = "";

      showScreen("screen-dados");
    });
  }

  // pdf (impressão)
  const btnPdf = $("btn-pdf");
  if (btnPdf) {
    btnPdf.addEventListener("click", () => window.print());
  }
}

/* ============================
   INIT
============================ */
(function init() {
  // default
  setFormType("diagnostico");
  buildQuestionsForm();
  showScreen("screen-dados");
  bindEvents();
})();
