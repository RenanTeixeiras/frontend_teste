function classificarPercentual(percentual) {
  if (percentual >= 80) return "Alto desempenho";
  if (percentual >= 60) return "Ajuste necessário";
  return "Intervenção crítica";
}

/* =========================
   CONFIG
   ========================= */
const API_DIAGNOSTICO_URL = "https://ce-infinity.onrender.com/api/diagnostico";
const API_VIABILIDADE_URL = "https://ce-infinity.onrender.com/api/viabilidade";

// endpoints para salvar os dados do cliente (lead)
const API_EMPRESAS_URL = "https://ce-infinity.onrender.com/api/empresas";
const API_PESSOAS_URL = "https://ce-infinity.onrender.com/api/pessoas";

let currentFormType = "diagnostico"; // 'diagnostico' | 'viabilidade'

// guarda o lead criado (a API deve retornar pelo menos um id)
let currentLead = null; // { type: 'empresa'|'pessoa', id, data }

/* =========================
   PERGUNTAS
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

// ambos usam 0/1/2 conforme você padronizou na API
const ANSWER_OPTIONS = [
  { label: "Sim", value: 2 },
  { label: "Não", value: 1 },
  { label: "Não sei", value: 0 },
];

/* =========================
   DOM
   ========================= */
const formEl = document.getElementById("diagnostico-form");
const btnEnviar = document.getElementById("btn-enviar");
const errorEl = document.getElementById("error");

const resultadosSection = document.getElementById("resultados");
const resultadosTitleEl = document.getElementById("resultados-title");
const resultGrid = document.getElementById("result-grid");
const btnPdf = document.getElementById("btn-pdf");

const diagnosticoParecerEl = document.getElementById("diagnostico-parecer");
const viabilidadeParecerEl = document.getElementById("viabilidade-parecer");

const leadSectionEl = document.getElementById("lead-section");
const leadTitleEl = document.getElementById("lead-title");
const leadSubtitleEl = document.getElementById("lead-subtitle");
const leadFormEl = document.getElementById("lead-form");

const pageTitleEl = document.getElementById("page-title");
const pageSubtitleEl = document.getElementById("page-subtitle");

/* =========================
   HELPERS
   ========================= */
function getAreas() {
  return currentFormType === "diagnostico" ? DIAGNOSTICO_AREAS : VIABILIDADE_AREAS;
}

function resetResultados() {
  resultadosSection.style.display = "none";
  resultGrid.innerHTML = "";
  btnPdf.style.display = "none";

  diagnosticoParecerEl.style.display = "none";
  diagnosticoParecerEl.innerHTML = "";

  viabilidadeParecerEl.style.display = "none";
  viabilidadeParecerEl.innerHTML = "";
}

function updateHeaderTexts() {
  if (currentFormType === "diagnostico") {
    pageTitleEl.textContent = "Diagnóstico Empresarial CE Infinity";
    pageSubtitleEl.textContent =
      "Responda às perguntas de cada área para receber os feedbacks personalizados.";
    resultadosTitleEl.textContent = "Resultados por área";

    leadTitleEl.textContent = "Dados da empresa";
    leadSubtitleEl.textContent =
      "Preencha os dados abaixo para receber o diagnóstico.";
    btnEnviar.textContent = "Enviar diagnóstico";
  } else {
    pageTitleEl.textContent = "Viabilidade de Novas Ideias CE Infinity";
    pageSubtitleEl.textContent =
      "Responda às perguntas para receber o parecer de maturidade da sua ideia.";
    resultadosTitleEl.textContent = "Resultados por área (resumo)";

    leadTitleEl.textContent = "Dados pessoais";
    leadSubtitleEl.textContent =
      "Preencha seus dados para receber o parecer da viabilidade.";
    btnEnviar.textContent = "Enviar viabilidade";
  }
}

function renderLeadForm() {
  if (!leadSectionEl || !leadFormEl || !leadTitleEl || !leadSubtitleEl) return;

  // reset do lead quando muda o tipo
  currentLead = null;

  leadFormEl.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "lead-grid";

  const mkField = ({
    id,
    label,
    type = "text",
    required = true,
    full = false,
    kind = "input", // input | select
    options = [],
    hint = "",
    placeholder = "",
  }) => {
    const wrap = document.createElement("div");
    wrap.className = "lead-field" + (full ? " full" : "");
    wrap.dataset.fieldId = id;

    const lab = document.createElement("label");
    lab.setAttribute("for", id);
    lab.textContent = label + (required ? " *" : "");
    wrap.appendChild(lab);

    let control;

    if (kind === "select") {
      const sel = document.createElement("select");
      sel.id = id;
      sel.name = id;
      if (required) sel.required = true;

      // placeholder
      const opt0 = document.createElement("option");
      opt0.value = "";
      opt0.textContent = "Selecione...";
      opt0.disabled = true;
      opt0.selected = true;
      sel.appendChild(opt0);

      options.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o.value;
        opt.textContent = o.label;
        sel.appendChild(opt);
      });

      control = sel;
    } else {
      const inp = document.createElement("input");
      inp.type = type;
      inp.id = id;
      inp.name = id;
      inp.placeholder = placeholder || "";
      if (required) inp.required = true;
      control = inp;
    }

    wrap.appendChild(control);

    if (hint) {
      const small = document.createElement("small");
      small.textContent = hint;
      wrap.appendChild(small);
    }

    return wrap;
  };

  if (currentFormType === "diagnostico") {
    const fields = [
      { id: "empresa_nome", label: "Nome da empresa", full: true },
      { id: "empresa_responsavel", label: "Nome do responsável", full: true },
      { id: "empresa_email", label: "Email", type: "email" },
      { id: "empresa_whatsapp", label: "WhatsApp", hint: "Ex.: (71) 9xxxx-xxxx" },
      { id: "empresa_cidade", label: "Cidade" },
      { id: "empresa_estado", label: "Estado (UF)", placeholder: "Ex.: BA" },
      {
        id: "empresa_segmento",
        label: "Segmento",
        kind: "select",
        options: [
          { label: "Comércio", value: "comercio" },
          { label: "Serviços", value: "servicos" },
          { label: "Franquia", value: "franquia" },
        ],
      },
      { id: "empresa_tipo_negocio", label: "Tipo de negócio", full: true, required: false },
      {
        id: "empresa_porte",
        label: "Porte da empresa",
        kind: "select",
        options: [
          { label: "ME", value: "ME" },
          { label: "EPP", value: "EPP" },
          { label: "PME", value: "PME" },
        ],
      },
      { id: "empresa_faturamento", label: "Faturamento estimado", required: false, hint: "Ex.: R$ 50.000/mês" },
      { id: "empresa_unidades", label: "Número de unidades (se franquia)", type: "number", required: false },
      { id: "empresa_colaboradores", label: "Número de colaboradores", type: "number", required: false },
      { id: "empresa_tempo_operacao", label: "Tempo de operação", required: false, full: true, hint: "Ex.: 2 anos" },
    ];

    fields.forEach((f) => grid.appendChild(mkField(f)));
  } else {
    const fields = [
      { id: "pessoa_nome", label: "Nome completo", full: true },
      { id: "pessoa_email", label: "Email", type: "email" },
      { id: "pessoa_whatsapp", label: "WhatsApp", hint: "Ex.: (71) 9xxxx-xxxx" },
      { id: "pessoa_cidade", label: "Cidade" },
      { id: "pessoa_estado", label: "Estado (UF)", placeholder: "Ex.: BA" },
      { id: "pessoa_profissao", label: "Profissão atual", full: true, required: false },
      {
        id: "pessoa_empreende",
        label: "Já empreende?",
        kind: "select",
        options: [
          { label: "Sim", value: "sim" },
          { label: "Não", value: "nao" },
        ],
        required: false,
      },
      {
        id: "pessoa_tipo_negocio",
        label: "Tipo de negócio desejado",
        kind: "select",
        options: [
          { label: "Comércio", value: "comercio" },
          { label: "Serviço", value: "servico" },
        ],
        required: false,
      },
      {
        id: "pessoa_ideia",
        label: "Ideia própria ou franquia",
        kind: "select",
        options: [
          { label: "Ideia própria", value: "ideia_propria" },
          { label: "Franquia", value: "franquia" },
        ],
        required: false,
      },
      { id: "pessoa_investimento", label: "Previsão de investimento", required: false, hint: "Ex.: R$ 30.000" },
      { id: "pessoa_prazo", label: "Prazo para abrir o negócio", full: true, required: false },
    ];

    fields.forEach((f) => grid.appendChild(mkField(f)));
  }

  leadFormEl.appendChild(grid);

  // regra: mostrar/ocultar unidades baseado em franquia
  const segmentoEl = document.getElementById("empresa_segmento");
  const unidadesEl = document.getElementById("empresa_unidades");
  if (segmentoEl && unidadesEl) {
    const toggle = () => {
      const isFranquia = String(segmentoEl.value || "") === "franquia";
      unidadesEl.closest(".lead-field")?.classList.toggle("is-hidden", !isFranquia);
    };
    toggle();
    segmentoEl.addEventListener("change", toggle);
  }
}

async function ensureLeadSaved() {
  if (currentLead?.id) return currentLead;
  if (!leadFormEl) return null;

  const formOk = leadFormEl.checkValidity();
  if (!formOk) {
    leadFormEl.reportValidity();
    throw new Error(
      currentFormType === "diagnostico"
        ? "Preencha os dados da empresa antes de enviar o diagnóstico."
        : "Preencha os dados pessoais antes de enviar a viabilidade."
    );
  }

  const payload = {};

  if (currentFormType === "diagnostico") {
    payload.nome_empresa = document.getElementById("empresa_nome")?.value?.trim() || "";
    payload.nome_responsavel = document.getElementById("empresa_responsavel")?.value?.trim() || "";
    payload.email = document.getElementById("empresa_email")?.value?.trim() || "";
    payload.whatsapp = document.getElementById("empresa_whatsapp")?.value?.trim() || "";
    payload.cidade = document.getElementById("empresa_cidade")?.value?.trim() || "";
    payload.estado = document.getElementById("empresa_estado")?.value?.trim() || "";
    payload.segmento = document.getElementById("empresa_segmento")?.value || "";
    payload.tipo_negocio = document.getElementById("empresa_tipo_negocio")?.value?.trim() || "";
    payload.porte = document.getElementById("empresa_porte")?.value || "";
    payload.faturamento_estimado = document.getElementById("empresa_faturamento")?.value?.trim() || "";
    const unidades = document.getElementById("empresa_unidades")?.value;
    payload.numero_unidades = unidades ? Number(unidades) : null;
    payload.numero_colaboradores = Number(document.getElementById("empresa_colaboradores")?.value || 0);
    payload.tempo_operacao = document.getElementById("empresa_tempo_operacao")?.value?.trim() || "";

    const resp = await fetch(API_EMPRESAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      throw new Error(`Erro ao salvar empresa (${resp.status}): ${detail || "sem detalhes"}`);
    }

    const data = await resp.json();
    currentLead = { type: "empresa", id: data.id ?? data.empresa_id ?? null, data };
    return currentLead;
  }

  payload.nome_completo = document.getElementById("pessoa_nome")?.value?.trim() || "";
  payload.email = document.getElementById("pessoa_email")?.value?.trim() || "";
  payload.whatsapp = document.getElementById("pessoa_whatsapp")?.value?.trim() || "";
  payload.cidade = document.getElementById("pessoa_cidade")?.value?.trim() || "";
  payload.estado = document.getElementById("pessoa_estado")?.value?.trim() || "";
  payload.profissao_atual = document.getElementById("pessoa_profissao")?.value?.trim() || "";
  payload.ja_empreende = document.getElementById("pessoa_empreende")?.value || "";
  payload.tipo_negocio_desejado = document.getElementById("pessoa_tipo_negocio")?.value || "";
  payload.ideia_propria_ou_franquia = document.getElementById("pessoa_ideia")?.value || "";
  payload.previsao_investimento = document.getElementById("pessoa_investimento")?.value?.trim() || "";
  payload.prazo_para_abrir = document.getElementById("pessoa_prazo")?.value?.trim() || "";

  const resp = await fetch(API_PESSOAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Erro ao salvar pessoa (${resp.status}): ${detail || "sem detalhes"}`);
  }

  const data = await resp.json();
  currentLead = { type: "pessoa", id: data.id ?? data.pessoa_id ?? null, data };
  return currentLead;
}

function renderForm() {
  formEl.innerHTML = "";
  errorEl.textContent = "";
  resetResultados();

  Object.entries(getAreas()).forEach(([area, perguntas]) => {
    const card = document.createElement("section");
    card.className = "area-card";

    const h2 = document.createElement("h2");
    h2.textContent = area;
    card.appendChild(h2);

    const ol = document.createElement("ol");
    ol.className = "question-list";

    perguntas.forEach((pergunta, i) => {
      const li = document.createElement("li");
      li.className = "question-item";

      const p = document.createElement("p");
      p.textContent = pergunta;
      li.appendChild(p);

      const group = document.createElement("div");
      group.className = "answer-group";

      ANSWER_OPTIONS.forEach((opt) => {
        const label = document.createElement("label");
        label.className = "answer-pill";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `${area}__${i}`;
        input.value = String(opt.value);

        label.appendChild(input);
        label.append(` ${opt.label}`);
        group.appendChild(label);
      });

      li.appendChild(group);
      ol.appendChild(li);
    });

    card.appendChild(ol);
    formEl.appendChild(card);
  });
}

/* =========================
   ✅ SELETOR DE FORMULÁRIO
   ========================= */
function setupFormSelector() {
  const selectorButtons = document.querySelectorAll(".selector-btn");
  if (!selectorButtons.length) return;

  selectorButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const formType = btn.getAttribute("data-form");
      if (!formType || formType === currentFormType) return;

      currentFormType = formType;

      selectorButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      updateHeaderTexts();
      renderForm();
      renderLeadForm();
    });
  });
}

// init
setupFormSelector();
updateHeaderTexts();
renderForm();
renderLeadForm();

/* =========================
   ENVIO
   ========================= */
btnEnviar.addEventListener("click", async () => {
  errorEl.textContent = "";
  resetResultados();

  // 1) salva os dados do cliente (empresa/pessoa) antes de calcular
  try {
    await ensureLeadSaved();
  } catch (e) {
    errorEl.textContent = e?.message || "Preencha os dados antes de enviar.";
    return;
  }

  const respostas = {};
  const areas = getAreas();

  for (const [area, perguntas] of Object.entries(areas)) {
    const pontos = [];

    for (let i = 0; i < perguntas.length; i++) {
      const name = `${area}__${i}`;
      const checked = document.querySelector(
        `input[name="${CSS.escape(name)}"]:checked`
      );

      if (!checked) {
        errorEl.textContent =
          "Responda todas as perguntas antes de enviar.";
        return;
      }

      pontos.push(Number(checked.value));
    }

    respostas[area] = pontos;
  }

  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviando...";

  try {
    const url =
      currentFormType === "diagnostico"
        ? API_DIAGNOSTICO_URL
        : API_VIABILIDADE_URL;

    const body =
      currentFormType === "diagnostico"
        ? respostas
        : { respostas };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      throw new Error(`Erro ao chamar API (${resp.status}): ${detail || "sem detalhes"}`);
    }

    const data = await resp.json();

    resultGrid.innerHTML = "";

    if (currentFormType === "diagnostico") {
      // cards por área
      Object.entries(data.areas || {}).forEach(([area, res]) => {
        const card = document.createElement("div");
        card.className = "result-card";

        const h3 = document.createElement("h3");
        h3.textContent = area;
        card.appendChild(h3);

        const pScore = document.createElement("p");
        pScore.className = "result-score";
        pScore.textContent = `Pontuação: ${res.total_pontos} / ${res.pontuacao_maxima} (${res.percentual}%)`;
        card.appendChild(pScore);

        const classificacao = classificarPercentual(res.percentual);

        const pClass = document.createElement("p");
        pClass.className = "result-score";
        pClass.textContent = `Classificação: ${classificacao}`;
        card.appendChild(pClass);

        const pMsg = document.createElement("p");
        pMsg.className = "result-message";
        pMsg.textContent = res.mensagem;
        card.appendChild(pMsg);

        resultGrid.appendChild(card);
      });

      // parecer global do diagnóstico (se existir)
      if (data.parecer_global) {
        const pg = data.parecer_global;
        const frag = Array.isArray(pg.setores_criticos) ? pg.setores_criticos : [];

        diagnosticoParecerEl.innerHTML = `
          <h3>Parecer global — ${pg.classificacao}</h3>
          <p class="parecer-meta">
            Faixa: ${pg.min_percentual}% a ${pg.max_percentual}% • Desempenho global: ${data.percentual_global}%
          </p>
          <p style="white-space: pre-wrap; margin: 0.25rem 0 0;">${pg.mensagem}</p>
          ${
            frag.length
              ? `<p class="parecer-meta" style="margin-top:0.6rem"><strong>Áreas mais frágeis:</strong> ${frag.join(", ")}</p>`
              : ""
          }
        `;
        diagnosticoParecerEl.style.display = "block";
      }
    } else {
      // resumo por área da viabilidade
      const areasResumo = data.areas || {};
      Object.entries(areasResumo).forEach(([area, res]) => {
        const card = document.createElement("div");
        card.className = "result-card";

        const h3 = document.createElement("h3");
        h3.textContent = area;
        card.appendChild(h3);

        const pScore = document.createElement("p");
        pScore.className = "result-score";
        pScore.textContent = `Pontuação: ${res.total_pontos} / ${res.pontuacao_maxima} (${res.percentual}%)`;
        card.appendChild(pScore);

        resultGrid.appendChild(card);
      });

      // parecer global da viabilidade
      if (data.parecer_global) {
        const pg = data.parecer_global;

        const solucoes = Array.isArray(pg.solucoes) ? pg.solucoes : [];
        const solucoesHtml =
          solucoes.length > 0
            ? `<div style="margin-top:0.75rem">
                 <div class="parecer-meta" style="margin-bottom:0.35rem"><strong>Soluções CE Infinity recomendadas</strong></div>
                 <ul style="margin:0; padding-left:1.2rem">
                   ${solucoes.map((s) => `<li>${s}</li>`).join("")}
                 </ul>
               </div>`
            : "";

        // IMPORTANTe: não repetimos as soluções se elas já estiverem dentro da mensagem
        const mensagem = String(pg.mensagem || "");

        viabilidadeParecerEl.innerHTML = `
          <h3>Parecer global — ${pg.classificacao}</h3>
          <p class="parecer-meta">
            Faixa: ${pg.min_percentual}% a ${pg.max_percentual}% • Maturidade: ${data.percentual_maturidade}%
          </p>
          <p style="white-space: pre-wrap; margin: 0.25rem 0 0;">${mensagem}</p>
          ${mensagem.toLowerCase().includes("soluções ce infinity recomendadas") ? "" : solucoesHtml}
        `;
        viabilidadeParecerEl.style.display = "block";
      }
    }

    resultadosSection.style.display = "block";
    btnPdf.style.display = "inline-block";
  } catch (err) {
    console.error(err);
    errorEl.textContent = err.message || "Erro ao enviar.";
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent =
      currentFormType === "diagnostico" ? "Enviar diagnóstico" : "Enviar viabilidade";
  }
});

// Baixar PDF (impressão)
btnPdf.addEventListener("click", () => {
  window.print();
});
