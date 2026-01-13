const API_BASE = "https://ce-infinity.onrender.com/api";

const $ = (sel) => document.querySelector(sel);

function renderList(items, tipo) {
  if (!items.length) {
    return '<p class="empty-state">Sem leads cadastrados.</p>';
  }

  const list = items
    .map(
      (lead) => `
        <li>
          <a href="./admin-lead.html?tipo=${tipo}&lead_id=${lead.id}">
            ${lead.nome} (ID ${lead.id})
          </a>
          <span class="lead-meta">${lead.email || "-"} • ${lead.whatsapp || "-"}</span>
        </li>
      `
    )
    .join("");

  return `<ul class="lead-list">${list}</ul>`;
}

async function loadLeads() {
  const resp = await fetch(`${API_BASE}/admin/leads`);
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(detail || `Erro ${resp.status} ao carregar leads.`);
  }

  const data = await resp.json();
  $("#leads-diagnostico").innerHTML = renderList(data.diagnostico || [], "diagnostico");
  $("#leads-viabilidade").innerHTML = renderList(data.viabilidade || [], "viabilidade");
}

function init() {
  loadLeads().catch((err) => {
    console.error(err);
    $("#leads-diagnostico").innerHTML = '<p class="empty-state">Erro ao carregar.</p>';
    $("#leads-viabilidade").innerHTML = '<p class="empty-state">Erro ao carregar.</p>';
  });
}

document.addEventListener("DOMContentLoaded", init);
