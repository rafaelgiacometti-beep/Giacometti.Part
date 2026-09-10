/* jshint esversion: 6 */

var GOOGLE_CLIENT_ID = "536190457559-qgpncmfg55dm3p4mu60if7akfnaulebs.apps.googleusercontent.com";
var accessToken = null;

var activeCompany = localStorage.getItem('selected_company') || null;

window.selecionarEmpresa = function(empresa) {
  activeCompany = empresa;
  localStorage.setItem('selected_company', empresa);
  var nav = document.getElementById('bottomNav');
  if (nav) nav.style.display = 'flex';
  renderPage('dashboard');
};

window.trocarEmpresa = function() {
  activeCompany = null;
  localStorage.removeItem('selected_company');
  var nav = document.getElementById('bottomNav');
  if (nav) nav.style.display = 'none';
  renderCompanySelection();
};

function getDbKey() {
  return activeCompany === 'rg3d' ? 'rg3d_db' : 'g_peptides_db';[cite: 1]
}

function loadData() {
  var key = getDbKey();
  var data = localStorage.getItem(key);
  if (!data) {
    var initialData = { clientes: [], produtos: [], vendas: [] };
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

function renderCompanySelection() {
  var content = document.getElementById('content');
  var topbarBrand = document.querySelector('.topbar .brand');
  var topbarSub = document.querySelector('.topbar .subtitle');

  if (topbarBrand) topbarBrand.textContent = "⚡ GIACOMETTI HUB";
  if (topbarSub) topbarSub.textContent = "Selecione a empresa para gerir";

  if (content) {
    content.innerHTML = 
      '<div style="text-align:center; margin-top:20px; margin-bottom:20px;">' +
        '<h2 style="font-size:1.2rem; color:#1f2937;">Qual empresa deseja gerir hoje?</h2>' +
      '</div>' +
      '<div style="display:flex; flex-direction:column; gap:12px; padding:12px;">' +
        '<div onclick="window.selecionarEmpresa(\'peptides\')" style="padding:16px; background:#fff; border-radius:12px; border:1px solid #e5e7eb; cursor:pointer;">' +
          '<div style="font-size:2rem;">🧪</div>' +
          '<div><h3 style="margin:4px 0;">G. Peptídeos</h3><p style="margin:0; color:#6b7280; font-size:0.85rem;">Gestão de peptídeos, stock e vendas</p></div>' +[cite: 1]
        '</div>' +
        '<div onclick="window.selecionarEmpresa(\'rg3d\')" style="padding:16px; background:#fff; border-radius:12px; border:1px solid #10b981; cursor:pointer;">' +[cite: 1]
          '<div style="font-size:2rem;">🖨️</div>' +
          '<div><h3 style="margin:4px 0;">RG3D</h3><p style="margin:0; color:#6b7280; font-size:0.85rem;">Sua ideia ganha forma.</p></div>' +[cite: 1]
        '</div>' +
      '</div>';
  }
}

function renderPage(pageKey) {
  if (!activeCompany) {
    var nav = document.getElementById('bottomNav');
    if (nav) nav.style.display = 'none';
    renderCompanySelection();
    return;
  }

  var db = loadData();
  var content = document.getElementById('content');
  var topbarBrand = document.querySelector('.topbar .brand');
  var topbarSub = document.querySelector('.topbar .subtitle');

  if (activeCompany === 'rg3d') {[cite: 1]
    if (topbarBrand) topbarBrand.textContent = "🖨️ RG3D";[cite: 1]
    if (topbarSub) topbarSub.textContent = "Sua ideia ganha forma.";[cite: 1]
  } else {
    if (topbarBrand) topbarBrand.textContent = "🧪 G. PEPTÍDEOS";[cite: 1]
    if (topbarSub) topbarSub.textContent = "Gestão & Controlo Financeiro";
  }

  if (!content) return;

  if (pageKey === 'dashboard') {
    var totalVendas = 0;
    var totalCusto = 0;

    if (db.vendas && db.vendas.length) {
      for (var i = 0; i < db.vendas.length; i++) {
        totalVendas += (db.vendas[i].total || 0);
        totalCusto += (db.vendas[i].custoTotal || 0);
      }
    }
    var lucroTotal = totalVendas - totalCusto;

    content.innerHTML = 
      '<div style="padding:16px; background:#fff; border-radius:12px; margin:12px; border:1px solid #e5e7eb;">' +
        '<h3>' + (activeCompany === 'rg3d' ? 'RG3D' : 'G. Peptídeos') + ' 👋</h3>' +[cite: 1]
        '<p style="color:#6b7280; font-size:0.9rem;">' + (activeCompany === 'rg3d' ? 'Sua ideia ganha forma.' : 'Painel de controlo ativo') + '</p>' +[cite: 1]
      '</div>' +
      '<div style="padding:16px; background:#fff; border-radius:12px; margin:12px; border:1px solid #e5e7eb;">' +
        '<h3>📈 Indicadores Financeiros</h3>' +
        '<p><strong>Total Faturado:</strong> € ' + totalVendas.toFixed(2) + '</p>' +
        '<p><strong>Custo Total:</strong> € ' + totalCusto.toFixed(2) + '</p>' +
        '<p><strong>Lucro Líquido:</strong> <span style="color:#10b981; font-weight:bold;">€ ' + lucroTotal.toFixed(2) + '</span></p>' +
      '</div>';
  } 
  else if (pageKey === 'clientes') {
    var listaCliHtml = db.clientes.length === 0 ? '<p style="color:#6b7280; margin-top:8px;">Nenhum cliente cadastrado.</p>' : '<ul style="margin-top:8px;">';
    for (var c = 0; c < db.clientes.length; c++) {
      listaCliHtml += '<li style="padding:6px 0; border-bottom:1px solid #eee;">' + db.clientes[c].nome + ' (' + db.clientes[c].telefone + ')</li>';
    }
    if (db.clientes.length > 0) listaCliHtml += '</ul>';

    content.innerHTML = 
      '<div style="padding:16px;">' +
        '<h2>👥 Clientes</h2>' +
        '<div style="background:#fff; padding:12px; border-radius:12px; margin-top:12px;">' +
          '<h3>➕ Cadastrar Cliente</h3>' +
          '<form id="formCli" style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">' +
            '<input type="text" id="nCli" placeholder="Nome do cliente" required style="padding:8px; border:1px solid #ccc; border-radius:6px;">' +
            '<input type="tel" id="tCli" placeholder="Telefone / WhatsApp" required style="padding:8px; border:1px solid #ccc; border-radius:6px;">' +
            '<button type="submit" style="padding:10px; background:#3b82f6; color:#fff; border:none; border-radius:6px; font-weight:bold;">Salvar Cliente</button>' +
          '</form>' +
        '</div>' +
        '<div style="background:#fff; padding:12px; border-radius:12px; margin-top:12px;">' +
          '<h3>📋 Lista de Clientes</h3>' + listaCliHtml +
        '</div>' +
      '</div>';

    document.getElementById('formCli').addEventListener('submit', function(e) {
      e.preventDefault();
      db.clientes.push({ id: Date.now(), nome: document.getElementById('nCli').value, telefone: document.getElementById('tCli').value });
      saveData(db);
      alert('Cliente adicionado!');
      renderPage('clientes');
    });
  }
  else if (pageKey === 'produtos') {
    var listaProdHtml = db.produtos.length === 0 ? '<p style="color:#6b7280; margin-top:8px;">Nenhum produto cadastrado.</p>' : '<ul style="margin-top:8px;">';
    for (var p = 0; p < db.produtos.length; p++) {
      listaProdHtml += '<li style="padding:6px 0; border-bottom:1px solid #eee;"><strong>' + db.produtos[p].nome + '</strong> - Venda: €' + Number(db.produtos[p].precoVenda).toFixed(2) + ' (Stock: ' + db.produtos[p].stock + ')</li>';
    }
    if (db.produtos.length > 0) listaProdHtml += '</ul>';

    content.innerHTML = 
      '<div style="padding:16px;">' +
        '<h2>📦 Produtos</h2>' +
        '<div style="background:#fff; padding:12px; border-radius:12px; margin-top:12px;">' +
          '<h3>➕ Cadastrar Item</h3>' +
          '<form id="formProd" style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">' +
            '<input type="text" id="nProd" placeholder="Nome do produto" required style="padding:8px; border:1px solid #ccc; border-radius:6px;">' +
            '<input type="number" step="0.01" id="cProd" placeholder="Custo (€)" required style="padding:8px; border:1px solid #ccc; border-radius:6px;">' +
            '<input type="number" step="0.01" id="vProd" placeholder="Venda (€)" required style="padding:8px; border:1px solid #ccc; border-radius:6px;">' +
            '<input type="number" id="sProd" placeholder="Quantidade Stock" required style="padding:8px; border:1px solid #ccc; border-radius:6px;">' +
            '<button type="submit" style="padding:10px; background:#3b82f6; color:#fff; border:none; border-radius:6px; font-weight:bold;">Salvar Produto</button>' +
          '</form>' +
        '</div>' +
        '<div style="background:#fff; padding:12px; border-radius:12px; margin-top:12px;">' +
          '<h3>📋 Catálogo</h3>' + listaProdHtml +
        '</div>' +
      '</div>';

    document.getElementById('formProd').addEventListener('submit', function(e) {
      e.preventDefault();
      db.produtos.push({
        id: Date.now(),
        nome: document.getElementById('nProd').value,
        precoCusto: parseFloat(document.getElementById('cProd').value),
        precoVenda: parseFloat(document.getElementById('vProd').value),
        stock: parseInt(document.getElementById('sProd').value)
      });
      saveData(db);
      alert('Produto cadastrado!');
      renderPage('produtos');
    });
  }
  else if (pageKey === 'venda') {
    var optCli = '<option value="">-- Selecione o cliente --</option>';
    for (var cl = 0; cl < db.clientes.length; cl++) {
      optCli += '<option value="' + db.clientes[cl].nome + '">' + db.clientes[cl].nome + '</option>';
    }

    var optProd = '<option value="">-- Selecione o produto --</option>';
    for (var pr = 0; pr < db.produtos.length; pr++) {
      optProd += '<option value="' + db.produtos[pr].id + '">' + db.produtos[pr].nome + ' (€' + Number(db.produtos[pr].precoVenda).toFixed(2) + ' - Stock: ' + db.produtos[pr].stock + ')</option>';
    }

    content.innerHTML = 
      '<div style="padding:16px;">' +
        '<h2>🛒 Registar Venda</h2>' +
        '<div style="background:#fff; padding:12px; border-radius:12px; margin-top:12px;">' +
          '<form id="formVenda" style="display:flex; flex-direction:column; gap:10px;">' +
            '<label><strong>Cliente:</strong></label>' +
            '<select id="selCli" required style="padding:8px; border:1px solid #ccc; border-radius:6px;">' + optCli + '</select>' +
            '<label><strong>Produto:</strong></label>' +
            '<select id="selProd" required style="padding:8px; border:1px solid #ccc; border-radius:6px;">' + optProd + '</select>' +
            '<label><strong>Quantidade:</strong></label>' +
            '<input type="number" id="qVenda" value="1" min="1" required style="padding:8px; border:1px solid #ccc; border-radius:6px;">' +
            '<button type="submit" style="padding:12px; background:#10b981; color:#fff; border:none; border-radius:6px; font-weight:bold; margin-top:8px;">Finalizar Venda</button>' +
          '</form>' +
        '</div>' +
      '</div>';

    document.getElementById('formVenda').addEventListener('submit', function(e) {
      e.preventDefault();
      var cNome = document.getElementById('selCli').value;
      var pId = parseInt(document.getElementById('selProd').value);
      var qtd = parseInt(document.getElementById('qVenda').value);

      var prod = null;
      for (var k = 0; k < db.produtos.length; k++) {
        if (db.produtos[k].id === pId) {
          prod = db.produtos[k];
          break;
        }
      }

      if (!prod) return alert('Selecione um produto!');
      if (prod.stock < qtd) return alert('Stock insuficiente!');

      prod.stock -= qtd;
      var total = prod.precoVenda * qtd;
      var custoTotal = prod.precoCusto * qtd;

      db.vendas.push({ id: Date.now(), cliente: cNome, produto: prod.nome, qtd: qtd, total: total, custoTotal: custoTotal });
      saveData(db);
      alert('Venda registrada com sucesso!');
      renderPage('dashboard');
    });
  }
  else if (pageKey === 'mais') {
    content.innerHTML = 
      '<div style="padding:16px;">' +
        '<div style="padding:16px; background:#fff; border-radius:12px; border:1px solid #e5e7eb;">' +
          '<h3>🔄 Trocar de Empresa</h3>' +
          '<button onclick="window.trocarEmpresa()" style="padding:12px; width:100%; background:#3b82f6; color:#fff; border:none; border-radius:12px; cursor:pointer; font-weight:bold; margin-top:8px;">Trocar Empresa</button>' +
        '</div>' +
      '</div>';
  }
}

function bindNavEvents() {
  var navButtons = document.querySelectorAll('.bottom-nav button');
  navButtons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var page = btn.getAttribute('data-page');
      navButtons.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderPage(page);
    });
  });
}

function startApp() {
  bindNavEvents();
  if (activeCompany) {
    var nav = document.getElementById('bottomNav');
    if (nav) nav.style.display = 'flex';
    renderPage('dashboard');
  } else {
    renderCompanySelection();
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  startApp();
} else {
  document.addEventListener('DOMContentLoaded', startApp);
}