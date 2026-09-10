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

// --- INTEGRAÇÃO GOOGLE DRIVE API ---
window.initGoogleAuth = function() {
  if (typeof google === 'undefined' || !google.accounts) {
    alert('A carregar biblioteca do Google. Aguarde 2 segundos e tente novamente.');
    return;
  }
  try {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (tokenResponse) => {
        if (tokenResponse.access_token) {
          accessToken = tokenResponse.access_token;
          alert('Sincronização com o Google Drive ativada!');
        }
      },
    });
    client.requestAccessToken();
  } catch(e) {
    alert('Erro ao conectar com o Google Drive.');
  }
};

// --- RENDERIZAÇÃO DA TELA INICIAL (HUB) ---
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

      <div class="company-select-container">
        <div class="company-card peptides" onclick="selecionarEmpresa('peptides')">
          <div class="company-icon">🧪</div>
          <div class="company-info">
            <h3>G. Peptídeos</h3>[cite: 1]
            <p>Gestão de peptídeos, stock e vendas</p>
          </div>
        </div>

        <div class="company-card rg3d" onclick="selecionarEmpresa('rg3d')">
          <div class="company-icon">🖨️</div>
          <div class="company-info">
            <h3>RG3D</h3>[cite: 1]
            <p>Sua ideia ganha forma.</p>[cite: 1]
          </div>
        </div>
      </div>
    `;
  }
}

// --- RENDERIZAÇÃO DAS PÁGINAS INTERNAS ---
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
      <div class="card-banner" style="background: ${activeCompany === 'rg3d' ? 'var(--gradient-rg3d)' : 'var(--gradient-blue)'}">[cite: 1]
        <div>
          <h3>${activeCompany === 'rg3d' ? 'RG3D' : 'G. Peptídeos'} 👋</h3>[cite: 1]
          <p>${activeCompany === 'rg3d' ? 'Sua ideia ganha forma.' : 'Painel de controlo ativo'}</p>[cite: 1]
        </div>
        <div class="avatar">${activeCompany === 'rg3d' ? '🖨️' : '🧪'}</div>[cite: 1]
      </div>

      <button class="btn-novo-pedido" id="btnNovoPedido">
        <span>➕</span> REGISTAR NOVA VENDA
      </button>

      <div class="grid-atalhos">
        <div class="card-atalho" onclick="mudarAba('venda')">
          <div class="icon-circle">🛒</div>
          <span class="label">Vender</span>
        </div>
        <div class="card-atalho" onclick="mudarAba('clientes')">
          <div class="icon-circle">👥</div>
          <span class="label">Clientes</span>
        </div>
        <div class="card-atalho" onclick="mudarAba('produtos')">
          <div class="icon-circle">📦</div>
          <span class="label">${activeCompany === 'rg3d' ? 'Modelos/Filamentos' : 'Produtos'}</span>[cite: 1]
        </div>
        <div class="card-atalho" onclick="mudarAba('mais')">
          <div class="icon-circle">⚡</div>
          <span class="label">Opções</span>
        </div>
      </div>

      <div class="card">
        <h3>📈 Indicadores Financeiros</h3>
        <p><strong>Total Faturado:</strong> € ${totalVendas.toFixed(2)}</p>
        <p><strong>Custo Total:</strong> € ${totalCusto.toFixed(2)}</p>
        <p><strong>Lucro Líquido:</strong> <span style="color:#10b981; font-weight:bold;">€ ${lucroTotal.toFixed(2)}</span></p>
      </div>
    `;

    const btnNovo = document.getElementById('btnNovoPedido');
    if (btnNovo) btnNovo.addEventListener('click', () => mudarAba('venda'));
  }

  else if (pageKey === 'clientes') {
    content.innerHTML = `
      <h2>👥 Gestão de Clientes</h2>
      <div class="card">
        <h3>➕ Cadastrar Novo Cliente</h3>
        <form id="formCliente" style="display:flex; flex-direction:column; gap:8px;">
          <input type="text" id="nomeCliente" placeholder="Nome do cliente" required>
          <input type="tel" id="telCliente" placeholder="Telefone / Contato" required>
          <button type="submit" class="btn-submit" style="background:${activeCompany === 'rg3d' ? '#10b981' : '#3b82f6'};">Adicionar Cliente</button>[cite: 1]
        </form>
      </div>
      <div class="card">
        <h3>📋 Lista de Clientes</h3>
        ${db.clientes.length === 0 ? '<p>Nenhum cliente cadastrado.</p>' : ''}
        <ul>
          ${db.clientes.map(c => `<li><strong>${c.nome}</strong> - ${c.telefone}</li>`).join('')}
        </ul>
      </div>
    `;

    document.getElementById('formCliente').addEventListener('submit', (e) => {
      e.preventDefault();
      db.clientes.push({ id: Date.now(), nome: document.getElementById('nomeCliente').value.trim(), telefone: document.getElementById('telCliente').value.trim() });
      saveData(db);
      renderPage('clientes');
    });
  }

  else if (pageKey === 'produtos') {
    const is3D = activeCompany === 'rg3d';[cite: 1]
    content.innerHTML = `
      <h2>📦 ${is3D ? 'Catálogo RG3D & Filamentos' : 'Gestão de Peptídeos'}</h2>[cite: 1]

      <!-- NOVO FORMULÁRIO: ENTRADA DE STOCK -->
      <div class="card" style="border:1px solid #10b981;">
        <h3>📥 Entrada de Stock (Item Cadastrado)</h3>
        <form id="formEntradaEstoque" style="display:flex; flex-direction:column; gap:8px;">
          <label style="font-size:0.8rem; color:#6b7280;">Selecione o Item:</label>
          <select id="selectProdutoEntrada" required>
            <option value="">-- Selecione o produto --</option>
            ${db.produtos.map(p => `<option value="${p.id}">${p.nome} (Atual: ${p.stock} un.)</option>`).join('')}
          </select>
          <label style="font-size:0.8rem; color:#6b7280;">Quantidade a Adicionar:</label>
          <input type="number" id="qtdEntrada" placeholder="Ex: 5" min="1" required>
          <button type="submit" class="btn-submit" style="background:#10b981;">Adicionar ao Stock</button>
        </form>
      </div>

      <div class="card">
        <h3>➕ ${is3D ? 'Cadastrar Novo Item 3D / Filamento' : 'Cadastrar Novo Item'}</h3>[cite: 1]
        <form id="formProduto" style="display:flex; flex-direction:column; gap:8px;">
          <input type="text" id="nomeProduto" placeholder="${is3D ? 'Nome do modelo 3D ou filamento' : 'Nome do produto / peptídeo'}" required>[cite: 1]
          <div style="display:flex; gap:8px;">
            <input type="number" step="0.01" id="custoProduto" placeholder="Custo (€)" required>
            <input type="number" step="0.01" id="vendaProduto" placeholder="Venda (€)" required>
          </div>
          <input type="number" id="stockProduto" placeholder="Quantidade Inicial em Stock" required>
          <button type="submit" class="btn-submit" style="background:${is3D ? '#10b981' : '#3b82f6'};">Cadastrar Item</button>[cite: 1]
        </form>
      </div>

      <div class="card">
        <h3>📋 Catálogo Atual</h3>
        ${db.produtos.length === 0 ? '<p>Nenhum item cadastrado.</p>' : ''}
        <ul>
          ${db.produtos.map(p => `
            <li style="margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid #e5e7eb;">
              <strong>${p.nome}</strong><br>
              <span>Stock Atual: <b>${p.stock} un.</b></span> | 
              <span>Custo: €${Number(p.precoCusto || 0).toFixed(2)}</span> | 
              <span>Venda: €${Number(p.precoVenda || p.preco).toFixed(2)}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;

    // Ação: Adicionar ao Stock existente
    document.getElementById('formEntradaEstoque').addEventListener('submit', (e) => {
      e.preventDefault();
      const prodId = parseInt(document.getElementById('selectProdutoEntrada').value);
      const qtdAdd = parseInt(document.getElementById('qtdEntrada').value);

      const produto = db.produtos.find(p => p.id === prodId);
      if (produto) {
        produto.stock += qtdAdd;
        saveData(db);
        alert(`Stock de "${produto.nome}" atualizado! Novo total: ${produto.stock} un.`);
        renderPage('produtos');
      }
    });

    // Ação: Cadastrar Novo Produto
    document.getElementById('formProduto').addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('nomeProduto').value.trim();
      const precoCusto = parseFloat(document.getElementById('custoProduto').value);
      const precoVenda = parseFloat(document.getElementById('vendaProduto').value);
      const stock = parseInt(document.getElementById('stockProduto').value);

      db.produtos.push({ id: Date.now(), nome, precoCusto, precoVenda, preco: precoVenda, stock });
      saveData(db);
      alert('Item cadastrado com sucesso!');
      renderPage('produtos');
    });
  }

  else if (pageKey === 'venda') {
    content.innerHTML = `
      <h2>🛒 Registar Venda</h2>
      <div class="card">
        <form id="formVenda" style="display:flex; flex-direction:column; gap:10px;">
          <label>Cliente:</label>
          <select id="selectCliente" required>
            <option value="">-- Selecione o cliente --</option>
            ${db.clientes.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('')}
          </select>

          <label>Produto / Item:</label>
          <select id="selectProduto" required>
            <option value="">-- Selecione o produto --</option>
            ${db.produtos.map(p => `<option value="${p.id}">${p.nome} (€${Number(p.precoVenda || p.preco).toFixed(2)} - Stock: ${p.stock})</option>`).join('')}
          </select>

          <label>Quantidade:</label>
          <input type="number" id="qtdVenda" value="1" min="1" required>

          <button type="submit" class="btn-submit" style="background:#10b981;">Finalizar Venda</button>
        </form>
      </div>
    `;

    document.getElementById('formVenda').addEventListener('submit', (e) => {
      e.preventDefault();
      const clienteNome = document.getElementById('selectCliente').value;
      const produtoId = parseInt(document.getElementById('selectProduto').value);
      const qtd = parseInt(document.getElementById('qtdVenda').value);

      const produto = db.produtos.find(p => p.id === produtoId);
      if (!produto) return alert('Selecione um produto válido!');
      if (produto.stock < qtd) return alert(`Stock insuficiente! Restam apenas ${produto.stock}.`);

      produto.stock -= qtd;
      const precoVenda = produto.precoVenda || produto.preco;
      const precoCusto = produto.precoCusto || 0;
      const total = precoVenda * qtd;
      const custoTotal = precoCusto * qtd;
      const lucro = total - custoTotal;

      db.vendas.push({ id: Date.now(), data: today, cliente: clienteNome, produto: produto.nome, qtd, total, custoTotal, lucro });
      saveData(db);
      alert(`Venda efetuada! Lucro: € ${lucro.toFixed(2)}`);
      renderPage('venda');
    });
  }

  else if (pageKey === 'mais') {
    content.innerHTML = `
      <h2>⚡ Opções da Empresa</h2>
      <div class="card">
        <h3>☁️ Sincronização em Nuvem</h3>
        <p style="margin-bottom:12px;">Conectar com Google Drive API para salvamento automático:</p>
        <button onclick="initGoogleAuth()" style="padding:12px; width:100%; background:#4285f4; color:#fff; border:none; border-radius:12px; cursor:pointer; font-weight:bold;">Ativar Google Drive</button>
      </div>

      <div class="card">
        <h3>🔄 Trocar de Empresa</h3>
        <p style="margin-bottom:12px;">Voltar ao menu para selecionar a outra empresa:</p>
        <button onclick="trocarEmpresa()" style="padding:12px; width:100%; background:#3b82f6; color:#fff; border:none; border-radius:12px; cursor:pointer; font-weight:bold;">Trocar Empresa</button>
      </div>
    `;
  }
}

// --- ARRANQUE DA APLICAÇÃO ---
function boot() {
  const navButtons = document.querySelectorAll('.bottom-nav button');

  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      renderPage(button.getAttribute('data-page'));
    });
  });

  if (activeCompany) {
    const nav = document.getElementById('bottomNav');
    if (nav) nav.style.display = 'flex';
    renderPage('dashboard');
  } else {
    renderCompanySelection();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}