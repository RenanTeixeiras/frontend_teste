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

/* =========================
   PERGUNTAS
   (Se você já tem isso no seu app.js antigo, pode substituir esta parte
   pelas suas variáveis existentes.)
========================= */
const DIAGNOSTICO_AREAS = {
  Marketing: [
    "Sua empresa tem metas de vendas mensais e acompanha os resultados?",
    "Existe uma estratégia de marketing digital ativa (redes sociais, anúncios, e-mail etc.)?",
    "O atendimento e o pós-venda seguem um padrão de qualidade definido?",
    "A taxa de conversão de clientes é monitorada e analisada regularmente?",
    "A fidelização e recompras dos clientes fazem parte da estratégia comercial?",
  ],
  Operações: [
    "A empresa possui processos operacionais formalizados e padronizados?",
    "Existe controle atualizado de estoque (ou agenda de capacidade, se for serviço)?",
    "As compras são planejadas com base em previsões e indicadores de demanda?",
    "O ciclo operacional (do pedido à entrega) é medido e acompanhado?",
    "A empresa analisa perdas, devoluções ou retrabalhos?",
  ],
  Financeiro: [
    "A empresa possui controle de fluxo de caixa projetado e realizado?",
    "O DRE é apurado mensalmente e analisado por unidade?",
    "Há planejamento orçamentário anual e acompanhamento do realizado x orçado?",
    "A precificação leva em conta custos, impostos e margem desejada?",
    "Existe acompanhamento de indicadores financeiros e fiscais?",
  ],
  Pessoas: [
    "A empresa tem cargos e responsabilidades claramente definidos?",
    "Existem treinamentos ou capacitações periódicas?",
    "Há avaliações de desempenho formais ou feedbacks estruturados?",
    "O clima organizacional é acompanhado e discutido com a equipe?",
    "O índice de rotatividade é monitorado e analisado?",
  ],
  Processos: [
    "Existem manuais operacionais ou fluxogramas documentados?",
    "O uso da tecnologia contribui para o controle e produtividade?",
    "Os indicadores de desempenho (KPIs) são definidos e acompanhados?",
    "Há rotina de revisão e melhoria contínua dos processos?",
    "As operações são auditadas periodicamente?",
  ],
  Estratégia: [
    "A empresa possui um plano estratégico formalizado e metas claras?",
    "As decisões são baseadas em dados e relatórios de desempenho?",
    "Há acompanhamento periódico de indicadores estratégicos?",
    "A empresa tem clareza sobre oportunidades de expansão ou inovação?",
    "A estrutura societária e a governança são formalizadas e revisadas?",
  ],
};

const VIABILIDADE_AREAS = {
  "Problema e oportunidade": [
    "Você consegue explicar claramente qual problema seu negócio pretende resolver?",
    "Esse problema afeta um público numeroso ou relevante?",
    "As pessoas afetadas reconhecem que esse problema existe?",
    "Existem evidências de que esse problema gera demanda por soluções?",
    "Há tendências favoráveis no mercado relacionadas ao seu negócio?",
  ],
  "Público-alvo e mercado": [
    "Você sabe claramente quem é o cliente ideal do negócio?",
    "Você sabe quanto o cliente estaria disposto a pagar pela solução?",
    "Você já conversou com potenciais clientes sobre sua ideia?",
    "Você conhece o tamanho estimado do mercado onde vai atuar?",
    "Sua ideia atende a um nicho específico e bem definido?",
  ],
  "Solução e modelo de negócio": [
    "Você consegue explicar sua solução de forma simples e objetiva?",
    "Sua solução tem diferenciais claros em relação ao que já existe no mercado?",
    "O modelo de receita do negócio já está definido?",
    "A entrega do produto/serviço é viável com os recursos iniciais disponíveis?",
    "A solução permite escalabilidade no médio ou longo prazo?",
  ],
  "Operação e estrutura": [
    "Você sabe como seu produto/serviço será produzido, entregue ou executado?",
    "Já consegue identificar quais funções e profissionais serão necessários?",
    "Você já tem acesso (ou caminhos de acesso) aos fornecedores e parceiros principais?",
    "Você possui protótipo, MVP ou qualquer validação inicial da solução?",
    "O início da operação exige investimento baixo ou moderado?",
  ],
  "Finanças e riscos": [
    "Você sabe o valor necessário para iniciar o negócio?",
    "Já conhece seus custos fixos e variáveis?",
    "Consegue estimar a receita prevista nos primeiros meses?",
    "Você sabe qual é o ponto de equilíbrio do negócio?",
    "Já identificou os principais riscos do negócio e possíveis mitigadores?",
  ],
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
  new FormData(formEl).forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

function normalizePercent(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return x;
}

/* =========================
   SELETOR (Diagnóstico x Viabilidade)
========================= */
function applyFormType(type) {
  currentFormType = type;

  selectorBtns.forEach((b) => {
    b.classList.toggle("active", b.dataset.form === type);
  });

  // troca forms de dados
  if (type === "diagnostico") {
    formEmpresa.style.display = "block";
    formPessoa.style.display = "none";
  } else {
    formEmpresa.style.display = "none";
    formPessoa.style.display = "block";
  }

  // reseta
  leadId = null;
  clearError();
  diagnosticoForm.innerHTML = "";
  resultGrid.innerHTML = "";
  diagnosticoParecer.style.display = "none";
  viabilidadeParecer.style.display = "none";
  btnPdf.style.display = "none";
  resultadosTitle.textContent = "Resultados";

  // volta para tela 1 sempre que trocar o tipo
  showScreen("dados");
  setStep(1);
}

selectorBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const type = btn.dataset.form;
    applyFormType(type);
  });
});

/* =========================
   GERAR PERGUNTAS
========================= */
function renderPerguntas() {
  diagnosticoForm.innerHTML = "";
  clearError();

  const areas =
    currentFormType === "diagnostico" ? DIAGNOSTICO_AREAS : VIABILIDADE_AREAS;

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
   SALVAR LEAD E AVANÇAR
========================= */
async function salvarLeadEAvancar() {
  clearError();

  const isDiagnostico = currentFormType === "diagnostico";

  // validação HTML (required)
  const form = isDiagnostico ? formEmpresa : formPessoa;
  if (!form.reportValidity()) {
    return;
  }

  // monta payload de acordo com API
  let endpoint = "";
  let body = {};

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
  if (isDiagnostico && body.segmento === "franquia" && (!body.numero_unidades || body.numero_unidades <= 0)) {
    // mostra erro em alert pq na tela de dados não tem #error visível
    alert("Se o segmento for Franquia, informe um número de unidades maior que 0.");
    return;
  }

  // feedback de loading (sem mexer no layout)
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
      throw new Error(txt || `Erro ao salvar ${isDiagnostico ? "empresa" : "pessoa"}.`);
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

  const areas =
    currentFormType === "diagnostico" ? DIAGNOSTICO_AREAS : VIABILIDADE_AREAS;

  // monta payload { "Area": [0,1,2...] }
  const respostasPorArea = {};

  for (const [areaNome, perguntas] of Object.entries(areas)) {
    const pontos = [];

    for (let i = 0; i < perguntas.length; i++) {
      const name = `${areaNome}__${i}`;
      const checked = document.querySelector(
        `input[name="${CSS.escape(name)}"]:checked`
      );

      if (!checked) {
        setError("Responda todas as perguntas antes de enviar.");
        return;
      }

      pontos.push(Number(checked.value));
    }

    respostasPorArea[areaNome] = pontos;
  }

  const endpoint =
    currentFormType === "diagnostico" ? API_DIAGNOSTICO_URL : API_VIABILIDADE_URL;

  // Diagnóstico: body direto
  // Viabilidade: { respostas: {...} }
  const body =
    currentFormType === "diagnostico"
      ? respostasPorArea
      : { respostas: respostasPorArea };

  btnEnviar.disabled = true;
  const oldTxt = btnEnviar.textContent;
  btnEnviar.textContent = "Enviando...";

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(txt || `Erro ao enviar ${currentFormType}.`);
    }

    const data = await resp.json();

    // limpa resultados
    resultGrid.innerHTML = "";
    diagnosticoParecer.style.display = "none";
    viabilidadeParecer.style.display = "none";
    btnPdf.style.display = "inline-block";

    // define título
    resultadosTitle.textContent =
      currentFormType === "diagnostico"
        ? "Resultado do Diagnóstico"
        : "Resultado da Viabilidade";

    // render por área
    if (currentFormType === "diagnostico") {
      // retorno típico do diagnóstico:
      // { areas: { Marketing: {...} }, percentual_global, parecer_global: {...} ... }
      const areasData = data.areas || data; // fallback

      Object.entries(areasData).forEach(([area, res]) => {
        if (!res || typeof res !== "object") return;

        const card = document.createElement("div");
        card.className = "result-card";

        const total = res.total_pontos ?? "-";
        const max = res.pontuacao_maxima ?? "-";
        const perc = normalizePercent(res.percentual ?? 0);

        card.innerHTML = `
          <h3>${escapeHtml(area)}</h3>
          <p class="result-score">Pontuação: ${total} / ${max} (${perc}%)</p>
          ${res.mensagem ? `<p class="result-message">${escapeHtml(res.mensagem)}</p>` : ""}
        `;

        resultGrid.appendChild(card);
      });

      // parecer global do diagnóstico (novo)
      if (data.parecer_global) {
        const pg = data.parecer_global;
        const percGlobal = normalizePercent(data.percentual_global ?? pg.percentual_global ?? 0);

        diagnosticoParecer.style.display = "block";
        diagnosticoParecer.innerHTML = `
          <h3>Parecer global — ${escapeHtml(pg.classificacao || "")}</h3>
          <p class="result-score">
            Faixa: ${escapeHtml(pg.min_percentual)}% a ${escapeHtml(pg.max_percentual)}% • Desempenho global: ${escapeHtml(percGlobal)}%
          </p>
          <pre class="result-message" style="white-space: pre-wrap; margin:0;">${escapeHtml(pg.mensagem || "")}</pre>
        `;
      }
    } else {
      // retorno típico viabilidade:
      // { areas: {...}, percentual_maturidade, parecer_global: {...}, mensagem: ... }
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
        `;

        resultGrid.appendChild(card);
      });

      // parecer global viabilidade
      if (data.parecer_global) {
        const pg = data.parecer_global;
        const maturidade = normalizePercent(data.percentual_maturidade ?? 0);

        // evita duplicar "Soluções..." se a mensagem já contém.
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
          <h3>Parecer global — ${escapeHtml(pg.classificacao || "")}</h3>
          <p class="result-score">
            Faixa: ${escapeHtml(pg.min_percentual)}% a ${escapeHtml(pg.max_percentual)}% • Maturidade: ${escapeHtml(maturidade)}%
          </p>
          <pre class="result-message" style="white-space: pre-wrap; margin:0;">${escapeHtml(msg)}</pre>
          ${solucoesHtml}
        `;
      }
    }

    // vai para tela 3
    showScreen("resultados");
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    setError(err?.message || "Erro ao enviar. Tente novamente.");
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

  // limpa respostas marcadas
  const checked = document.querySelectorAll('input[type="radio"]:checked');
  checked.forEach((i) => (i.checked = false));

  // volta para perguntas
  showScreen("perguntas");
  setStep(2);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* =========================
   PDF (impressão)
========================= */
btnPdf?.addEventListener("click", () => {
  window.print();
});

/* =========================
   INIT
========================= */
(function init() {
  // inicia no diagnóstico
  applyFormType("diagnostico");
})();
