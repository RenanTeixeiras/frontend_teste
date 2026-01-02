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
    "Sua empresa define metas de vendas ou faturamento e acompanha os resultados periodicamente?",
    "Sua empresa possui ações planejadas para atrair clientes, seja por meios digitais ou tradicionais?",
    "O atendimento ao cliente e o pós-venda seguem um padrão de qualidade definido pela empresa?",
    "A empresa acompanha quantos contatos ou interessados se transformam em clientes?",
    "A empresa possui ações para fidelizar clientes e estimular novas compras ou contratações?",
  ],
  "Operações & Logística": [
    "A empresa possui processos operacionais definidos e padronizados para executar suas atividades?",
    "A empresa mantém controle atualizado do que vende ou entrega, seja estoque de produtos ou agenda/capacidade de atendimento?",
    "A empresa planeja compras ou uso de recursos com base no histórico de vendas, atendimentos ou demanda esperada?",
    "A empresa analisa perdas, devoluções, cancelamentos ou retrabalhos?",
    "A empresa acompanha regularmente indicadores financeiros e obrigações fiscais para apoiar a tomada de decisão?",
  ],
  "Financeiro & Fiscal": [
    "A empresa controla o fluxo de caixa, acompanhando entradas e saídas futuras e realizadas?",
    "A empresa acompanha mensalmente o resultado financeiro do negócio (receitas, custos e despesas)?",
    "A empresa define um orçamento anual e acompanha se os gastos e receitas estão dentro do planejado?",
    "Os preços dos produtos ou serviços consideram custos, impostos e a margem de lucro desejada?",
    "A empresa acompanha regularmente indicadores financeiros e obrigações fiscais para apoiar a tomada de decisão?",
  ],
  "Pessoas & Cultura": [
    "As funções e responsabilidades de cada pessoa estão claramente definidas?",
    "A empresa oferece treinamentos ou orientações para capacitar a equipe no dia a dia?",
    "A empresa avalia o desempenho da equipe e fornece feedbacks de forma regular?",
    "A empresa acompanha o clima interno e conversa com a equipe sobre melhorias?",
    "A empresa acompanha a saída e a troca de colaboradores para entender os motivos?",
  ],
  "Processos & Qualidade": [
    "Os principais processos da empresa estão documentados ou claramente definidos (mesmo que de forma simples)?",
    "A tecnologia utilizada ajuda no controle das operações e na produtividade da equipe?",
    "A empresa acompanha indicadores para medir desempenho, eficiência e resultados?",
    "A empresa revisa seus processos periodicamente para corrigir falhas e melhorar resultados?",
    "A empresa revisa e confere suas operações para garantir padrão, qualidade e conformidade?",
  ],
  "Estratégia & Governança": [
    "A empresa possui objetivos claros e metas definidas para o curto e médio prazo?",
    "As principais decisões são tomadas com base em dados e informações confiáveis?",
    "A empresa acompanha indicadores para avaliar se os objetivos estratégicos estão sendo alcançados?",
    "A empresa tem clareza sobre oportunidades de crescimento, expansão ou inovação?",
    "As regras de decisão, responsabilidades dos sócios e papéis de liderança estão bem definidos?",
  ],
};

const VIABILIDADE_AREAS = {
  "Problema & Oportunidade": [
    "Você consegue explicar claramente qual problema seu negócio pretende resolver?",
    "Esse problema afeta um número significativo de pessoas ou empresas?",
    "As pessoas afetadas reconhecem que esse problema existe?",
    "Você já identificou sinais de que as pessoas buscam soluções para esse problema?",
    "O mercado apresenta sinais de crescimento ou oportunidades favoráveis para esse tipo de negócio?",
  ],

  "Público-alvo & Mercado": [
    "Você sabe claramente quem é o principal tipo de cliente que o negócio pretende atender?",
    "Você tem uma noção de quanto os clientes estariam dispostos a pagar pelo seu produto ou serviço?",
    "Você já conversou com potenciais clientes sobre sua ideia?",
    "Você tem uma noção do tamanho e do potencial de clientes do mercado onde pretende atuar?",
    "Sua ideia atende a um público específico e bem definido?",
  ],

  "Produto / Serviço & Proposta de valor": [
    "Você consegue explicar sua solução de forma simples e objetiva?",
    "Sua solução possui algum diferencial claro em relação às alternativas já existentes no mercado?",
    "Já está claro como o negócio irá ganhar dinheiro com essa solução?",
    "É possível entregar o produto ou serviço utilizando os recursos que você tem hoje ou pretende ter no início?",
    "Esse negócio permite crescer (mais clientes, vendas ou unidades) sem aumentar os custos na mesma proporção?",
  ],

  "Operação & Estrutura": [
    "Você sabe como seu produto/serviço será produzido, entregue ou executado?",
    "Já consegue identificar quais funções e profissionais serão necessários?",
    "Você já tem acesso, contatos ou caminhos claros para fornecedores e parceiros essenciais ao negócio?",
    "Você já testou a ideia na prática, mesmo que de forma simples (ex.: piloto, teste com clientes ou versão inicial)?",
    "Você já tem clareza se o investimento inicial necessário é compatível com sua realidade financeira?",
  ],

  "Financeiro & Viabilidade": [
    "Você sabe quanto de dinheiro será necessário para iniciar o negócio e mantê-lo funcionando nos primeiros meses?",
    "Você já identificou quais serão os principais custos fixos e variáveis do negócio?",
    "Você consegue estimar quanto o negócio pode faturar nos primeiros meses de operação?",
    "Você sabe aproximadamente quanto precisa faturar para cobrir todos os custos e não ter prejuízo?",
    "Você já identificou os principais riscos financeiros do negócio e formas de reduzir esses riscos?",
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
  const activeStep = stepByScreen[screenId];
  document.querySelectorAll(".step-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.step === activeStep);
  });
}

function setActiveFormType(type) {
  currentFormType = type;

  // selector buttons
  document.querySelectorAll(".selector-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.form === type);
  });

  // show/hide lead forms
  const formEmpresa = $("form-empresa");
  const formPessoa = $("form-pessoa");
  if (formEmpresa && formPessoa) {
    formEmpresa.style.display = type === "diagnostico" ? "block" : "none";
    formPessoa.style.display = type === "viabilidade" ? "block" : "none";
  }

  // reset screens and results
  showScreen("screen-dados");
  clearResults();
  clearErrors();

  // rebuild questions for chosen form
  buildQuestions();
}

function clearErrors() {
  const errorEl = $("error");
  if (errorEl) errorEl.textContent = "";
}

function clearResults() {
  const diag = $("diagnostico-parecer");
  const via = $("viabilidade-parecer");
  const grid = $("result-grid");
  const btnPdf = $("btn-pdf");

  if (diag) diag.style.display = "none";
  if (via) via.style.display = "none";
  if (grid) grid.innerHTML = "";
  if (btnPdf) btnPdf.style.display = "none";
}

/* ============================
   BUILD QUESTIONS
============================ */
function buildQuestions() {
  const formEl = $("diagnostico-form");
  if (!formEl) return;

  formEl.innerHTML = "";

  const areas = currentFormType === "diagnostico" ? DIAGNOSTICO_AREAS : VIABILIDADE_AREAS;

  Object.entries(areas).forEach(([areaNome, perguntas]) => {
    const areaCard = document.createElement("section");
    areaCard.className = "area-card card"; // mantém seu estilo

    const h2 = document.createElement("h2");
    h2.className = "card-title";
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

/* ============================
   SUBMIT HELPERS
============================ */
function collectAnswers() {
  const areas = currentFormType === "diagnostico" ? DIAGNOSTICO_AREAS : VIABILIDADE_AREAS;

  const payload = {};
  for (const [areaNome, perguntas] of Object.entries(areas)) {
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

async function postJson(url, body) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Erro ao chamar API (${resp.status}): ${detail || "sem detalhes"}`);
  }

  return resp.json();
}

/* ============================
   RENDER RESULTS
============================ */
function renderResultadosDiagnostico(data) {
  const resultadosTitle = $("resultados-title");
  const grid = $("result-grid");
  const diagParecerEl = $("diagnostico-parecer");
  const viaParecerEl = $("viabilidade-parecer");

  if (resultadosTitle) resultadosTitle.textContent = "Resultados — Diagnóstico";
  if (viaParecerEl) viaParecerEl.style.display = "none";
  if (grid) grid.innerHTML = "";

  // Global
  const globalData = data.global || data.global_;
  if (diagParecerEl && globalData) {
    const fb = globalData.feedback_global;

    if (fb) {
      diagParecerEl.innerHTML = `
        <h3>Parecer global</h3>
        <p><strong>Percentual:</strong> ${normalizePercent(globalData.percentual)}%</p>
        <p><strong>${escapeHtml(fb.titulo || "")}</strong></p>
        <p style="white-space:pre-line;">${escapeHtml(fb.mensagem || "")}</p>
        ${
          Array.isArray(fb.areas_em_alerta) && fb.areas_em_alerta.length
            ? `<p><strong>Áreas em alerta:</strong> ${fb.areas_em_alerta.map(escapeHtml).join(", ")}</p>`
            : ""
        }
        ${
          Array.isArray(fb.solucoes) && fb.solucoes.length
            ? `<p><strong>Soluções recomendadas:</strong></p>
               <ul>${fb.solucoes.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
            : ""
        }
      `;
      diagParecerEl.style.display = "block";
    } else {
      diagParecerEl.style.display = "none";
    }
  }

  // Areas
  const areas = data.areas || {};
  Object.entries(areas).forEach(([area, res]) => {
    const card = document.createElement("div");
    card.className = "result-card";

    card.innerHTML = `
      <h3>${escapeHtml(area)}</h3>
      <p class="result-score">Pontuação: ${res.total_pontos} / ${res.pontuacao_maxima} (${normalizePercent(res.percentual)}%)</p>
      <p class="result-message" style="white-space:pre-line;">${escapeHtml(res.mensagem)}</p>
    `;

    grid.appendChild(card);
  });
}

function renderResultadosViabilidade(data) {
  const resultadosTitle = $("resultados-title");
  const grid = $("result-grid");
  const diagParecerEl = $("diagnostico-parecer");
  const viaParecerEl = $("viabilidade-parecer");

  if (resultadosTitle) resultadosTitle.textContent = "Resultados — Viabilidade";
  if (diagParecerEl) diagParecerEl.style.display = "none";
  if (grid) grid.innerHTML = "";

  // Global
  const global = data.global ?? data.parecer_global;
  const percentualGlobal = normalizePercent(data.percentual_global);

  if (viaParecerEl && global) {
    const solucoesArr = global.solucoes_ce_infinity || global.solucoes || [];
    viaParecerEl.innerHTML = `
      <h3>Parecer global — ${escapeHtml(global.classificacao_global || global.classificacao || "")}</h3>
      ${
        global.min_percentual != null && global.max_percentual != null
          ? `<p class="muted">Faixa: ${global.min_percentual}% a ${global.max_percentual}% • Maturidade: ${percentualGlobal}%</p>`
          : `<p class="muted">Maturidade: ${percentualGlobal}%</p>`
      }
      ${
        global.frase_impacto
          ? `<p><strong>${escapeHtml(global.frase_impacto)}</strong></p>`
          : ""
      }
      ${
        global.parecer_global
          ? `<p style="white-space:pre-line;">${escapeHtml(global.parecer_global)}</p>`
          : global.mensagem
            ? `<p style="white-space:pre-line;">${escapeHtml(global.mensagem)}</p>`
            : ""
      }
      ${
        global.direcionamento_estrategico
          ? `<p><strong>Direcionamento:</strong> ${escapeHtml(global.direcionamento_estrategico)}</p>`
          : ""
      }
      ${
        Array.isArray(solucoesArr) && solucoesArr.length
          ? `<p><strong>Soluções CE Infinity recomendadas:</strong></p>
             <ul>${solucoesArr.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
          : ""
      }
      ${
        global.cta
          ? `<p><strong>${escapeHtml(global.cta)}</strong></p>`
          : ""
      }
    `;
    viaParecerEl.style.display = "block";
  } else if (viaParecerEl) {
    viaParecerEl.style.display = "none";
  }

  // Areas
  const areas = data.areas || {};
  Object.entries(areas).forEach(([area, res]) => {
    const card = document.createElement("div");
    card.className = "result-card";

    card.innerHTML = `
      <h3>${escapeHtml(area)}</h3>
      <p class="result-score">Pontuação: ${res.total_pontos} / ${res.pontuacao_maxima} (${normalizePercent(res.percentual)}%)</p>
      <p class="result-message" style="white-space:pre-line;">${escapeHtml(res.mensagem)}</p>
    `;

    grid.appendChild(card);
  });
}

function renderResultados(data) {
  showScreen("screen-resultados");

  if (currentFormType === "diagnostico") {
    renderResultadosDiagnostico(data);
  } else {
    renderResultadosViabilidade(data);
  }

  const btnPdf = $("btn-pdf");
  if (btnPdf) btnPdf.style.display = "inline-block";
}

/* ============================
   LEADS (DADOS)
============================ */
function getFormData(formEl) {
  const fd = new FormData(formEl);
  const obj = {};
  for (const [k, v] of fd.entries()) obj[k] = String(v).trim();
  return obj;
}

function validateEmpresa(data) {
  // regra simples: se segmento=franquia, numero_unidades obrigatório
  if (data.segmento === "franquia") {
    const n = Number(data.numero_unidades ?? 0);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error("Informe o Nº de unidades (se franquia).");
    }
  }
}

async function salvarLeadEIrPerguntas() {
  clearErrors();
  try {
    if (currentFormType === "diagnostico") {
      const formEmpresa = $("form-empresa");
      if (!formEmpresa) throw new Error("Form de empresa não encontrado.");
      const data = getFormData(formEmpresa);
      validateEmpresa(data);

      // POST empresa
      const resp = await postJson(API_EMPRESAS, data);
      leadId = resp?.id ?? resp?.empresa_id ?? null;
    } else {
      const formPessoa = $("form-pessoa");
      if (!formPessoa) throw new Error("Form de pessoa não encontrado.");
      const data = getFormData(formPessoa);

      // POST pessoa
      const resp = await postJson(API_PESSOAS, data);
      leadId = resp?.id ?? resp?.pessoa_id ?? null;
    }

    // vai para perguntas
    showScreen("screen-perguntas");
  } catch (err) {
    console.error(err);
    const errorEl = $("error");
    if (errorEl) errorEl.textContent = err.message || "Erro ao salvar dados.";
  }
}

/* ============================
   INIT + EVENTS
============================ */
function init() {
  // selector buttons
  document.querySelectorAll(".selector-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveFormType(btn.dataset.form);
    });
  });

  // botões dados -> perguntas
  const btnAvancarEmpresa = $("btn-avancar-dados");
  if (btnAvancarEmpresa) btnAvancarEmpresa.addEventListener("click", salvarLeadEIrPerguntas);

  const btnSalvarLead = $("btnSalvarLead");
  if (btnSalvarLead) btnSalvarLead.addEventListener("click", salvarLeadEIrPerguntas);

  // voltar
  const btnVoltar = $("btn-voltar-dados");
  if (btnVoltar) btnVoltar.addEventListener("click", () => showScreen("screen-dados"));

  // enviar perguntas
  const btnEnviar = $("btn-enviar");
  if (btnEnviar) {
    btnEnviar.addEventListener("click", async () => {
      clearErrors();

      const btn = btnEnviar;
      btn.disabled = true;
      btn.textContent = "Enviando...";

      try {
        const respostas = collectAnswers();

        const endpoint = currentFormType === "diagnostico" ? API_DIAGNOSTICO : API_VIABILIDADE;

        // Diagnóstico: body é root dict (áreas -> lista)
        // Viabilidade: schema atual costuma ser {"respostas": {...}} ou root? Aqui enviamos no formato do seu schema atual:
        const body = currentFormType === "diagnostico" ? respostas : { respostas };

        const data = await postJson(endpoint, body);
        renderResultados(data);
      } catch (err) {
        console.error(err);
        const errorEl = $("error");
        if (errorEl) errorEl.textContent = err.message || "Erro ao enviar.";
      } finally {
        btn.disabled = false;
        btn.textContent = "Enviar";
      }
    });
  }

  // refazer
  const btnRefazer = $("btn-refazer");
  if (btnRefazer) {
    btnRefazer.addEventListener("click", () => {
      // limpa radios
      document.querySelectorAll('#diagnostico-form input[type="radio"]').forEach((i) => (i.checked = false));
      clearResults();
      showScreen("screen-dados");
      leadId = null;
    });
  }

  // pdf (print)
  const btnPdf = $("btn-pdf");
  if (btnPdf) btnPdf.addEventListener("click", () => window.print());

  // default
  buildQuestions();
  setActiveFormType("diagnostico");
}

document.addEventListener("DOMContentLoaded", init);
