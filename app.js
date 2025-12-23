/* ======================================================
   CONFIGURAÇÕES GERAIS
====================================================== */

const API_EMPRESA_URL = "https://ce-infinity.onrender.com/api/empresas";
const API_PESSOA_URL = "https://ce-infinity.onrender.com/api/pessoas";
const API_DIAGNOSTICO_URL = "https://ce-infinity.onrender.com/api/diagnostico";
const API_VIABILIDADE_URL = "https://ce-infinity.onrender.com/api/viabilidade";

let currentFormType = "diagnostico"; // diagnostico | viabilidade
let leadId = null;

/* ======================================================
   UTILIDADES
====================================================== */

function getFormData(formId) {
  const form = document.getElementById(formId);
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ======================================================
   ELEMENTOS
====================================================== */

const btnSalvarLead = document.getElementById("btnSalvarLead");
const btnEnviar = document.getElementById("btn-enviar");
const errorEl = document.getElementById("error");

const leadCard = document.getElementById("lead-card");
const diagnosticoCard = document.getElementById("diagnostico-card");

const resultadosSection = document.getElementById("resultados");
const resultGrid = document.getElementById("result-grid");

/* ======================================================
   SALVAR LEAD (EMPRESA / PESSOA)
====================================================== */

btnSalvarLead.addEventListener("click", async () => {
  errorEl.textContent = "";

  try {
    if (currentFormType === "diagnostico") {
      /* ===== EMPRESA ===== */
      const payload = getFormData("form-empresa");

      const empresaPayload = {
        nome_empresa: payload.nome_empresa,
        nome_responsavel: payload.nome_responsavel,
        email: payload.email,
        whatsapp: payload.whatsapp,
        cidade: payload.cidade,
        estado: payload.estado,
        segmento: payload.segmento,
        tipo_negocio: payload.tipo_negocio,
        porte_empresa: payload.porte_empresa,
        faturamento_estimado: payload.faturamento_estimado,
        numero_unidades:
          payload.segmento === "franquia"
            ? Number(payload.numero_unidades || 0)
            : null,
        numero_colaboradores: Number(payload.numero_colaboradores),
        tempo_operacao: payload.tempo_operacao,
      };

      const resp = await fetch(API_EMPRESA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empresaPayload),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Erro ao salvar empresa.");
      }

      const data = await resp.json();
      leadId = data.id;
    } else {
      /* ===== PESSOA ===== */
      const payload = getFormData("form-pessoa");

      const pessoaPayload = {
        nome_completo: payload.nome_completo,
        email: payload.email,
        whatsapp: payload.whatsapp,
        cidade: payload.cidade,
        estado: payload.estado,
        profissao_atual: payload.profissao_atual,
        ja_empreende: payload.ja_empreende, // sim | nao
        tipo_negocio_desejado: payload.tipo_negocio_desejado,
        ideia: payload.ideia, // propria | franquia
        previsao_investimento: payload.previsao_investimento,
        prazo_para_abrir: payload.prazo_para_abrir,
      };

      const resp = await fetch(API_PESSOA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pessoaPayload),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Erro ao salvar pessoa.");
      }

      const data = await resp.json();
      leadId = data.id;
    }

    /* ===== AVANÇA PARA PERGUNTAS ===== */
    leadCard.style.display = "none";
    diagnosticoCard.style.display = "block";
  } catch (err) {
    console.error(err);
    errorEl.textContent =
      err.message || "Erro ao salvar seus dados. Verifique e tente novamente.";
  }
});

/* ======================================================
   ENVIO DO DIAGNÓSTICO / VIABILIDADE
====================================================== */

btnEnviar.addEventListener("click", async () => {
  errorEl.textContent = "";
  resultadosSection.style.display = "none";
  resultGrid.innerHTML = "";

  const areas =
    currentFormType === "diagnostico"
      ? window.DIAGNOSTICO_AREAS
      : window.VIABILIDADE_AREAS;

  const payload = {};

  for (const [areaNome, perguntas] of Object.entries(areas)) {
    const pontos = [];

    for (let i = 0; i < perguntas.length; i++) {
      const name = `${areaNome}__${i}`;
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

    payload[areaNome] = pontos;
  }

  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviando...";

  try {
    const endpoint =
      currentFormType === "diagnostico"
        ? API_DIAGNOSTICO_URL
        : API_VIABILIDADE_URL;

    const body =
      currentFormType === "diagnostico"
        ? payload
        : { respostas: payload };

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(txt || "Erro ao processar diagnóstico.");
    }

    const data = await resp.json();

    /* ===== RENDER RESULTADOS ===== */
    Object.entries(data.areas || {}).forEach(([area, res]) => {
      const card = document.createElement("div");
      card.className = "result-card";

      card.innerHTML = `
        <h3>${escapeHtml(area)}</h3>
        <p class="result-score">
          Pontuação: ${res.total_pontos} / ${res.pontuacao_maxima} (${res.percentual}%)
        </p>
        ${res.mensagem ? `<p class="result-message">${escapeHtml(res.mensagem)}</p>` : ""}
      `;

      resultGrid.appendChild(card);
    });

    resultadosSection.style.display = "block";
  } catch (err) {
    console.error(err);
    errorEl.textContent =
      err.message || "Erro ao enviar diagnóstico.";
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = "Enviar diagnóstico";
  }
});
