// 1. Variáveis globais e utilitários
const today = new Date().toISOString().split('T')[0];

window.mudarAba = function(aba) {
  const btn = document.querySelector(`.bottom-nav button[data-page="${aba}"]`);
  if (btn) btn.click();
  else renderPage(aba);
};

// 2. Estado inicial e persistência de dados
function seedData() {
  return {
    clientes: [],
    produtos: [],
    vendas: []
  };
}

function loadData() {
  const data = localStorage.getItem('giacometti_farm_db');
  if (!data) {
    const initialData = seedData();
    localStorage.setItem('giacometti_farm_db', JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
}

function saveData(data) {
  localStorage.setItem('giacometti_farm_db', JSON.stringify(data));
}

// 3. Sistema de renderização de páginas
function renderPage(pageKey) {
  const db = loadData();
  const content = document.getElementById('content');

  if (pageKey === 'dashboard') {
    const totalVendas = db.vendas.reduce((acc, v) => acc + (v.total || 0), 0);
    const totalCusto = db.vendas.reduce((acc, v) => acc + (v.custoTotal || 0), 0);
    const lucroTotal = totalVendas - totalCusto;

    content.innerHTML = `
      <div class="card-banner">
        <div>
          <h3>Olá, Rafael! 👋</h3>
          <p>Painel de controlo - Giacometti Farm</p>
        </div>
        <div class="avatar">🚜</div>
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
          <span class="label">Produtos</span>
        </div>
        <div class="card-atalho" onclick="mudarAba('mais')">
          <div class="icon-circle">⚡</div>
          <span class="label">Mais</span>
        </div>
      </div>

      <div class="card">
        <h3>📊 Desempenho de Vendas</h3>
        <canvas id="graficoVendas" style="width:100%; max-height:180px;"></canvas>
      </div>

      <div class="card">
        <h3>📈 Indicadores Financeiros</h3>
        <p><strong>Total Faturado:</strong> € ${totalVendas.toFixed(2)}</p>
        <p><strong>Custo das Mercadorias:</strong> € ${totalCusto.toFixed(2)}</p>
        <p><strong>Lucro Líquido:</strong> <span style="color:#10b981; font-weight:bold;">€ ${lucroTotal.toFixed(2)}</span></p>
      </div>
    `;

    document.getElementById('btnNovoPedido').addEventListener('click', () => {
      mudarAba('venda');
    });

    // Lógica do Gráfico de Vendas
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
            backgroundColor: '#3b82f6',
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
          <button type="submit" class="btn-submit">Adicionar Cliente</button>
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
      const nome = document.getElementById('nomeCliente').value.trim();
      const telefone = document.getElementById('telCliente').value.trim();

      db.clientes.push({ id: Date.now(), nome, telefone });
      saveData(db);
      renderPage('clientes');
    });
  }

  else if (pageKey === 'produtos') {
    content.innerHTML = `
      <h2>📦 Gestão de Produtos e Stock</h2>

      <div class="card">
        <h3>➕ Cadastrar Novo Produto</h3>
        <form id="formProduto" style="display:flex; flex-direction:column; gap:8px;">
          <input type="text" id="nomeProduto" placeholder="Nome do produto" required>
          <div style="display:flex; gap:8px;">
            <input type="number" step="0.01" id="custoProduto" placeholder="Preço Custo (€)" required>
            <input type="number" step="0.01" id="vendaProduto" placeholder="Preço Venda (€)" required>
          </div>
          <input type="number" id="stockProduto" placeholder="Quantidade Inicial Stock" required>
          <button type="submit" class="btn-submit">Cadastrar Produto</button>
        </form>
      </div>

      <div class="card">
        <h3>📥 Dar Entrada no Stock (Reposição)</h3>
        <form id="formEntradaEstoque" style="display:flex; flex-direction:column; gap:8px;">
          <select id="selectProdutoEntrada" required>
            <option value="">-- Selecione o Produto --</option>
            ${db.produtos.map(p => `<option value="${p.id}">${p.nome} (Atual: ${p.stock})</option>`).join('')}
          </select>
          <input type="number" id="qtdEntrada" placeholder="Quantidade a adicionar" min="1" required>
          <button type="submit" class="btn-submit" style="background:#10b981;">Adicionar ao Stock</button>
        </form>
      </div>

      <div class="card">
        <h3>📋 Catálogo de Produtos</h3>
        ${db.produtos.length === 0 ? '<p>Nenhum produto cadastrado.</p>' : ''}
        <ul>
          ${db.produtos.map(p => {
            const lucroUnit = (p.precoVenda || p.preco) - (p.precoCusto || 0);
            return `
              <li style="margin-bottom:10px; padding-bottom:8px;">
                <strong>${p.nome}</strong><br>
                <span>Stock: <b>${p.stock} un.</b></span> | 
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

      db.produtos.push({
        id: Date.now(),
        nome,
        precoCusto,
        precoVenda,
        preco: precoVenda,
        stock
      });

      saveData(db);
      alert('Produto cadastrado com sucesso!');
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
        alert(`Foram adicionadas ${qtdAdd} unidades ao produto ${produto.nome}!`);
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

          <label>Produto:</label>
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
        ${db.vendas.length === 0 ? '<p>Nenhuma venda realizada.</p>' : ''}
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

      if (!produto) {
        alert('Selecione um produto válido!');
        return;
      }

      if (produto.stock < qtd) {
        alert(`Stock insuficiente! Apenas ${produto.stock} unidades disponíveis.`);
        return;
      }

      produto.stock -= qtd;

      const precoVenda = produto.precoVenda || produto.preco;
      const precoCusto = produto.precoCusto || 0;

      const total = precoVenda * qtd;
      const custoTotal = precoCusto * qtd;
      const lucro = total - custoTotal;

      db.vendas.push({
        id: Date.now(),
        data: today,
        cliente: clienteNome,
        produto: produto.nome,
        qtd,
        total,
        custoTotal,
        lucro
      });

      saveData(db);
      alert(`Venda efetuada com sucesso! Lucro: € ${lucro.toFixed(2)}`);
      renderPage('venda');
    });
  }

  else if (pageKey === 'mais') {
    content.innerHTML = `
      <h2>⚡ Configurações & Dados</h2>
      <div class="card">
        <h3>Gerenciamento de Dados</h3>
        <p style="margin-bottom:12px;">Se quiser resetar completamente a aplicação:</p>
        <button id="resetDataBtn" style="padding:12px; width:100%; background:#ef4444; color:#fff; border:none; border-radius:12px; cursor:pointer; font-weight:bold;">Apagar Todos os Dados</button>
      </div>
    `;

    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Atenção: deseja apagar todos os dados registrados?')) {
          localStorage.removeItem('giacometti_farm_db');
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

  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const targetPage = button.getAttribute('data-page');
      renderPage(targetPage);
    });
  });

  if (backupBtn) {
    backupBtn.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `giacometti_farm_backup_${today}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  renderPage('dashboard');
});