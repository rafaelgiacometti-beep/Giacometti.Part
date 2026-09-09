// 1. Estado da empresa selecionada e utilitários
const today = new Date().toISOString().split('T')[0];
let currentCompany = localStorage.getItem('selected_company') || null;

window.mudarAba = function(aba) {
  const btn = document.querySelector(`.bottom-nav button[data-page="${aba}"]`);
  if (btn) btn.click();
  else renderPage(aba);
};

window.selecionarEmpresa = function(empresa) {
  currentCompany = empresa;
  localStorage.setItem('selected_company', empresa);
  document.getElementById('bottomNav').style.display = 'flex';
  renderPage('dashboard');
};

window.trocarEmpresa = function() {
  currentCompany = null;
  localStorage.removeItem('selected_company');
  document.getElementById('bottomNav').style.display = 'none';
  renderCompanySelection();
};

// 2. Persistência de Dados Isolada
function getDbKey() {
  return currentCompany === 'rg3d' ? 'rg3d_db' : 'g_peptides_db';
}

function loadData() {
  const key = getDbKey();
  const data = localStorage.getItem(key);
  if (!data) {
    const initialData = { clientes: [], produtos: [], vendas: [] };
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
}

function saveData(data) {
  localStorage.setItem(getDbKey(), JSON.stringify(data));
}

// 3. Tela do Hub de Seleção
function renderCompanySelection() {
  const content = document.getElementById('content');
  const topbarBrand = document.querySelector('.topbar .brand');
  const topbarSub = document.querySelector('.topbar .subtitle');

  topbarBrand.textContent = "⚡ PAINEL MULTIEMPRESA";
  topbarSub.textContent = "Selecione a empresa para gerir";

  content.innerHTML = `
    <div style="text-align:center; margin-top:10px; margin-bottom:20px;">
      <h2>Qual empresa deseja gerir hoje?</h2>
    </div>

    <div class="company-select-container">
      <div class="company-card peptides" onclick="selecionarEmpresa('peptides')">
        <div class="company-icon">🧪</div>
        <div class="company-info">
          <h3>G. Peptídeos</h3>
          <p>Gestão de peptídeos, stock e vendas</p>
        </div>
      </div>

      <div class="company-card rg3d" onclick="selecionarEmpresa('rg3d')">
        <div class="company-icon">🖨️</div>
        <div class="company-info">
          <h3>RG3D</h3>
          <p>Sua ideia ganha forma.</p>
        </div>
      </div>
    </div>
  `;
}

// 4. Renderização das Páginas da Empresa Ativa
function renderPage(pageKey) {
  if (!currentCompany) {
    document.getElementById('bottomNav').style.display = 'none';
    renderCompanySelection();
    return;
  }

  const db = loadData();
  const content = document.getElementById('content');
  const topbarBrand = document.querySelector('.topbar .brand');
  const topbarSub = document.querySelector('.topbar .subtitle');

  if (currentCompany === 'rg3d') {
    topbarBrand.textContent = "🖨️ RG3D";
    topbarSub.textContent = "Sua ideia ganha forma.";
  } else {
    topbarBrand.textContent = "🧪 G. PEPTÍDEOS";
    topbarSub.textContent = "Gestão & Controlo Financeiro";
  }

  if (pageKey === 'dashboard') {
    const totalVendas = db.vendas.reduce((acc, v) => acc + (v.total || 0), 0);
    const totalCusto = db.vendas.reduce((acc, v) => acc + (v.custoTotal || 0), 0);
    const lucroTotal = totalVendas - totalCusto;

    content.innerHTML = `
      <div class="card-banner" style="background: ${currentCompany === 'rg3d' ? 'var(--gradient-rg3d)' : 'var(--gradient-blue)'}">
        <div>
          <h3>${currentCompany === 'rg3d' ? 'RG3D' : 'G. Peptídeos'} 👋</h3>
          <p>${currentCompany === 'rg3d' ? 'Sua ideia ganha forma.' : 'Painel de controlo ativo'}</p>
        </div>
        <div class="avatar">${currentCompany === 'rg3d' ? '🖨️' : '🧪'}</div>
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
          <span class="label">${currentCompany === 'rg3d' ? 'Modelos/Filamentos' : 'Produtos'}</span>
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

    document.getElementById('btnNovoPedido').addEventListener('click', () => mudarAba('venda'));

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
      const ctx = document.getElementById('graficoVendas').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ultimosDias,
          datasets: [{
            label: 'Vendas (€)',
            data: totaisPorDia,
            backgroundColor: currentCompany === 'rg3d' ? '#10b981' : '#3b82f6',
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

  else if (pageKey === 'clientes') {
    content.innerHTML = `
      <h2>👥 Gestão de Clientes</h2>
      <div class="card">
        <h3>➕ Cadastrar Novo Cliente</h3>
        <form id="formCliente" style="display:flex; flex-direction:column; gap:8px;">
          <input type="text" id="nomeCliente" placeholder="Nome do cliente" required>
          <input type="tel" id="telCliente" placeholder="Telefone / Contato" required>
          <button type="submit" class="btn-submit" style="background:${currentCompany === 'rg3d' ? '#10b981' : '#3b82f6'};">Adicionar Cliente</button>
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
    const is3D = currentCompany === 'rg3d';
    content.innerHTML = `
      <h2>📦 ${is3D ? 'Catálogo RG3D & Filamentos' : 'Gestão de Peptídeos'}</h2>

      <div class="card">
        <h3>➕ ${is3D ? 'Cadastrar Item 3D / Filamento' : 'Cadastrar Novo Item'}</h3>
        <form id="formProduto" style="display:flex; flex-direction:column; gap:8px;">
          <input type="text" id="nomeProduto" placeholder="${is3D ? 'Nome do modelo 3D ou filamento' : 'Nome do produto / peptídeo'}" required>
          <div style="display:flex; gap:8px;">
            <input type="number" step="0.01" id="custoProduto" placeholder="Custo (€)" required>
            <input type="number" step="0.01" id="vendaProduto" placeholder="Venda (€)" required>
          </div>
          <input type="number" id="stockProduto" placeholder="Quantidade em Stock" required>
          <button type="submit" class="btn-submit" style="background:${is3D ? '#10b981' : '#3b82f6'};">Cadastrar Item</button>
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
        <h3>🔄 Trocar de Empresa</h3>
        <p style="margin-bottom:12px;">Voltar ao menu para selecionar a outra empresa:</p>
        <button onclick="trocarEmpresa()" style="padding:12px; width:100%; background:#3b82f6; color:#fff; border:none; border-radius:12px; cursor:pointer; font-weight:bold;">Trocar Empresa</button>
      </div>

      <div class="card">
        <h3>⚠️ Gerenciamento de Dados (${currentCompany === 'rg3d' ? 'RG3D' : 'G. Peptídeos'})</h3>
        <p style="margin-bottom:12px;">Apaga os dados apenas da empresa atual:</p>
        <button id="resetDataBtn" style="padding:12px; width:100%; background:#ef4444; color:#fff; border:none; border-radius:12px; cursor:pointer; font-weight:bold;">Apagar Dados desta Empresa</button>
      </div>
    `;

    document.getElementById('resetDataBtn').addEventListener('click', () => {
      if (confirm(`Deseja apagar todos os dados de ${currentCompany === 'rg3d' ? 'RG3D' : 'G. Peptídeos'}?`)) {
        localStorage.removeItem(getDbKey());
        location.reload();
      }
    });
  }
}

// 5. Inicialização
document.addEventListener('DOMContentLoaded', () => {
  const navButtons = document.querySelectorAll('.bottom-nav button');
  const backupBtn = document.getElementById('backupBtn');

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
      if (!currentCompany) return alert('Selecione uma empresa primeiro.');
      const db = loadData();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${currentCompany}_backup_${today}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  if (currentCompany) {
    renderPage('dashboard');
  } else {
    renderCompanySelection();
  }
});