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

const API_DIAGNOSTICO_URL = "https://ce-infinity.onrender.com/api/diagnostico";
const API_VIABILIDADE_URL = "https://ce-infinity.onrender.com/api/viabilidade";

let currentFormType = "diagnostico"; // "diagnostico" | "viabilidade"

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

const ANSWER_OPTIONS_DIAGNOSTICO = [
  { label: "Sim", value: 2, description: "2 pontos" },
  { label: "Não", value: 1, description: "1 ponto" },
  { label: "Não sei", value: 0, description: "0 pontos" },
];

// Viabilidade agora também usa 2/1/0 (igual ao diagnóstico)
const ANSWER_OPTIONS_VIABILIDADE = [
  { label: "Sim", value: 2, description: "2 pontos" },
  { label: "Não", value: 1, description: "1 ponto" },
  { label: "Não sei", value: 0, description: "0 pontos" },
];

const formEl = document.getElementById("diagnostico-form");
const btnEnviar = document.getElementById("btn-enviar");
const errorEl = document.getElementById("error");
const resultadosSection = document.getElementById("resultados");
const resultGrid = document.getElementById("result-grid");
const btnPdf = document.getElementById("btn-pdf");

const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const resultadosTitle = document.getElementById("resultados-title");

const selectorButtons = document.querySelectorAll(".selector-btn");
const viabilidadeParecerEl = document.getElementById("viabilidade-parecer");

function getCurrentAreas() {
  return currentFormType === "diagnostico" ? AREAS_DIAGNOSTICO : AREAS_VIABILIDADE;
}

function getCurrentAnswerOptions() {
  return currentFormType === "diagnostico"
    ? ANSWER_OPTIONS_DIAGNOSTICO
    : ANSWER_OPTIONS_VIABILIDADE;
}

function updateHeaderTexts() {
  if (currentFormType === "diagnostico") {
    pageTitle.textContent = "Diagnóstico Empresarial CE Infinity";
    pageSubtitle.textContent =
      "Responda às perguntas de cada área para receber os feedbacks personalizados.";
    resultadosTitle.textContent = "Resultados por área";
    btnEnviar.textContent = "Enviar diagnóstico";
  } else {
    pageTitle.textContent = "Viabilidade de Novas Ideias CE Infinity";
    pageSubtitle.textContent =
      "Avalie o nível de maturidade da sua ideia de negócio respondendo às perguntas abaixo.";
    resultadosTitle.textContent = "Resultado";
    btnEnviar.textContent = "Enviar viabilidade";
  }
}

function resetResultados() {
  resultadosSection.style.display = "none";
  resultGrid.innerHTML = "";
  btnPdf.style.display = "none";

  if (viabilidadeParecerEl) {
    viabilidadeParecerEl.style.display = "none";
    viabilidadeParecerEl.innerHTML = "";
  }
}

function renderForm() {
  formEl.innerHTML = "";
  errorEl.textContent = "";
  resetResultados();

  const AREAS_ATUAL = getCurrentAreas();
  const answerOptions = getCurrentAnswerOptions();

  Object.entries(AREAS_ATUAL).forEach(([areaNome, perguntas]) => {
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

  updateHeaderTexts();
}

// init
renderForm();

selectorButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const formType = btn.getAttribute("data-form");
    if (!formType || formType === currentFormType) return;

    currentFormType = formType;

    selectorButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    renderForm();
  });
});

btnEnviar.addEventListener("click", async () => {
  errorEl.textContent = "";
  resetResultados();

  const AREAS_ATUAL = getCurrentAreas();
  const respostasPorArea = {};

  for (const [areaNome, perguntas] of Object.entries(AREAS_ATUAL)) {
    const pontosArea = [];

    for (let i = 0; i < perguntas.length; i++) {
      const name = `${areaNome}__${i}`;
      const checked = document.querySelector(
        `input[name="${CSS.escape(name)}"]:checked`
      );

      if (!checked) {
        errorEl.textContent =
          "Responda todas as perguntas de todas as áreas antes de enviar.";
        return;
      }

      pontosArea.push(Number(checked.value));
    }

    respostasPorArea[areaNome] = pontosArea;
  }

  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviando...";

  try {
    if (currentFormType === "diagnostico") {
      const resp = await fetch(API_DIAGNOSTICO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(respostasPorArea),
      });

      if (!resp.ok) {
        const detail = await resp.text();
        throw new Error(
          `Erro ao chamar API (${resp.status}): ${detail || "sem detalhes"}`
        );
      }

      const data = await resp.json();
      resultGrid.innerHTML = "";

      Object.entries(data).forEach(([area, res]) => {
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

      resultadosSection.style.display = "block";
      btnPdf.style.display = "inline-block";
    } else {
      // ===== Viabilidade (agora com parecer_global) =====
      const resp = await fetch(API_VIABILIDADE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas: respostasPorArea }),
      });

      if (!resp.ok) {
        const detail = await resp.text();
        throw new Error(
          `Erro ao chamar API (${resp.status}): ${detail || "sem detalhes"}`
        );
      }

      const data = await resp.json();
      resultGrid.innerHTML = "";

      // ----- Render parecer_global -----
      if (viabilidadeParecerEl) {
        const pg = data.parecer_global;

        const classificacao = pg?.classificacao || "Parecer global";
        const minP = pg?.min_percentual ?? "";
        const maxP = pg?.max_percentual ?? "";
        const msg = pg?.mensagem || data.mensagem || "";
        const solucoes = Array.isArray(pg?.solucoes) ? pg.solucoes : [];

        viabilidadeParecerEl.innerHTML = `
          <div class="parecer-top">
            <h3 class="parecer-title">Parecer global — ${escapeHtml(classificacao)}</h3>
            <div class="parecer-range">
              Faixa: ${minP}${minP !== "" ? "%" : ""} a ${maxP}${maxP !== "" ? "%" : ""}%
              • Maturidade: ${escapeHtml(data.percentual_maturidade)}%
            </div>
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

      // ----- Cards por área -----
      if (data.areas) {
        Object.entries(data.areas).forEach(([area, resumo]) => {
          const card = document.createElement("div");
          card.className = "result-card";

          const h3 = document.createElement("h3");
          h3.textContent = area;
          card.appendChild(h3);

          const pScore = document.createElement("p");
          pScore.className = "result-score";
          pScore.textContent = `Pontuação: ${resumo.total_pontos} / ${resumo.pontuacao_maxima} (${resumo.percentual}%)`;
          card.appendChild(pScore);

          const classificacaoArea = classificarPercentual(resumo.percentual);
          const pClass = document.createElement("p");
          pClass.className = "result-score";
          pClass.textContent = `Classificação: ${classificacaoArea}`;
          card.appendChild(pClass);

          resultGrid.appendChild(card);
        });
      }

      resultadosSection.style.display = "block";
      btnPdf.style.display = "inline-block";
    }
  } catch (err) {
    console.error(err);
    errorEl.textContent = err.message || "Erro ao enviar.";
  } finally {
    btnEnviar.disabled = false;
    updateHeaderTexts();
  }
});

// PDF via print
btnPdf.addEventListener("click", () => {
  window.print();
});
