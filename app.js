function classificarPercentual(percentual) {
  if (percentual >= 80) return "Alto desempenho";
  if (percentual >= 60) return "Ajuste necessário";
  return "Intervenção crítica";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** ========= URLs da API =========
 * Ajuste aqui se seus endpoints tiverem outro caminho.
 */
const API_DIAGNOSTICO_URL = "https://ce-infinity.onrender.com/api/diagnostico";
const API_VIABILIDADE_URL = "https://ce-infinity.onrender.com/api/viabilidade";

// NOVOS endpoints (cadastro)
const API_EMPRESAS_URL = "https://ce-infinity.onrender.com/api/empresas";
const API_PESSOAS_URL = "https://ce-infinity.onrender.com/api/pessoas";

let currentFormType = "diagnostico"; // "diagnostico" | "viabilidade"
let leadId = null; // id retornado do POST (empresa ou pessoa)

const AREAS_DIAGNOSTICO = {
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

const AREAS_VIABILIDADE = {
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

const ANSWER_OPTIONS = [
  { label: "Sim", value: 2 },
  { label: "Não", value: 1 },
  { label: "Não sei", value: 0 },
];

/* ===== DOM ===== */
const formEl = document.getElementById("diagnostico-form");
const btnEnviar = document.getElementById("btn-enviar");
const errorEl = document.getElementById("error");
const resultadosSection = document.getElementById("resultados");
const resultGrid = document.getElementById("result-grid");
const btnPdf = document.getElementById("btn-pdf");

const diagnosticoParecerEl = document.getElementById("diagnostico-parecer");
const viabilidadeParecerEl = document.getElementById("viabilidade-parecer");

// header text
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const resultadosTitle = document.getElementById("resultados-title");

// lead step
const leadCard = document.getElementById("lead-card");
const leadTitle = document.getElementById("lead-title");
const leadHint = document.getElementById("lead-hint");
const leadErrorEl = document.getElementById("lead-error");
const leadOkEl = document.getElementById("lead-ok");
const btnSalvarLead = document.getElementById("btn-salvar-lead");

const formEmpresa = document.getElementById("form-empresa");
const formPessoa = document.getElementById("form-pessoa");

const actionsPerguntas = document.getElementById("actions-perguntas");

function getAreas() {
  return currentFormType === "diagnostico"
    ? AREAS_DIAGNOSTICO
    : AREAS_VIABILIDADE;
}

function resetResultados() {
  resultadosSection.style.display = "none";
  resultGrid.innerHTML = "";
  btnPdf.style.display = "none";

  if (diagnosticoParecerEl) {
    diagnosticoParecerEl.style.display = "none";
    diagnosticoParecerEl.innerHTML = "";
  }

  if (viabilidadeParecerEl) {
    viabilidadeParecerEl.style.display = "none";
    viabilidadeParecerEl.innerHTML = "";
  }
}

function updateHeaderTexts() {
  if (!pageTitle || !pageSubtitle || !resultadosTitle) return;

  if (currentFormType === "diagnostico") {
    pageTitle.textContent = "Diagnóstico Empresarial CE Infinity";
    pageSubtitle.textContent =
      "Responda às perguntas de cada área para receber os feedbacks personalizados.";
    resultadosTitle.textContent = "Resultados por área";
    btnEnviar.textContent = "Enviar diagnóstico";

    leadTitle.textContent = "Dados da empresa";
    leadHint.textContent = "Preencha os dados abaixo para prosseguir com o diagnóstico.";
  } else {
    pageTitle.textContent = "Viabilidade de Novas Ideias CE Infinity";
    pageSubtitle.textContent =
      "Avalie o nível de maturidade da sua ideia de negócio respondendo às perguntas abaixo.";
    resultadosTitle.textContent = "Resultado";
    btnEnviar.textContent = "Enviar viabilidade";

    leadTitle.textContent = "Dados pessoais";
    leadHint.textContent = "Preencha os dados abaixo para prosseguir com a viabilidade.";
  }
}

function showLeadForm() {
  leadErrorEl.textContent = "";
  leadOkEl.style.display = "none";
  leadId = null;

  // esconde perguntas até salvar lead
  formEl.style.display = "none";
  actionsPerguntas.style.display = "none";

  if (currentFormType === "diagnostico") {
    formEmpresa.style.display = "block";
    formPessoa.style.display = "none";
  } else {
    formEmpresa.style.display = "none";
    formPessoa.style.display = "block";
  }
}

function unlockPerguntas() {
  // libera perguntas e botão enviar
  formEl.style.display = "block";
  actionsPerguntas.style.display = "flex";
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

/* ===== seletor ===== */
function setupFormSelector() {
  const selectorButtons = document.querySelectorAll(".selector-btn");
  if (!selectorButtons.length) return;

  selectorButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const formType = btn.getAttribute("data-form");
      if (!formType || formType === currentFormType) return;

      currentFormType = formType;
      leadId = null;

      selectorButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      updateHeaderTexts();
      showLeadForm();
      renderForm();
    });
  });
}

/* ===== helpers lead ===== */
function formToObject(form) {
  const fd = new FormData(form);
  const obj = {};
  for (const [k, v] of fd.entries()) obj[k] = String(v).trim();

  // normalizações simples
  if (obj.numero_unidades !== undefined && obj.numero_unidades !== "") {
    obj.numero_unidades = Number(obj.numero_unidades);
  }
  if (obj.numero_colaboradores !== undefined && obj.numero_colaboradores !== "") {
    obj.numero_colaboradores = Number(obj.numero_colaboradores);
  }
  if (obj.ja_empreende !== undefined && obj.ja_empreende !== "") {
    obj.ja_empreende = obj.ja_empreende === "true";
  }

  return obj;
}

function validateRequired(form) {
  const required = form.querySelectorAll("[required]");
  for (const el of required) {
    if (!String(el.value || "").trim()) {
      const label = el.closest(".field")?.querySelector("label")?.textContent || "Campo";
      return `Preencha: ${label}`;
    }
  }
  return null;
}

/* ===== salvar lead ===== */
btnSalvarLead.addEventListener("click", async () => {
  leadErrorEl.textContent = "";
  leadOkEl.style.display = "none";

  const form = currentFormType === "diagnostico" ? formEmpresa : formPessoa;

  const err = validateRequired(form);
  if (err) {
    leadErrorEl.textContent = err;
    return;
  }

  const payload = formToObject(form);

  // mapeia chaves pro seu backend (ajuste aqui se seus schemas tiverem outros nomes)
  let url = "";
  let body = null;

  if (currentFormType === "diagnostico") {
    url = API_EMPRESAS_URL;
    body = {
      nome_empresa: payload.nome_empresa,
      nome_responsavel: payload.nome_responsavel,
      email: payload.email,
      whatsapp: payload.whatsapp,
      cidade: payload.cidade,
      estado: payload.estado,
      segmento: payload.segmento,
      tipo_negocio: payload.tipo_negocio,
      porte: payload.porte,
      faturamento_estimado: payload.faturamento_estimado,
      numero_unidades: payload.numero_unidades ?? 0,
      numero_colaboradores: payload.numero_colaboradores ?? 0,
      tempo_operacao: payload.tempo_operacao,
    };
  } else {
    url = API_PESSOAS_URL;
    body = {
      nome_completo: payload.nome_completo,
      email: payload.email,
      whatsapp: payload.whatsapp,
      cidade: payload.cidade,
      estado: payload.estado,
      profissao_atual: payload.profissao_atual,
      ja_empreende: payload.ja_empreende,
      tipo_negocio_desejado: payload.tipo_negocio_desejado,
      ideia_propria_ou_franquia: payload.ideia_propria_ou_franquia,
      previsao_investimento: payload.previsao_investimento,
      prazo_para_abrir: payload.prazo_para_abrir,
    };
  }

  btnSalvarLead.disabled = true;
  btnSalvarLead.textContent = "Salvando...";

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const detail = await r.text();
      throw new Error(`Erro ao salvar dados (${r.status}): ${detail || "sem detalhes"}`);
    }

    const data = await r.json();

    // tenta pegar um id padrão
    leadId = data?.id ?? data?.empresa_id ?? data?.pessoa_id ?? null;

    leadOkEl.style.display = "inline";
    unlockPerguntas();
  } catch (e) {
    console.error(e);
    leadErrorEl.textContent = e?.message || "Erro ao salvar dados.";
  } finally {
    btnSalvarLead.disabled = false;
    btnSalvarLead.textContent = "Continuar";
  }
});

/* ===== envio perguntas ===== */
btnEnviar.addEventListener("click", async () => {
  errorEl.textContent = "";
  resetResultados();

  if (!leadId) {
    errorEl.textContent = "Preencha e salve seus dados antes de responder as perguntas.";
    return;
  }

  const respostas = {};
  const areas = getAreas();

  for (const [area, perguntas] of Object.entries(areas)) {
    respostas[area] = [];

    for (let i = 0; i < perguntas.length; i++) {
      const checked = document.querySelector(
        `input[name="${CSS.escape(`${area}__${i}`)}"]:checked`
      );

      if (!checked) {
        errorEl.textContent = "Responda todas as perguntas.";
        return;
      }

      respostas[area].push(Number(checked.value));
    }
  }

  btnEnviar.disabled = true;

  try {
    if (currentFormType === "diagnostico") {
      // mantém o formato atual do seu endpoint
      const r = await fetch(API_DIAGNOSTICO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // se no futuro você quiser vincular: inclua lead_id aqui (se a API aceitar)
        body: JSON.stringify(respostas),
      });

      if (!r.ok) {
        const detail = await r.text();
        throw new Error(`Erro (${r.status}): ${detail || "sem detalhes"}`);
      }

      const data = await r.json();

      // ===== Parecer Global (Diagnóstico) =====
      const fg = data?.global?.feedback_global;
      const percentualGlobal = data?.global?.percentual;

      if (diagnosticoParecerEl && fg) {
        const solucoes = Array.isArray(fg.solucoes) ? fg.solucoes : [];

        diagnosticoParecerEl.innerHTML = `
          <div class="parecer-top">
            <h3 class="parecer-title">Parecer global — ${escapeHtml(fg.titulo || "Feedback global")}</h3>
            <div class="parecer-range">
              ${typeof percentualGlobal === "number" ? `Percentual global: ${escapeHtml(percentualGlobal)}%` : ""}
            </div>
          </div>

          <p class="parecer-msg">${escapeHtml(fg.mensagem || "")}</p>

          ${
            solucoes.length
              ? `
                <div class="parecer-solucoes-title"><strong>Soluções Recomendadas</strong></div>
                <ul class="parecer-solucoes">
                  ${solucoes.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
                </ul>
              `
              : ""
          }
        `;
        diagnosticoParecerEl.style.display = "block";
      }

      // ===== Cards por área =====
      Object.entries(data.areas || {}).forEach(([area, res]) => {
        const card = document.createElement("div");
        card.className = "result-card";

        card.innerHTML = `
          <h3>${escapeHtml(area)}</h3>
          <p class="result-score">Pontuação: ${escapeHtml(res.total_pontos)} / ${escapeHtml(
          res.pontuacao_maxima
        )} (${escapeHtml(res.percentual)}%)</p>
          <p class="result-score">Classificação: ${escapeHtml(classificarPercentual(res.percentual))}</p>
          <p class="result-message">${escapeHtml(res.mensagem)}</p>
        `;

        resultGrid.appendChild(card);
      });
    } else {
      // ===== Viabilidade =====
      const r = await fetch(API_VIABILIDADE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // mantém o formato atual do seu endpoint
        body: JSON.stringify({ respostas }),
      });

      if (!r.ok) {
        const detail = await r.text();
        throw new Error(`Erro (${r.status}): ${detail || "sem detalhes"}`);
      }

      const data = await r.json();
      const pg = data.parecer_global;

      if (viabilidadeParecerEl && pg) {
        const rawMsg = String(pg.mensagem || data.mensagem || "");
        const msg = rawMsg.split("Soluções CE Infinity recomendadas:")[0].trim();
        const solucoes = Array.isArray(pg.solucoes) ? pg.solucoes : [];

        viabilidadeParecerEl.innerHTML = `
          <div class="parecer-top">
            <h3 class="parecer-title">Parecer global — ${escapeHtml(pg.classificacao || "Parecer global")}</h3>
            <div class="parecer-range">Maturidade: ${escapeHtml(data.percentual_maturidade)}%</div>
          </div>

          <p class="parecer-msg">${escapeHtml(msg)}</p>

          ${
            solucoes.length
              ? `
                <div class="parecer-solucoes-title"><strong>Soluções CE Infinity recomendadas</strong></div>
                <ul class="parecer-solucoes">
                  ${solucoes.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
                </ul>
              `
              : ""
          }
        `;
        viabilidadeParecerEl.style.display = "block";
      }

      Object.entries(data.areas || {}).forEach(([area, resumo]) => {
        const card = document.createElement("div");
        card.className = "result-card";

        card.innerHTML = `
          <h3>${escapeHtml(area)}</h3>
          <p class="result-score">Pontuação: ${escapeHtml(resumo.total_pontos)} / ${escapeHtml(
          resumo.pontuacao_maxima
        )} (${escapeHtml(resumo.percentual)}%)</p>
          <p class="result-score">Classificação: ${escapeHtml(classificarPercentual(resumo.percentual))}</p>
        `;

        resultGrid.appendChild(card);
      });
    }

    resultadosSection.style.display = "block";
    btnPdf.style.display = "inline-block";
  } catch (e) {
    console.error(e);
    errorEl.textContent = e?.message || "Erro ao enviar.";
  } finally {
    btnEnviar.disabled = false;
  }
});

// PDF
btnPdf.addEventListener("click", () => window.print());

// init
setupFormSelector();
updateHeaderTexts();
showLeadForm();
renderForm();
