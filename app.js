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
  if (accessToken) {
    syncToDrive();
  }
}

// --- INTEGRAÇÃO GOOGLE DRIVE API ---
window.initGoogleAuth = function() {
  if (typeof google === 'undefined' || !google.accounts) {
    alert('A biblioteca do Google ainda está a carregar. Tente novamente em alguns segundos.');
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
          syncToDrive();
        }
      },
    });
    client.requestAccessToken();
  } catch(e) {
    alert('Erro ao iniciar login do Google.');
  }
};

async function syncToDrive() {
  if (!accessToken || !activeCompany) return;
  const db = loadData();
  const fileName = `${getDbKey()}_backup.json`;
  const fileContent = JSON.stringify(db, null, 2);

  try {
    const metadata = { name: fileName, mimeType: 'application/json' };
    const file = new Blob([fileContent], { type: 'application/json' });
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: formData
    });
  } catch (err) {
    console.error('Erro na sincronização:', err);
  }
}

// --- PROCESSADOR STL (RG3D) ---
function processSTL(file, fillDensity = 0.20) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const buffer = e.target.result;
        const dataView = new DataView(buffer);
        const triangles = dataView.getUint32(80, true);
        let totalVolume = 0;

        for (let i = 0; i < triangles; i++) {
          const offset = 84 + i * 50;
          const v1x = dataView.getFloat32(offset + 12, true);
          const v1y = dataView.getFloat32(offset + 16, true);
          const v1z = dataView.getFloat32(offset + 20, true);

          const v2x = dataView.getFloat32(offset + 24, true);
          const v2y = dataView.getFloat32(offset + 28, true);
          const v2z = dataView.getFloat32(offset + 32, true);

          const v3x = dataView.getFloat32(offset + 36, true);
          const v3y = dataView.getFloat32(offset + 40, true);
          const v3z = dataView.getFloat32(offset + 44, true);

          const v321 = v3x * v2y * v1z;
          const v231 = v2x * v3y * v1z;
          const v312 = v3x * v1y * v2z;
          const v132 = v1x * v3y * v2z;
          const v213 = v2x * v1y * v3z;
          const v123 = v1x * v2y * v3z;

          totalVolume += (-v321 + v231 + v312 - v132 - v213 + v123) / 6.0;
        }

        const volumeCm3 = Math.abs(totalVolume) / 1000;
        const pesoGrams = volumeCm3 * 1.24 * fillDensity;
        resolve({ volumeCm3, pesoGrams });
      } catch(err) {
        reject(err);
      }
    };
    reader.onerror = error => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

// --- RENDERIZAÇÃO DE TELAS ---
function renderCompanySelection() {
  const content = document.getElementById('content');
  const topbarBrand = document.querySelector('.topbar .brand');
  const topbarSub = document.querySelector('.topbar .subtitle');

  if (topbarBrand) topbarBrand.textContent = "⚡ GIACOMETTI HUB";
  if (topbarSub) topbarSub.textContent = "Selecione a empresa para gerir";

  if (content) {
    content.innerHTML = `
      <div style="text-align:center; margin-top:10px; margin-bottom:20px;">
        <h2>Qual empresa deseja gerir hoje?</h2>
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
        <h3>📊 Desempenho de Vendas</h3>
        <canvas id="graficoVendas" style="width:100%; max-height:180px;"></canvas>
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

    const ultimosDias = [];
    const totaisPorDia = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dataFormatada = d.toISOString().split('T')[0];
      
      const totalDia = db.vendas
        .filter(v => v.data === dataFormatada)
        .reduce((sum, v) => sum + (v.total || 0), 0);

      ultimosDias.push(dataFormatada.slice(8, 10) + '/' + dataFormatada.slice(5, 7));
      totaisPorDia.push(totalDia);
    }

    if (typeof Chart !== 'undefined') {
      const canvas = document.getElementById('graficoVendas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ultimosDias,
            datasets: [{
              label: 'Vendas (€)',
              data: totaisPorDia,
              backgroundColor: activeCompany === 'rg3d' ? '#10b981' : '#3b82f6',[cite: 1]
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { display: false } },
              x: { grid: { display: false } }
            }
          }
        });
      }
    }
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

      ${is3D ? `
      <div class="card" style="border:2px solid #10b981;">
        <h3>📐 Calculadora de Custo STL 3D</h3>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <label>Ficheiro STL:</label>
          <input type="file" id="stlFileInput" accept=".stl">
          <label>Preenchimento (Infill %):</label>
          <input type="number" id="stlInfill" value="20" min="5" max="100">
          <label>Preço do Rolo de Filamento (€/kg):</label>
          <input type="number" id="stlFilamentCost" value="20.00" step="0.01">
          <button id="btnCalcStl" class="btn-submit" style="background:#10b981;">Calcular Custo da Peça</button>
          <div id="stlResult" style="margin-top:10px; font-size:0.9rem;"></div>
        </div>
      </div>
      ` : ''}

      <div class="card">
        <h3>➕ ${is3D ? 'Cadastrar Item 3D / Filamento' : 'Cadastrar Novo Item'}</h3>[cite: 1]
        <form id="formProduto" style="display:flex; flex-direction:column; gap:8px;">
          <input type="text" id="nomeProduto" placeholder="${is3D ? 'Nome do modelo 3D ou filamento' : 'Nome do produto / peptídeo'}" required>[cite: 1]
          <div style="display:flex; gap:8px;">
            <input type="number" step="0.01" id="custoProduto" placeholder="Custo (€)" required>
            <input type="number" step="0.01" id="vendaProduto" placeholder="Venda (€)" required>
          </div>
          <input type="number" id="stockProduto" placeholder="Quantidade em Stock" required>
          <button type="submit" class="btn-submit" style="background:${is3D ? '#10b981' : '#3b82f6'};">Cadastrar Item</button>[cite: 1]
        </form>
      </div>

      <div class="card">
        <h3>📥 Reposição de Stock</h3>
        <form id="formEntradaEstoque" style="display:flex; flex-direction:column; gap:8px;">
          <select id="selectProdutoEntrada" required>
            <option value="">-- Selecione o Item --</option>
            ${db.produtos.map(p => `<option value="${p.id}">${p.nome} (Atual: ${p.stock})</option>`).join('')}
          </select>
          <input type="number" id="qtdEntrada" placeholder="Quantidade a adicionar" min="1" required>
          <button type="submit" class="btn-submit" style="background:#10b981;">Adicionar ao Stock</button>
        </form>
      </div>

      <div class="card">
        <h3>📋 Catálogo Atual</h3>
        ${db.produtos.length === 0 ? '<p>Nenhum item cadastrado.</p>' : ''}
        <ul>
          ${db.produtos.map(p => {
            const lucroUnit = (p.precoVenda || p.preco) - (p.precoCusto || 0);
            return `
              <li style="margin-bottom:10px; padding-bottom:8px;">
                <strong>${p.nome}</strong><br>
                <span>Stock: <b>${p.stock}</b></span> | 
                <span>Custo: €${Number(p.precoCusto || 0).toFixed(2)}</span> | 
                <span>Venda: €${Number(p.precoVenda || p.preco).toFixed(2)}</span><br>
                <small style="color:#10b981; font-weight:bold;">Lucro un.: €${lucroUnit.toFixed(2)}</small>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;

    if (is3D) {[cite: 1]
      const btnStl = document.getElementById('btnCalcStl');
      if (btnStl) {
        btnStl.addEventListener('click', async () => {
          const fileInput = document.getElementById('stlFileInput');
          if (!fileInput || !fileInput.files.length) return alert('Selecione um ficheiro .stl');
          const infill = parseFloat(document.getElementById('stlInfill').value) / 100;
          const filamentCost = parseFloat(document.getElementById('stlFilamentCost').value);

          try {
            const res = await processSTL(fileInput.files[0], infill);
            const custoMaterial = (res.pesoGrams / 1000) * filamentCost;
            const precoSugerido = custoMaterial * 3;

            document.getElementById('stlResult').innerHTML = `
              <p><strong>Peso Estimado:</strong> ${res.pesoGrams.toFixed(2)} g</p>
              <p><strong>Custo de Material:</strong> € ${custoMaterial.toFixed(2)}</p>
              <p><strong>Preço Sugerido (3x):</strong> <span style="color:#10b981; font-weight:bold;">€ ${precoSugerido.toFixed(2)}</span></p>
            `;
          } catch (e) {
            alert('Erro ao ler ficheiro STL.');
          }
        });
      }
    }

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

    document.getElementById('formEntradaEstoque').addEventListener('submit', (e) => {
      e.preventDefault();
      const prodId = parseInt(document.getElementById('selectProdutoEntrada').value);
      const qtdAdd = parseInt(document.getElementById('qtdEntrada').value);
      const produto = db.produtos.find(p => p.id === prodId);
      if (produto) {
        produto.stock += qtdAdd;
        saveData(db);
        alert(`Stock de ${produto.nome} atualizado!`);
        renderPage('produtos');
      }
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

      <div class="card">
        <h3>📋 Histórico de Vendas</h3>
        ${db.vendas.length === 0 ? '<p>Nenhuma venda registrada nesta empresa.</p>' : ''}
        <ul>
          ${db.vendas.map(v => `
            <li>
              <strong>${v.data}</strong> - ${v.cliente}<br>
              ${v.produto} (${v.qtd}x) = €${v.total.toFixed(2)}
              <br><small style="color:#10b981; font-weight:bold;">Lucro desta venda: €${(v.lucro || 0).toFixed(2)}</small>
            </li>
          `).join('')}
        </ul>
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

      <div class="card">
        <h3>⚠️ Gerenciamento de Dados (${activeCompany === 'rg3d' ? 'RG3D' : 'G. Peptídeos'})</h3>[cite: 1]
        <p style="margin-bottom:12px;">Apaga os dados apenas da empresa atual:</p>
        <button id="resetDataBtn" style="padding:12px; width:100%; background:#ef4444; color:#fff; border:none; border-radius:12px; cursor:pointer; font-weight:bold;">Apagar Dados desta Empresa</button>
      </div>
    `;

    document.getElementById('resetDataBtn').addEventListener('click', () => {
      if (confirm(`Deseja apagar todos os dados de ${activeCompany === 'rg3d' ? 'RG3D' : 'G. Peptídeos'}?`)) {[cite: 1]
        localStorage.removeItem(getDbKey());
        location.reload();
      }
    });
  }
}

// --- INICIALIZAÇÃO AUTOMÁTICA ---
document.addEventListener('DOMContentLoaded', () => {
  const navButtons = document.querySelectorAll('.bottom-nav button');
  const backupBtn = document.getElementById('backupBtn');
  const driveBtn = document.getElementById('driveBtn');

  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      renderPage(button.getAttribute('data-page'));
    });
  });

  if (backupBtn) {
    backupBtn.addEventListener('click', () => {
      if (!activeCompany) return alert('Selecione uma empresa primeiro.');
      const db = loadData();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${activeCompany}_backup_${today}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  if (driveBtn) {
    driveBtn.addEventListener('click', () => {
      initGoogleAuth();
    });
  }

  // Executa imediatamente a renderização da tela
  if (activeCompany) {
    const nav = document.getElementById('bottomNav');
    if (nav) nav.style.display = 'flex';
    renderPage('dashboard');
  } else {
    renderCompanySelection();
  }
});