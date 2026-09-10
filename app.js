/* jshint esversion: 8 */

// --- CONFIGURAÇÃO GOOGLE DRIVE API ---
const GOOGLE_CLIENT_ID = "536190457559-qgpncmfg55dm3p4mu60if7akfnaulebs.apps.googleusercontent.com";
let accessToken = null;

// --- ESTADO DA APLICAÇÃO ---
const today = new Date().toISOString().split('T')[0];
let activeCompany = localStorage.getItem('selected_company') || null;

window.mudarAba = function(aba) {
  const btn = document.querySelector(`.bottom-nav button[data-page="${aba}"]`);
  if (btn) btn.click();
  else renderPage(aba);
};

window.selecionarEmpresa = function(empresa) {
  activeCompany = empresa;
  localStorage.setItem('selected_company', empresa);
  const nav = document.getElementById('bottomNav');
  if (nav) nav.style.display = 'flex';
  renderPage('dashboard');
};

window.trocarEmpresa = function() {
  activeCompany = null;
  localStorage.removeItem('selected_company');
  const nav = document.getElementById('bottomNav');
  if (nav) nav.style.display = 'none';
  renderCompanySelection();
};

function getDbKey() {
  return activeCompany === 'rg3d' ? 'rg3d_db' : 'g_peptides_db';[cite: 1]
}

function loadData() {
  const key = getDbKey();
  const data = localStorage.getItem(key);
  if (!data) {
    const initialData = { clientes: [], produtos: [], vendas: [] };
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(data);
  } catch(e) {
    return { clientes: [], produtos: [], vendas: [] };
  }
}

function saveData(data) {
  localStorage.setItem(getDbKey(), JSON.stringify(data));
}

// --- TELA SELEÇÃO DE EMPRESAS ---
function renderCompanySelection() {
  const content = document.getElementById('content');
  const topbarBrand = document.querySelector('.topbar .brand');
  const topbarSub = document.querySelector('.topbar .subtitle');

  if (topbarBrand) topbarBrand.textContent = "⚡ GIACOMETTI HUB";
  if (topbarSub) topbarSub.textContent = "Selecione a empresa para gerir";

  if (content) {
    content.innerHTML = `
      <div style="text-align:center; margin-top:20px; margin-bottom:20px;">
        <h2 style="font-size:1.2rem; color:#1f2937;">Qual empresa deseja gerir hoje?</h2>
      </div>

      <div class="company-select-container" style="display:flex; flex-direction:column; gap:12px; padding:12px;">
        <div class="company-card peptides" onclick="selecionarEmpresa('peptides')" style="padding:16px; background:#fff; border-radius:12px; border:1px solid #e5e7eb; cursor:pointer;">
          <div class="company-icon" style="font-size:2rem;">🧪</div>
          <div class="company-info">
            <h3 style="margin:4px 0;">G. Peptídeos</h3>
            <p style="margin:0; color:#6b7280; font-size:0.85rem;">Gestão de peptídeos, stock e vendas</p>
          </div>
        </div>

        <div class="company-card rg3d" onclick="selecionarEmpresa('rg3d')" style="padding:16px; background:#fff; border-radius:12px; border:1px solid #10b981; cursor:pointer;">
          <div class="company-icon" style="font-size:2rem;">🖨️</div>
          <div class="company-info">
            <h3 style="margin:4px 0;">RG3D</h3>[cite: 1]
            <p style="margin:0; color:#6b7280; font-size:0.85rem;">Sua ideia ganha forma.</p>[cite: 1]
          </div>
        </div>
      </div>
    `;
  }
}

// --- RENDERIZAÇÃO DAS PÁGINAS ---
function renderPage(pageKey) {
  if (!activeCompany) {
    const nav = document.getElementById('bottomNav');
    if (nav) nav.style.display = 'none';
    renderCompanySelection();
    return;
  }

  const db = loadData();
  const content = document.getElementById('content');
  const topbarBrand = document.querySelector('.topbar .brand');
  const topbarSub = document.querySelector('.topbar .subtitle');

  if (activeCompany === 'rg3d') {[cite: 1]
    if (topbarBrand) topbarBrand.textContent = "🖨️ RG3D";[cite: 1]
    if (topbarSub) topbarSub.textContent = "Sua ideia ganha forma.";[cite: 1]
  } else {
    if (topbarBrand) topbarBrand.textContent = "🧪 G. PEPTÍDEOS";[cite: 1]
    if (topbarSub) topbarSub.textContent = "Gestão & Controlo Financeiro";
  }

  if (!content) return;

  if (pageKey === 'dashboard') {
    const totalVendas = db.vendas.reduce((acc, v) => acc + (v.total || 0), 0);
    const totalCusto = db.vendas.reduce((acc, v) => acc + (v.custoTotal || 0), 0);
    const lucroTotal = totalVendas - totalCusto;

    content.innerHTML = `
      <div class="card" style="padding:16px; background:#fff; border-radius:12px; margin:12px; border:1px solid #e5e7eb;">
        <h3>${activeCompany === 'rg3d' ? 'RG3D' : 'G. Peptídeos'} 👋</h3>[cite: 1]
        <p style="color:#6b7280; font-size:0.9rem;">${activeCompany === 'rg3d' ? 'Sua ideia ganha forma.' : 'Painel de controlo ativo'}</p>[cite: 1]
      </div>

      <div class="card" style="padding:16px; background:#fff; border-radius:12px; margin:12px; border:1px solid #e5e7eb;">
        <h3>📈 Indicadores Financeiros</h3>
        <p><strong>Total Faturado:</strong> € ${totalVendas.toFixed(2)}</p>
        <p><strong>Custo Total:</strong> € ${totalCusto.toFixed(2)}</p>
        <p><strong>Lucro Líquido:</strong> <span style="color:#10b981; font-weight:bold;">€ ${lucroTotal.toFixed(2)}</span></p>
      </div>
    `;
  }
  else if (pageKey === 'mais') {
    content.innerHTML = `
      <div class="card" style="padding:16px; background:#fff; border-radius:12px; margin:12px; border:1px solid #e5e7eb;">
        <h3>🔄 Trocar de Empresa</h3>
        <button onclick="trocarEmpresa()" style="padding:12px; width:100%; background:#3b82f6; color:#fff; border:none; border-radius:12px; cursor:pointer; font-weight:bold;">Trocar Empresa</button>
      </div>
    `;
  }
}

// --- EXECUÇÃO INCONDICIONAL ---
function init() {
  if (activeCompany) {
    const nav = document.getElementById('bottomNav');
    if (nav) nav.style.display = 'flex';
    renderPage('dashboard');
  } else {
    renderCompanySelection();
  }
}

init();