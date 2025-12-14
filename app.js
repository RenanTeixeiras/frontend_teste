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

let currentFormType = "diagnostico";

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

const formEl = document.getElementById("diagnostico-form");
const btnEnviar = document.getElementById("btn-enviar");
const errorEl = document.getElementById("error");
const resultadosSection = document.getElementById("resultados");
const resultGrid = document.getElementById("result-grid");
const btnPdf = document.getElementById("btn-pdf");

const diagnosticoParecerEl = document.getElementById("diagnostico-parecer");
const viabilidadeParecerEl = document.getElementById("viabilidade-parecer");

function getAreas() {
  return currentFormType === "diagnostico"
    ? AREAS_DIAGNOSTICO
    : AREAS_VIABILIDADE;
}

function renderForm() {
  formEl.innerHTML = "";
  errorEl.textContent = "";
  resultadosSection.style.display = "none";
  diagnosticoParecerEl.style.display = "none";
  viabilidadeParecerEl.style.display = "none";
  resultGrid.innerHTML = "";

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
        input.value = opt.value;

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

renderForm();

btnEnviar.addEventListener("click", async () => {
  errorEl.textContent = "";
  resultadosSection.style.display = "none";
  diagnosticoParecerEl.style.display = "none";
  viabilidadeParecerEl.style.display = "none";
  resultGrid.innerHTML = "";

  const respostas = {};

  for (const [area, perguntas] of Object.entries(getAreas())) {
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

      const data = await r.json();

      // ===== Parecer Global =====
      const fg = data?.global?.feedback_global;
      if (fg) {
        const msg = fg.mensagem
          .split("Soluções Recomendadas")[0]
          .trim();

        diagnosticoParecerEl.innerHTML = `
          <h3>Parecer global — ${escapeHtml(fg.titulo)}</h3>
          <p><strong>Percentual global:</strong> ${data.global.percentual}%</p>
          <p class="parecer-msg">${escapeHtml(msg)}</p>
          <ul>
            ${fg.solucoes.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
          </ul>
        `;
        diagnosticoParecerEl.style.display = "block";
      }

      // ===== Áreas =====
      Object.entries(data.areas).forEach(([area, res]) => {
        const card = document.createElement("div");
        card.className = "result-card";

        card.innerHTML = `
          <h3>${area}</h3>
          <p>Pontuação: ${res.total_pontos} / ${res.pontuacao_maxima} (${res.percentual}%)</p>
          <p>Classificação: ${classificarPercentual(res.percentual)}</p>
          <p>${escapeHtml(res.mensagem)}</p>
        `;

        resultGrid.appendChild(card);
      });
    } else {
      const r = await fetch(API_VIABILIDADE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas }),
      });

      const data = await r.json();
      const pg = data.parecer_global;

      viabilidadeParecerEl.innerHTML = `
        <h3>Parecer global — ${escapeHtml(pg.classificacao)}</h3>
        <p><strong>Maturidade:</strong> ${data.percentual_maturidade}%</p>
        <p class="parecer-msg">${escapeHtml(pg.mensagem)}</p>
        <ul>
          ${pg.solucoes.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
        </ul>
      `;
      viabilidadeParecerEl.style.display = "block";
    }

    resultadosSection.style.display = "block";
    btnPdf.style.display = "inline-block";
  } catch (e) {
    errorEl.textContent = "Erro ao enviar diagnóstico.";
  } finally {
    btnEnviar.disabled = false;
  }
});

btnPdf.addEventListener("click", () => window.print());
