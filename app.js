// BANCO DE DADOS LOCAL RG3D
const today = new Date().toISOString().split('T')[0];

function loadDb() {
  const data = localStorage.getItem('rg3d_db');
  if (!data) {
    const initial = { clientes: [], pedidos: [], materiais: [], orcamentos: [] };
    localStorage.setItem('rg3d_db', JSON.stringify(initial));
    return initial;
  }
  const db = JSON.parse(data);
  if (!db.orcamentos) db.orcamentos = [];
  return db;
}

function saveDb(data) {
  localStorage.setItem('rg3d_db', JSON.stringify(data));
}

// NAVEGAÇÃO E RENDERIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
  renderPage('dashboard');

  document.querySelectorAll('.bottom-nav button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      renderPage(target.dataset.page);
    });
  });

  const backupBtn = document.getElementById('backupBtn');
  if (backupBtn) {
    backupBtn.addEventListener('click', () => {
      const db = loadDb();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `rg3d_backup_${today}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }
});

function renderPage(page, extraData = null) {
  const db = loadDb();
  const content = document.getElementById('content');

  if (page === 'dashboard') {
    const faturamento = db.pedidos.reduce((acc, p) => acc + (parseFloat(p.valorTotal) || 0), 0);
    content.innerHTML = `
      <h2>⚡ PAINEL DE CONTROLO</h2>
      <div class="card">
        <h3>📊 RESUMO FINANCEIRO & VENDAS</h3>
        <p><strong>Faturamento Total:</strong> € ${faturamento.toFixed(2)}</p>
        <p><strong>Pedidos Registados:</strong> ${db.pedidos.length}</p>
        <p><strong>Orçamentos Guardados:</strong> ${db.orcamentos.length}</p>
        <p><strong>Clientes Cadastrados:</strong> ${db.clientes.length}</p>
        <p><strong>Materiais em Stock:</strong> ${db.materiais.length} itens</p>
      </div>
      <button class="btn-cyan" onclick="renderPage('orcamento')">🧮 NOVO ORÇAMENTO 3D</button>
    `;
  }

  else if (page === 'clientes') {
    content.innerHTML = `
      <h2>👥 CADASTRO DE CLIENTES</h2>
      <div class="card">
        <h3>➕ Novo Cliente</h3>
        <label>Nome do Cliente / Empresa</label>
        <input type="text" id="cliNome" placeholder="Ex: João Silva">
        <label>WhatsApp / Telefone</label>
        <input type="text" id="cliTel" placeholder="+351 ...">
        <button class="btn-cyan" onclick="cadastrarCliente()">Salvar Cliente</button>
      </div>

      <div class="card">
        <h3>📋 Lista de Clientes</h3>
        <ul>
          ${db.clientes.map(c => `<li><strong>${c.nome}</strong> -${c.tel}</li>`).join('') || '<p>Nenhum cliente cadastrado.</p>'}
        </ul>
      </div>
    `;
  }

  else if (page === 'orcamento') {
    content.innerHTML = `
      <h2>🧮 CALCULADORA DE ORÇAMENTO 3D</h2>
      <div class="card">
        <h3>➕ Criar Orçamento</h3>
        <label>Nome da Pessoa / Cliente</label>
        <input type="text" id="orcCliente" placeholder="Ex: Maria Santos">

        <label>Nome da Peça / Projeto</label>
        <input type="text" id="orcPeca" placeholder="Ex: Suporte Fone">
        
        <label>Peso do Filamento (Gramas)</label>
        <input type="number" id="orcPeso" placeholder="Ex: 80" oninput="calcularOrcamento()">
        
        <label>Preço do Filamento por KG (€)</label>
        <input type="number" id="orcPrecoKg" value="20" oninput="calcularOrcamento()">
        
        <label>Tempo de Impressão (Horas)</label>
        <input type="number" id="orcTempo" placeholder="Ex: 5" oninput="calcularOrcamento()">
        
        <label>Custo Hora/Impressora (€)</label>
        <input type="number" id="orcCustoHora" value="1.50" oninput="calcularOrcamento()">
        
        <label>Margem de Lucro (%)</label>
        <input type="number" id="orcMargem" value="100" oninput="calcularOrcamento()">

        <div style="margin-top:15px; padding:12px; background:#121417; border-radius:10px;">
          <p>Custo Material: <strong id="resCustoMat">€ 0.00</strong></p>
          <p>Custo Máquina: <strong id="resCustoMaq">€ 0.00</strong></p>
          <p style="font-size:1.1rem; color:#00C2CC; margin-top:6px;">Preço Sugerido: <strong id="resPrecoFinal" style="color:#00C2CC;">€ 0.00</strong></p>
        </div>

        <button class="btn-cyan" onclick="salvarOrcamento()">💾 Salvar Orçamento</button>
      </div>

      <div class="card">
        <h3>📋 Orçamentos Guardados</h3>
        <ul>
          ${db.orcamentos.map(o => `
            <li style="display:flex; flex-direction:column; gap:6px; padding:10px 0; border-bottom:1px solid #2D3238;">
              <div><strong>Pessoa:</strong> ${o.clienteName}</div>
              <div><strong>Peça:</strong> ${o.peca} - <b style="color:#00C2CC;">€ ${parseFloat(o.precoFinal).toFixed(2)}</b></div>
              <small style="color:#A7ADB3;">Data: ${o.data}</small>
              <button class="btn-cyan" style="margin-top:6px; padding:8px; font-size:0.8rem;" onclick="converterOrcamentoEmVenda(${o.id})">🛒 Virar Venda / Pedido</button>
            </li>
          `).join('') || '<p>Nenhum orçamento guardado.</p>'}
        </ul>
      </div>
    `;
  }

  else if (page === 'pedidos') {
    const defaultCliente = extraData ? extraData.clienteName : '';
    const defaultDesc = extraData ? extraData.peca : '';
    const defaultValor = extraData ? extraData.precoFinal : '';

    content.innerHTML = `
      <h2>📝 PEDIDOS & VENDAS</h2>
      <div class="card">
        <h3>➕ Registo de Novo Pedido / Venda</h3>
        <label>Nome do Cliente</label>
        <input type="text" id="pedCliente" value="${defaultCliente}" placeholder="Ex: João Silva">

        <label>Descrição da Peça / Serviço</label>
        <input type="text" id="pedDesc" value="${defaultDesc}" placeholder="Ex: Impressão 3D Peça Personalizada">
        
        <label>Valor Total (€)</label>
        <input type="number" id="pedValor" value="${defaultValor}" placeholder="0.00">
        
        <label>Status</label>
        <select id="pedStatus">
          <option>Pendente</option>
          <option>Em Impressão</option>
          <option>Pronto / Entregue</option>
        </select>
        <button class="btn-cyan" onclick="cadastrarPedido()">Registar Pedido</button>
      </div>

      <div class="card">
        <h3>📋 Histórico de Pedidos</h3>
        <ul>
          ${db.pedidos.map(p => `<li><strong>${p.cliente}</strong>:${p.desc} - <b style="color:#00C2CC;">€ ${parseFloat(p.valorTotal).toFixed(2)}</b> (${p.status})</li>`).join('') || '<p>Nenhum pedido registado.</p>'}
        </ul>
      </div>
    `;
  }

  else if (page === 'materiais') {
    content.innerHTML = `
      <h2>🛠️ CONTROLE DE COMPRAS DE MATERIAIS</h2>
      <div class="card">
        <h3>📥 Entrada de Stock (Reposição)</h3>
        <label>Selecione o Material:</label>
        <select id="matSelectRep">
          ${db.materiais.map(m => `<option value="${m.id}">${m.nome} (Atual:${m.qtd})</option>`).join('') || '<option value="">Nenhum material cadastrado</option>'}
        </select>
        <label>Quantidade a Adicionar</label>
        <input type="number" id="matQtdAdd" placeholder="1">
        <button class="btn-cyan" onclick="reporStockMaterial()">Adicionar ao Stock</button>
      </div>

      <div class="card">
        <h3>➕ Novo Insumo / Filamento</h3>
        <label>Descrição do Material</label>
        <input type="text" id="matNome" placeholder="Ex: PLA Preto 1kg">
        <label>Quantidade Inicial</label>
        <input type="number" id="matQtd" placeholder="1">
        <label>Custo de Compra (€)</label>
        <input type="number" id="matCusto" placeholder="20.00">
        <button class="btn-cyan" onclick="cadastrarMaterial()">Cadastrar Material</button>
      </div>

      <div class="card">
        <h3>📦 Stock Atual</h3>
        <ul>
          ${db.materiais.map(m => `<li><strong>${m.nome}</strong> - Quantidade: <b>${m.qtd}</b> \vert{} Custo: €${parseFloat(m.custo || 0).toFixed(2)}</li>`).join('') || '<p>Nenhum material registado.</p>'}
        </ul>
      </div>
    `;
  }
}

// FUNÇÕES DE LÓGICA DE ORÇAMENTO E VENDAS
function calcularOrcamento() {
  const peso = parseFloat(document.getElementById('orcPeso').value) || 0;
  const precoKg = parseFloat(document.getElementById('orcPrecoKg').value) || 0;
  const tempo = parseFloat(document.getElementById('orcTempo').value) || 0;
  const custoHora = parseFloat(document.getElementById('orcCustoHora').value) || 0;
  const margem = parseFloat(document.getElementById('orcMargem').value) || 0;

  const custoMat = (peso / 1000) * precoKg;
  const custoMaq = tempo * custoHora;
  const custoTotal = custoMat + custoMaq;
  const precoFinal = custoTotal + (custoTotal * (margem / 100));

  const elMat = document.getElementById('resCustoMat');
  const elMaq = document.getElementById('resCustoMaq');
  const elFin = document.getElementById('resPrecoFinal');

  if (elMat) elMat.innerText = `€ ${custoMat.toFixed(2)}`;
  if (elMaq) elMaq.innerText = `€ ${custoMaq.toFixed(2)}`;
  if (elFin) elFin.innerText = `€ ${precoFinal.toFixed(2)}`;

  return precoFinal.toFixed(2);
}

function salvarOrcamento() {
  const db = loadDb();
  const clienteName = document.getElementById('orcCliente').value.trim();
  const peca = document.getElementById('orcPeca').value.trim();
  const precoFinal = calcularOrcamento();

  if (!clienteName || !peca) {
    return alert('Por favor, preencha o nome da pessoa e o nome da peça!');
  }

  db.orcamentos.push({
    id: Date.now(),
    clienteName,
    peca,
    precoFinal,
    data: today
  });

  saveDb(db);
  alert('Orçamento salvo com sucesso!');
  renderPage('orcamento');
}

function converterOrcamentoEmVenda(orcamentoId) {
  const db = loadDb();
  const orc = db.orcamentos.find(o => o.id === orcamentoId);

  if (!orc) return alert('Orçamento não encontrado');

  // Adiciona o cliente na lista de clientes se ainda não existir
  const clienteExiste = db.clientes.some(c => c.nome.toLowerCase() === orc.clienteName.toLowerCase());
  if (!clienteExiste) {
    db.clientes.push({ id: Date.now(), nome: orc.clienteName, tel: 'Não informado' });
    saveDb(db);
  }

  // Ativa a aba Pedidos e preenche os campos automaticamente
  document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
  const btnPed = document.querySelector('.bottom-nav button[data-page="pedidos"]');
  if (btnPed) btnPed.classList.add('active');

  renderPage('pedidos', orc);
}

function cadastrarCliente() {
  const db = loadDb();
  const nome = document.getElementById('cliNome').value.trim();
  const tel = document.getElementById('cliTel').value.trim();
  if (!nome) return alert('Preencha o nome do cliente');
  db.clientes.push({ id: Date.now(), nome, tel });
  saveDb(db);
  renderPage('clientes');
}

function cadastrarPedido() {
  const db = loadDb();
  const cliente = document.getElementById('pedCliente').value.trim();
  const desc = document.getElementById('pedDesc').value.trim();
  const valorTotal = document.getElementById('pedValor').value;
  const status = document.getElementById('pedStatus').value;

  if (!cliente || !desc || !valorTotal) return alert('Preencha todos os campos do pedido');
  db.pedidos.push({ id: Date.now(), cliente, desc, valorTotal, status, data: today });
  saveDb(db);
  alert('Pedido/Venda registado com sucesso!');
  renderPage('pedidos');
}

function cadastrarMaterial() {
  const db = loadDb();
  const nome = document.getElementById('matNome').value.trim();
  const qtd = parseInt(document.getElementById('matQtd').value) || 0;
  const custo = parseFloat(document.getElementById('matCusto').value) || 0;

  if (!nome) return alert('Preencha o nome do material');
  db.materiais.push({ id: Date.now(), nome, qtd, custo });
  saveDb(db);
  renderPage('materiais');
}

function reporStockMaterial() {
  const db = loadDb();
  const id = parseInt(document.getElementById('matSelectRep').value);
  const qtdAdd = parseInt(document.getElementById('matQtdAdd').value) || 0;

  const mat = db.materiais.find(m => m.id === id);
  if (mat) {
    mat.qtd += qtdAdd;
    saveDb(db);
    renderPage('materiais');
  }
}