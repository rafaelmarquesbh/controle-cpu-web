// ============================================================
// CONFIGURAÇÃO - MESMO SUPABASE DO PROGRAMA PYTHON
// ============================================================

const SUPABASE_URL = "https://oipbdwctkkhsibqtitmy.supabase.co";
const SUPABASE_KEY = "sb_publishable_NB8Zj3BupM5huL9uiS1LkQ_8sYLB_yp";
const TABLE_NAME = "chegadas_cpu";

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

let dadosCache = [];
let idEditando = null;

// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("data").value = dataAtual();
  carregarDados();
});

function dataAtual() {
  const agora = new Date();
  return String(agora.getDate()).padStart(2, "0") + "/" +
         String(agora.getMonth() + 1).padStart(2, "0") + "/" +
         agora.getFullYear();
}

function mostrarStatus(texto, erro = false) {
  const el = document.getElementById("status");
  el.textContent = texto;
  el.style.color = erro ? "#c42b1c" : "#107c10";
}

// ============================================================
// SUPABASE
// ============================================================

async function carregarDados() {
  try {
    mostrarStatus("Carregando...");

    const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=id.desc`;

    const resposta = await fetch(url, {
      method: "GET",
      headers: HEADERS
    });

    if (!resposta.ok) {
      throw new Error(`Erro ${resposta.status}: ${await resposta.text()}`);
    }

    dadosCache = await resposta.json();
    filtrar();
    mostrarStatus(`${dadosCache.length} registro(s) carregado(s).`);
  } catch (erro) {
    mostrarStatus("Erro ao carregar: " + erro.message, true);
  }
}

async function salvarNoSupabase(dados) {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}`;

  const resposta = await fetch(url, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(dados)
  });

  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status}: ${await resposta.text()}`);
  }
}

async function atualizarNoSupabase(id, dados) {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${encodeURIComponent(id)}`;

  const resposta = await fetch(url, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify(dados)
  });

  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status}: ${await resposta.text()}`);
  }
}

async function excluirNoSupabase(id) {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${encodeURIComponent(id)}`;

  const resposta = await fetch(url, {
    method: "DELETE",
    headers: HEADERS
  });

  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status}: ${await resposta.text()}`);
  }
}

// ============================================================
// SALVAR / EDITAR
// ============================================================

async function salvar() {
  const numero_cpu = document.getElementById("cpu").value.trim();
  const cliente = document.getElementById("cliente").value.trim();
  const data_chegada = document.getElementById("data").value.trim();
  const problema = document.getElementById("problema").value.trim();

  if (!numero_cpu) {
    alert("Informe o número da CPU.");
    document.getElementById("cpu").focus();
    return;
  }

  if (!cliente) {
    alert("Informe o cliente.");
    document.getElementById("cliente").focus();
    return;
  }

  if (!problema) {
    alert("Informe o problema ou anotação.");
    document.getElementById("problema").focus();
    return;
  }

  const dados = {
    numero_cpu,
    cliente,
    data_chegada,
    problema,
    data_hora_registro: new Date().toISOString()
  };

  try {
    document.getElementById("btnSalvar").disabled = true;

    if (idEditando !== null) {
      await atualizarNoSupabase(idEditando, dados);
      alert("Registro atualizado com sucesso!");
      cancelarEdicao();
    } else {
      await salvarNoSupabase(dados);
      alert("CPU cadastrada com sucesso!");
      limpar();
    }

    await carregarDados();
  } catch (erro) {
    alert("Não foi possível salvar:\n\n" + erro.message);
  } finally {
    document.getElementById("btnSalvar").disabled = false;
  }
}

function limpar() {
  document.getElementById("cpu").value = "";
  document.getElementById("cliente").value = "";
  document.getElementById("data").value = dataAtual();
  document.getElementById("problema").value = "";
  document.getElementById("cpu").focus();
}

function cancelarEdicao() {
  idEditando = null;
  document.getElementById("btnSalvar").textContent = "SALVAR";
  document.getElementById("btnCancelar").disabled = true;
  limpar();
}

// ============================================================
// BUSCA
// ============================================================

function filtrar() {
  const termo = document.getElementById("busca").value.toLowerCase().trim();

  if (!termo) {
    renderizarBlocos(dadosCache);
    return;
  }

  const filtrados = dadosCache.filter(item => {
    const texto = [
      item.id,
      item.numero_cpu,
      item.cliente,
      item.data_chegada,
      item.problema
    ].join(" ").toLowerCase();

    return texto.includes(termo);
  });

  renderizarBlocos(filtrados);
}

// ============================================================
// RENDERIZAÇÃO
// ============================================================

function renderizarBlocos(dados) {
  const container = document.getElementById("blocos");
  container.innerHTML = "";

  if (!dados.length) {
    container.innerHTML = `<div class="vazio">Nenhum registro encontrado.</div>`;
    return;
  }

  dados.forEach(item => {
    const bloco = document.createElement("article");
    bloco.className = "bloco";

    bloco.innerHTML = `
      <div class="id">ID: ${esc(item.id)}</div>
      <div class="cpu-titulo">CPU: ${esc(item.numero_cpu)}</div>
      <strong>Cliente: ${esc(item.cliente)}</strong>
      <div>Data: ${esc(item.data_chegada)}</div>
      <div class="problema">
        <strong>Problema:</strong> ${esc(item.problema)}
      </div>
      <div class="acoes">
        <button class="primary" onclick="editar(${Number(item.id)})">Editar</button>
        <button class="purple" onclick="imprimirUm(${Number(item.id)})">Imprimir</button>
        <button class="danger" onclick="excluir(${Number(item.id)})">Excluir</button>
      </div>
    `;

    container.appendChild(bloco);
  });
}

function esc(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ============================================================
// EDITAR
// ============================================================

function editar(id) {
  const item = dadosCache.find(registro => Number(registro.id) === Number(id));
  if (!item) return;

  idEditando = item.id;

  document.getElementById("cpu").value = item.numero_cpu ?? "";
  document.getElementById("cliente").value = item.cliente ?? "";
  document.getElementById("data").value = item.data_chegada ?? "";
  document.getElementById("problema").value = item.problema ?? "";

  document.getElementById("btnSalvar").textContent = "ATUALIZAR";
  document.getElementById("btnCancelar").disabled = false;

  document.getElementById("cpu").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================
// EXCLUIR
// ============================================================

async function excluir(id) {
  const item = dadosCache.find(registro => Number(registro.id) === Number(id));
  if (!item) return;

  if (!confirm(`Tem certeza que deseja excluir a CPU ${item.numero_cpu}?`)) {
    return;
  }

  try {
    await excluirNoSupabase(id);
    alert("Registro excluído com sucesso!");
    await carregarDados();
  } catch (erro) {
    alert("Não foi possível excluir:\n\n" + erro.message);
  }
}

// ============================================================
// IMPRESSÃO
// ============================================================

function imprimirUm(id) {
  const item = dadosCache.find(registro => Number(registro.id) === Number(id));
  if (!item) return;

  const janela = window.open("", "_blank");

  janela.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Imprimir CPU ${esc(item.numero_cpu)}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: Arial; font-size: 12pt; color: #111; }
        h1 { text-align: center; }
        .cabecalho { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .campo { margin: 12px 0; }
        .rotulo { font-weight: bold; }
        .problema { border: 1px solid #999; padding: 12px; min-height: 100px; white-space: pre-wrap; }
        .assinatura { margin-top: 70px; text-align: center; }
        .linha { border-top: 1px solid #000; width: 70%; margin: auto; }
      </style>
    </head>
    <body>
      <div class="cabecalho">
        <h1>CONTROLE DE CHEGADA DE CPU</h1>
        <p>Controle de recebimento</p>
      </div>

      <div class="campo"><span class="rotulo">Nº CPU:</span> ${esc(item.numero_cpu)}</div>
      <div class="campo"><span class="rotulo">Cliente:</span> ${esc(item.cliente)}</div>
      <div class="campo"><span class="rotulo">Data:</span> ${esc(item.data_chegada)}</div>

      <div class="campo">
        <span class="rotulo">Problema / Anotação:</span>
        <div class="problema">${esc(item.problema)}</div>
      </div>

      <div class="assinatura">
        <div class="linha"></div>
        Assinatura
      </div>
    </body>
    </html>
  `);

  janela.document.close();
  janela.focus();
  janela.print();
}

function imprimirTudo() {
  if (!dadosCache.length) {
    alert("Não há registros para imprimir.");
    return;
  }

  const linhas = dadosCache.map(item => `
    <tr>
      <td>${esc(item.id)}</td>
      <td>${esc(item.numero_cpu)}</td>
      <td>${esc(item.cliente)}</td>
      <td>${esc(item.data_chegada)}</td>
      <td>${esc(item.problema)}</td>
    </tr>
  `).join("");

  const janela = window.open("", "_blank");

  janela.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Controle de Chegada de CPUs</title>
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family: Arial; color: #111; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #666; padding: 7px; text-align: left; }
        th { background: #eee; }
      </style>
    </head>
    <body>
      <h1>CONTROLE DE CHEGADA DE CPUS</h1>
      <p><strong>Total de registros:</strong> ${dadosCache.length}</p>
      <p><strong>Data da impressão:</strong> ${new Date().toLocaleString("pt-BR")}</p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nº CPU</th>
            <th>Cliente</th>
            <th>Data</th>
            <th>Problema / Anotação</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </body>
    </html>
  `);

  janela.document.close();
  janela.focus();
  janela.print();
}
