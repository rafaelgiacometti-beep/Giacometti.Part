// 1. Variáveis globais e utilitários
const today = new Date().toISOString().split('T')[0];

// 2. Estado inicial e persistência de dados
function seedData() {
  return {
    clientes: [],
    produtos: [],
    vendas: []
  };
}

function loadData() {
  const data = localStorage.getItem('caixa_pro_db');
  if (!data) {
    const initialData = seedData();
    localStorage.setItem('caixa_pro_db', JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
}

function saveData(data) {
  localStorage.setItem('caixa_pro_db', JSON.stringify(data));
}

// 3. Sistema de renderização de páginas
function renderPage(pageKey) {
  const db = loadData();
  const content = document.getElementById('content');

  if (pageKey === 'dashboard') {
    const totalVendas = db.vendas.reduce((acc, v) => acc + (v.total || 0), 0);
    content.innerHTML = `
      <h2>🏠 Início</h2>
      <div class="card">
        <p><strong>Data de hoje:</strong> ${today}</p>
        <p><strong>Total Faturado:</strong> € ${totalVendas.toFixed(2)}</p>
        <p><strong>Total de Vendas:</strong> ${db.vendas.length}</p>
        <p><strong>Clientes Cadastrados:</strong> ${db.clientes.length}</p>
        <p><strong>Produtos no Catálogo:</strong> ${db.produtos.length}</p>
      </div>
    `;
  }

  else if (pageKey === 'clientes') {
    content.innerHTML = `
      <h2>👥 Clientes</h2>
      <div class="card">
        <h3>Cadastrar Novo Cliente</h3>
        <form id="formCliente" style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
          <input type="text" id="nomeCliente" placeholder="Nome do cliente" required style="padding:8px;">
          <input type="tel" id="telCliente" placeholder="Telefone / Contato" required style="padding:8px;">
          <button type="submit" class="btn" style="padding:10px; background:#10B981; color:#fff; border:none; border-radius:4px; cursor:pointer;">Adicionar Cliente</button>
        </form>
      </div>
      <div class="card">
        <h3>Lista de Clientes</h3>
        ${db.clientes.length === 0 ? '<p>Nenhum cliente cadastrado.</p>' : ''}
        <ul>
          ${db.clientes.map(c => `<li><strong>${c.nome}</strong> - ${c.telefone}</li>`).join('')}
        </ul>
      </div>
    `;

    document.getElementById('formCliente').addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('nomeCliente').value.trim();
      const telefone = document.getElementById('telCliente').value.trim();

      db.clientes.push({ id: Date.now(), nome, telefone });
      saveData(db);
      renderPage('clientes');
    });
  }

  else if (pageKey === 'produtos') {
    content.innerHTML = `
      <h2>📦 Produtos</h2>
      <div class="card">
        <h3>Cadastrar Novo Produto</h3>
        <form id="formProduto" style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
          <input type="text" id="nomeProduto" placeholder="Nome do produto" required style="padding:8px;">
          <input type="number" step="0.01" id="precoProduto" placeholder="Preço (€)" required style="padding:8px;">
          <input type="number" id="stockProduto" placeholder="Quantidade em Stock" required style="padding:8px;">
          <button type="submit" class="btn" style="padding:10px; background:#10B981; color:#fff; border:none; border-radius:4px; cursor:pointer;">Adicionar Produto</button>
        </form>
      </div>
      <div class="card">
        <h3>Catálogo de Produtos</h3>
        ${db.produtos.length === 0 ? '<p>Nenhum produto cadastrado.</p>' : ''}
        <ul>
          ${db.produtos.map(p => `<li><strong>${p.nome}</strong> - €${Number(p.preco).toFixed(2)} (Stock: ${p.stock})</li>`).join('')}
        </ul>
      </div>
    `;

    document.getElementById('formProduto').addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('nomeProduto').value.trim();
      const preco = parseFloat(document.getElementById('precoProduto').value);
      const stock = parseInt(document.getElementById('stockProduto').value);

      db.produtos.push({ id: Date.now(), nome, preco, stock });
      saveData(db);
      renderPage('produtos');
    });
  }

  else if (pageKey === 'venda') {
    content.innerHTML = `
      <h2>🛒 Registar Venda</h2>
      <div class="card">
        <form id="formVenda" style="display:flex; flex-direction:column; gap:10px;">
          <label><strong>Cliente:</strong></label>
          <select id="selectCliente" required style="padding:8px;">
            <option value="">-- Selecione o cliente --</option>
            ${db.clientes.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('')}
          </select>

          <label><strong>Produto:</strong></label>
          <select id="selectProduto" required style="padding:8px;">
            <option value="">-- Selecione o produto --</option>
            ${db.produtos.map(p => `<option value="${p.id}">${p.nome} (€${Number(p.preco).toFixed(2)} - Stock: ${p.stock})</option>`).join('')}
          </select>

          <label><strong>Quantidade:</strong></label>
          <input type="number" id="qtdVenda" value="1" min="1" required style="padding:8px;">

          <button type="submit" class="btn" style="padding:12px; background:#10B981; color:#fff; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">Finalizar Venda</button>
        </form>
      </div>

      <div class="card">
        <h3>Histórico de Vendas</h3>
        ${db.vendas.length === 0 ? '<p>Nenhuma venda realizada.</p>' : ''}
        <ul>
          ${db.vendas.map(v => `<li><strong>${v.data}</strong> - ${v.cliente}: ${v.produto} (${v.qtd}x) = €${v.total.toFixed(2)}</li>`).join('')}
        </ul>
      </div>
    `;

    document.getElementById('formVenda').addEventListener('submit', (e) => {
      e.preventDefault();
      const clienteNome = document.getElementById('selectCliente').value;
      const produtoId = parseInt(document.getElementById('selectProduto').value);
      const qtd = parseInt(document.getElementById('qtdVenda').value);

      const produto = db.produtos.find(p => p.id === produtoId);

      if (!produto) {
        alert('Selecione um produto válido!');
        return;
      }

      if (produto.stock < qtd) {
        alert(`Stock insuficiente! Apenas ${produto.stock} unidades disponíveis.`);
        return;
      }

      // Baixa no estoque e registro da venda
      produto.stock -= qtd;
      const total = produto.preco * qtd;

      db.vendas.push({
        id: Date.now(),
        data: today,
        cliente: clienteNome,
        produto: produto.nome,
        qtd,
        total
      });

      saveData(db);
      alert('Venda realizada com sucesso!');
      renderPage('venda');
    });
  }

  else if (pageKey === 'mais') {
    content.innerHTML = `
      <h2>☰ Mais</h2>
      <div class="card">
        <p>Configurações do Caixa Pro.</p>
        <button id="resetDataBtn" style="padding:8px; background:#EF4444; color:#fff; border:none; border-radius:4px; cursor:pointer;">Apagar Todos os Dados</button>
      </div>
    `;

    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Atenção: deseja apagar todos os dados registrados?')) {
          localStorage.removeItem('caixa_pro_db');
          location.reload();
        }
      });
    }
  }
}

// 4. Inicialização do sistema
document.addEventListener('DOMContentLoaded', () => {
  const db = loadData();
  const navButtons = document.querySelectorAll('.bottom-nav button');
  const backupBtn = document.getElementById('backupBtn');

  // Navegação no menu inferior
  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const targetPage = button.getAttribute('data-page');
      renderPage(targetPage);
    });
  });

  // Backup dos dados
  if (backupBtn) {
    backupBtn.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `caixa_pro_backup_${today}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // Carrega a aba inicial
  renderPage('dashboard');
});