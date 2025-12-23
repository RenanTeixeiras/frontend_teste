// ===== Helpers =====
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

function setActiveStep(step) {
  document.querySelectorAll(".step-chip").forEach((el) => {
    el.classList.toggle("active", el.getAttribute("data-step") === String(step));
  });
}

function showScreen(name) {
  const screens = ["dados", "perguntas", "resultados"];
  screens.forEach((s) => {
    const el = document.getElementById(`screen-${s}`);
    if (!el) return;
    el.style.display = s === name ? "block" : "none";
  });
}

// ===== API URLs =====
const API_DIAGNOSTICO_URL = "https://ce-infinity.onrender.com/api/diagnostico";
const API_VIABILIDADE_URL = "https://ce-infinity.onrender.com/api/viabilidade";

// ===== Estado =====
let currentFormType = "diagnostico"; // "diagnostico" | "viabilidade"
let leadEmpresa = null;
let leadPessoa = null;

// ===== Perguntas (mantive as que você já tinha) =====
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

// Respostas 2/1/0 (como suas APIs estão hoje)
const ANSWER_OPTIONS = [
  { label: "Sim", value: 2 },
  { label: "Não", value: 1 },
  { label: "Não sei", value: 0 },
];

// ===== DOM =====
const formPerguntasEl = document.getElementById("diagnostico-form");
const errorEl = document.getElementById("error");
const resultGrid = document.getElementById("result-grid");
const btnEnviar = document.getElementById("btn-enviar");
const btnPdf = document.getElementById("btn-pdf");
const btnRefazer = document.getElementById("btn-refazer");

const formEmpresa = document.getElementById("form-empresa");
const formPessoa = document.getElementById("form-pessoa");

const btnAvancarEmpresa = document.getElementById("btn-avancar-dados");
const btnAvancarPessoa = document.getElementById("btn-avancar-dados-pessoa");
const btnVoltarDados = document.getElementById("btn-voltar-dados");

const diagnosticoParecerEl = document.getElementById("diagnostico-parecer");
const viabilidadeParecerEl = document.getElementById("viabilidade-parecer");

const resultadosTitle = document.getElementById("resultados-title");

// ===== Selector =====
function setupSelector() {
  const buttons = document.querySelectorAll(".selector-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const formType = btn.getAttribute("data-form");
      if (!formType || formType === currentFormType) return;

      currentFormType = formType;

      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // alterna forms de dados
      if (currentFormType === "diagnostico") {
        formEmpresa.style.display = "block";
        formPessoa.style.display = "none";
      } else {
        formEmpresa.style.display = "none";
        formPessoa.style.display = "block";
      }

      // reseta estado e vai para "dados"
      resetAll();
      showScreen("dados");
      setActiveStep(1);
    });
  });
}

// ===== Render perguntas =====
function getAreas() {
  return currentFormType === "diagnostico" ? AREAS_DIAGNOSTICO : AREAS_VIABILIDADE;
}

function renderPerguntas() {
  formPerguntasEl.innerHTML = "";

  Object.entries(getAreas()).forEach(([area, perguntas]) => {
    const areaCard = document.createElement("section");
    areaCard.className = "area-card";

    const h2 = document.createElement("h2");
    h2.textContent = area;
    areaCard.appendChild(h2);

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

    areaCard.appendChild(ol);
    formPerguntasEl.appendChild(areaCard);
  });
}

// ===== Coleta lead =====
function readForm(formEl) {
  const fd = new FormData(formEl);
  const obj = {};
  for (const [k, v] of fd.entries()) obj[k] = String(v).trim();
  return obj;
}

function validateEmpresa(empresa) {
  const required = [
    "nome_empresa",
    "nome_responsavel",
    "email",
    "whatsapp",
    "cidade",
    "estado",
    "segmento",
    "tipo_negocio",
    "porte_empresa",
    "faturamento_estimado",
    "numero_colaboradores",
    "tempo_operacao",
  ];

  for (const k of required) {
    if (!empresa[k]) return `Preencha o campo obrigatório: ${k.replaceAll("_", " ")}`;
  }

  if (empresa.estado.length !== 2) return "Estado deve ter 2 letras (ex: BA).";

  if (empresa.segmento === "franquia" && !empresa.numero_unidades) {
    return "Número de unidades é obrigatório quando segmento = Franquia.";
  }

  return null;
}

function validatePessoa(pessoa) {
  const required = [
    "nome_completo",
    "email",
    "whatsapp",
    "cidade",
    "estado",
    "profissao_atual",
    "ja_empreende",
    "tipo_negocio_desejado",
    "ideia",
    "previsao_investimento",
    "prazo_para_abrir",
  ];

  for (const k of required) {
    if (!pessoa[k]) return `Preencha o campo obrigatório: ${k.replaceAll("_", " ")}`;
  }

  if (pessoa.estado.length !== 2) return "Estado deve ter 2 letras (ex: BA).";
  return null;
}

// ===== Navegação =====
btnAvancarEmpresa.addEventListener("click", () => {
  errorEl.textContent = "";

  const empresa = readForm(formEmpresa);
  const err = validateEmpresa(empresa);
  if (err) {
    alert(err);
    return;
  }

  // normaliza números
  empresa.numero_unidades =
    empresa.numero_unidades ? Number(empresa.numero_unidades) : null;
  empresa.numero_colaboradores = Number(empresa.numero_colaboradores);

  leadEmpresa = empresa;

  renderPerguntas();
  showScreen("perguntas");
  setActiveStep(2);

  btnEnviar.textContent = "Enviar diagnóstico";
});

btnAvancarPessoa.addEventListener("click", () => {
  errorEl.textContent = "";

  const pessoa = readForm(formPessoa);
  const err = validatePessoa(pessoa);
  if (err) {
    alert(err);
    return;
  }

  leadPessoa = pessoa;

  renderPerguntas();
  showScreen("perguntas");
  setActiveStep(2);

  btnEnviar.textContent = "Enviar viabilidade";
});

btnVoltarDados.addEventListener("click", () => {
  showScreen("dados");
  setActiveStep(1);
});

// ===== Envio perguntas =====
function montarRespostas() {
  const respostas = {};
  const areas = getAreas();

  for (const [area, perguntas] of Object.entries(areas)) {
    respostas[area] = [];
    for (let i = 0; i < perguntas.length; i++) {
      const name = `${area}__${i}`;
      const checked = document.querySelector(
        `input[name="${CSS.escape(name)}"]:checked`
      );
      if (!checked) return { error: "Responda todas as perguntas antes de enviar." };
      respostas[area].push(Number(checked.value));
    }
  }

  return { respostas };
}

function resetAll() {
  errorEl.textContent = "";
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

async function postJson(url, body) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return resp;
}

function renderDiagnostico(data) {
  // título
  resultadosTitle.textContent = "Resultados por área";

  // parecer global (vem da API)
  const fg = data?.global?.feedback_global;
  const percentualGlobal = data?.global?.percentual;

  if (fg && diagnosticoParecerEl) {
    const solucoes = Array.isArray(fg.solucoes) ? fg.solucoes : [];
    diagnosticoParecerEl.innerHTML = `
      <h3 class="parecer-title">Parecer global — ${escapeHtml(fg.titulo || "Feedback global")}</h3>
      <div class="parecer-range">Percentual global: ${escapeHtml(percentualGlobal)}%</div>
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

  // cards por área
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
}

function renderViabilidade(data) {
  resultadosTitle.textContent = "Resultado";

  const pg = data.parecer_global;
  if (pg && viabilidadeParecerEl) {
    const rawMsg = String(pg.mensagem || data.mensagem || "");
    // evita duplicar bloco de soluções
    const msg = rawMsg.split("Soluções CE Infinity recomendadas:")[0].trim();
    const solucoes = Array.isArray(pg.solucoes) ? pg.solucoes : [];

    viabilidadeParecerEl.innerHTML = `
      <h3 class="parecer-title">Parecer global — ${escapeHtml(pg.classificacao || "Parecer global")}</h3>
      <div class="parecer-range">Maturidade: ${escapeHtml(data.percentual_maturidade)}%</div>
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

  // cards por área
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

btnEnviar.addEventListener("click", async () => {
  errorEl.textContent = "";
  resultGrid.innerHTML = "";
  resetAll();

  const { respostas, error } = montarRespostas();
  if (error) {
    errorEl.textContent = error;
    return;
  }

  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviando...";

  try {
    if (currentFormType === "diagnostico") {
      // tenta enviar no formato novo (empresa + respostas)
      const bodyNovo = { empresa: leadEmpresa, respostas };

      let resp = await postJson(API_DIAGNOSTICO_URL, bodyNovo);

      // fallback: API antiga espera só { "Marketing": [...] }
      if (!resp.ok) {
        const bodyAntigo = respostas; // dict direto por área
        resp = await postJson(API_DIAGNOSTICO_URL, bodyAntigo);
      }

      if (!resp.ok) {
        const detail = await resp.text();
        throw new Error(`Erro (${resp.status}): ${detail || "sem detalhes"}`);
      }

      const data = await resp.json();
      renderDiagnostico(data);
    } else {
      // viabilidade: tenta enviar no formato novo (pessoa + respostas)
      const bodyNovo = { pessoa: leadPessoa, respostas: respostas };
      let resp = await postJson(API_VIABILIDADE_URL, bodyNovo);

      // fallback: API antiga espera { respostas: {...} }
      if (!resp.ok) {
        const bodyAntigo = { respostas };
        resp = await postJson(API_VIABILIDADE_URL, bodyAntigo);
      }

      if (!resp.ok) {
        const detail = await resp.text();
        throw new Error(`Erro (${resp.status}): ${detail || "sem detalhes"}`);
      }

      const data = await resp.json();
      renderViabilidade(data);
    }

    showScreen("resultados");
    setActiveStep(3);
    btnPdf.style.display = "inline-block";
  } catch (e) {
    console.error(e);
    errorEl.textContent = e?.message || "Erro ao enviar.";
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent =
      currentFormType === "diagnostico" ? "Enviar diagnóstico" : "Enviar viabilidade";
  }
});

btnPdf.addEventListener("click", () => window.print());

btnRefazer.addEventListener("click", () => {
  resetAll();
  showScreen("dados");
  setActiveStep(1);
});

// ===== init =====
setupSelector();
showScreen("dados");
setActiveStep(1);