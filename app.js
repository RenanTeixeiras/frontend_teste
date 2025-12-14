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

const ANSWER_OPTIONS = [
  { label: "Sim", value: 2 },
  { label: "Não", value: 1 },
  { label: "Não sei", value: 0 },
];

// ===== elementos do DOM =====
const formEl = document.getElementById("diagnostico-form");
const btnEnviar = document.getElementById("btn-enviar");
const errorEl = document.getElementById("error");
const resultadosSection = document.getElementById("resultados");
const resultGrid = document.getElementById("result-grid");
const btnPdf = document.getElementById("btn-pdf");

const diagnosticoParecerEl = document.getElementById("diagnostico-parecer");
const viabilidadeParecerEl = document.getElementById("viabilidade-parecer");

// (opcional, se existirem no HTML)
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const resultadosTitle = document.getElementById("resultados-title");

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
  } else {
    pageTitle.textContent = "Viabilidade de Novas Ideias CE Infinity";
    pageSubtitle.textContent =
      "Avalie o nível de maturidade da sua ideia de negócio respondendo às perguntas abaixo.";
    resultadosTitle.textContent = "Resultado";
    btnEnviar.textContent = "Enviar viabilidade";
  }
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
    });
  });
}

// init
setupFormSelector();
updateHeaderTexts();
renderForm();

/* =========================
   ENVIO
   ========================= */
btnEnviar.addEventListener("click", async () => {
  errorEl.textContent = "";
  resetResultados();

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
      const r = await fetch(API_DIAGNOSTICO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        const msg = String(fg.mensagem || "")
          .split("Soluções Recomendadas")[0]
          .trim();

        const solucoes = Array.isArray(fg.solucoes) ? fg.solucoes : [];

        diagnosticoParecerEl.innerHTML = `
          <div class="parecer-top">
            <h3 class="parecer-title">Parecer global — ${escapeHtml(
              fg.titulo || "Feedback global"
            )}</h3>
            <div class="parecer-range">
              ${
                typeof percentualGlobal === "number"
                  ? `Percentual global: ${escapeHtml(percentualGlobal)}%`
                  : ""
              }
            </div>
          </div>

          <p class="parecer-msg">${escapeHtml(msg)}</p>

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
          <p class="result-score">Pontuação: ${escapeHtml(
            res.total_pontos
          )} / ${escapeHtml(res.pontuacao_maxima)} (${escapeHtml(res.percentual)}%)</p>
          <p class="result-score">Classificação: ${escapeHtml(
            classificarPercentual(res.percentual)
          )}</p>
          <p class="result-message">${escapeHtml(res.mensagem)}</p>
        `;

        resultGrid.appendChild(card);
      });
    } else {
      // ===== Viabilidade =====
      const r = await fetch(API_VIABILIDADE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas }),
      });

      if (!r.ok) {
        const detail = await r.text();
        throw new Error(`Erro (${r.status}): ${detail || "sem detalhes"}`);
      }

      const data = await r.json();
      const pg = data.parecer_global;

      if (viabilidadeParecerEl && pg) {
        // evita duplicar: corta o texto antes do bloco de soluções
        const rawMsg = String(pg.mensagem || data.mensagem || "");
        const msg = rawMsg.split("Soluções CE Infinity recomendadas:")[0].trim();

        const solucoes = Array.isArray(pg.solucoes) ? pg.solucoes : [];

        viabilidadeParecerEl.innerHTML = `
          <div class="parecer-top">
            <h3 class="parecer-title">Parecer global — ${escapeHtml(
              pg.classificacao || "Parecer global"
            )}</h3>
            <div class="parecer-range">
              Maturidade: ${escapeHtml(data.percentual_maturidade)}%
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

      // Cards por área (resumo)
      Object.entries(data.areas || {}).forEach(([area, resumo]) => {
        const card = document.createElement("div");
        card.className = "result-card";

        card.innerHTML = `
          <h3>${escapeHtml(area)}</h3>
          <p class="result-score">Pontuação: ${escapeHtml(
            resumo.total_pontos
          )} / ${escapeHtml(resumo.pontuacao_maxima)} (${escapeHtml(
          resumo.percentual
        )}%)</p>
          <p class="result-score">Classificação: ${escapeHtml(
            classificarPercentual(resumo.percentual)
          )}</p>
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
