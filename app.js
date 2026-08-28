// ==========================================
// LISTA DE COMPRAS
// VERSÃO COM SUPABASE - CORRIGIDA
// ==========================================

// Dados do projeto Supabase
const SUPABASE_URL = "https://oipbdwctkkhsibqtitmy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_NB8Zj3BupM5huL9uiS1LkQ_8sYLB_yp";

// Usa a biblioteca oficial do Supabase carregada no index.html
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// ==========================================
// ELEMENTOS DA TELA
// ==========================================

const produtoInput = document.getElementById("produto");
const quantidadeInput = document.getElementById("quantidade");
const unidadeInput = document.getElementById("unidade");
const precoInput = document.getElementById("preco");
const btnAdicionar = document.getElementById("btnAdicionar");

const listaProdutos = document.getElementById("listaProdutos");
const listaComprados = document.getElementById("listaComprados");
const contador = document.getElementById("contador");
const contadorComprados = document.getElementById("contadorComprados");
const total = document.getElementById("total");
const totalComprados = document.getElementById("totalComprados");
const totalItens = document.getElementById("totalItens");

// ==========================================
// VARIÁVEIS
// ==========================================

let produtos = [];
let editandoId = null;

// ==========================================
// FORMATAÇÃO
// ==========================================

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

// ==========================================
// ERROS
// ==========================================

function mostrarErro(mensagem, erro = null) {
    console.error(mensagem, erro);

    let detalhe = "";

    if (erro) {
        detalhe =
            erro.message ||
            erro.details ||
            erro.hint ||
            erro.code ||
            "";
    }

    alert(
        detalhe
            ? `${mensagem}\n\nDetalhes: ${detalhe}`
            : mensagem
    );
}

// ==========================================
// CARREGAR PRODUTOS
// ==========================================

async function carregarProdutos() {
    try {
        const { data, error } = await supabaseClient
            .from("lista_compras")
            .select("*")
            .order("id", { ascending: true });

        if (error) {
            throw error;
        }

        produtos = data || [];
        renderizar();
    } catch (erro) {
        mostrarErro(
            "Não foi possível carregar os produtos do banco de dados.",
            erro
        );
    }
}

// ==========================================
// ADICIONAR / SALVAR PRODUTO
// ==========================================

btnAdicionar.addEventListener("click", adicionarProduto);

async function adicionarProduto() {
    const produto = produtoInput.value.trim();
    const quantidade = Number(quantidadeInput.value);
    const unidade = unidadeInput.value.trim();
    const preco = Number(precoInput.value);

    if (!produto) {
        alert("Digite o nome do produto.");
        produtoInput.focus();
        return;
    }

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
        alert("Informe uma quantidade válida.");
        quantidadeInput.focus();
        return;
    }

    if (!unidade) {
        alert("Informe a unidade.");
        unidadeInput.focus();
        return;
    }

    if (!Number.isFinite(preco) || preco < 0) {
        alert("Informe um preço válido.");
        precoInput.focus();
        return;
    }

    const estavaEditando = editandoId !== null;
    btnAdicionar.disabled = true;

    try {
        if (estavaEditando) {
            const { error } = await supabaseClient
                .from("lista_compras")
                .update({
                    produto,
                    quantidade,
                    unidade,
                    preco
                })
                .eq("id", editandoId);

            if (error) {
                throw error;
            }

            editandoId = null;
            btnAdicionar.textContent = "+ Adicionar produto";
        } else {
            const { error } = await supabaseClient
                .from("lista_compras")
                .insert({
                    produto,
                    quantidade,
                    unidade,
                    preco,
                    comprado: false
                });

            if (error) {
                throw error;
            }
        }

        limparFormulario();
        await carregarProdutos();
    } catch (erro) {
        mostrarErro(
            estavaEditando
                ? "Não foi possível salvar a alteração no banco de dados."
                : "Não foi possível adicionar o produto no banco de dados.",
            erro
        );
    } finally {
        btnAdicionar.disabled = false;
    }
}

// ==========================================
// LIMPAR FORMULÁRIO
// ==========================================

function limparFormulario() {
    produtoInput.value = "";
    quantidadeInput.value = "";
    unidadeInput.value = "";
    precoInput.value = "";
    produtoInput.focus();
}

// ==========================================
// RENDERIZAR LISTA
// ==========================================

function renderizar() {
    const pendentes = produtos.filter(item => !item.comprado);
    const comprados = produtos.filter(item => item.comprado);

    if (pendentes.length === 0) {
        listaProdutos.innerHTML = `
            <div class="vazio">
                <div class="vazio-icone">🛒</div>
                <p>Nenhum produto adicionado.</p>
                <span>Adicione seu primeiro produto acima.</span>
            </div>
        `;
    } else {
        listaProdutos.innerHTML = pendentes
            .map(criarProdutoHTML)
            .join("");
    }

    if (comprados.length === 0) {
        listaComprados.innerHTML = `
            <div class="vazio">
                <div class="vazio-icone">✅</div>
                <p>Nenhum produto comprado.</p>
            </div>
        `;
    } else {
        listaComprados.innerHTML = comprados
            .map(criarProdutoHTML)
            .join("");
    }

    contador.textContent = `${pendentes.length} ${
        pendentes.length === 1 ? "item" : "itens"
    }`;

    contadorComprados.textContent = `${comprados.length} ${
        comprados.length === 1 ? "item" : "itens"
    }`;

    totalItens.textContent = pendentes.length;

    const totalPendente = pendentes.reduce(
        (soma, item) =>
            soma + Number(item.quantidade || 0) * Number(item.preco || 0),
        0
    );

    total.textContent = formatarMoeda(totalPendente);

    const totalCompra = comprados.reduce(
        (soma, item) =>
            soma + Number(item.quantidade || 0) * Number(item.preco || 0),
        0
    );

    totalComprados.textContent = formatarMoeda(totalCompra);
}

// ==========================================
// HTML DO PRODUTO
// ==========================================

function criarProdutoHTML(item) {
    const precoTotal =
        Number(item.quantidade || 0) * Number(item.preco || 0);

    return `
        <div class="produto">
            <input
                type="checkbox"
                class="checkbox"
                ${item.comprado ? "checked" : ""}
                onchange="alternarComprado(${Number(item.id)})"
            >

            <div class="produto-info">
                <div class="produto-nome">
                    ${escaparHTML(item.produto)}
                </div>

                <div class="produto-detalhes">
                    ${escaparHTML(item.quantidade)}
                    ${escaparHTML(item.unidade)}
                    •
                    ${formatarMoeda(item.preco)} / unidade
                </div>
            </div>

            <div class="produto-preco">
                ${formatarMoeda(precoTotal)}
            </div>

            <div class="acoes">
                <button
                    class="btn-editar"
                    onclick="editarProduto(${Number(item.id)})"
                    title="Editar"
                >
                    ✏️
                </button>

                <button
                    class="btn-excluir"
                    onclick="excluirProduto(${Number(item.id)})"
                    title="Excluir"
                >
                    🗑️
                </button>
            </div>
        </div>
    `;
}

// ==========================================
// MARCAR / DESMARCAR COMPRADO
// ==========================================

async function alternarComprado(id) {
    const item = produtos.find(
        produto => Number(produto.id) === Number(id)
    );

    if (!item) return;

    try {
        const { error } = await supabaseClient
            .from("lista_compras")
            .update({ comprado: !item.comprado })
            .eq("id", id);

        if (error) {
            throw error;
        }

        await carregarProdutos();
    } catch (erro) {
        mostrarErro(
            "Não foi possível atualizar o status do produto.",
            erro
        );
        await carregarProdutos();
    }
}

// ==========================================
// EDITAR PRODUTO
// ==========================================

function editarProduto(id) {
    const item = produtos.find(
        produto => Number(produto.id) === Number(id)
    );

    if (!item) return;

    produtoInput.value = item.produto ?? "";
    quantidadeInput.value = item.quantidade ?? "";
    unidadeInput.value = item.unidade ?? "";
    precoInput.value = item.preco ?? "";

    editandoId = id;
    btnAdicionar.textContent = "💾 Salvar alteração";
    produtoInput.focus();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// ==========================================
// CANCELAR EDIÇÃO
// ==========================================

function cancelarEdicao() {
    editandoId = null;
    btnAdicionar.textContent = "+ Adicionar produto";
    limparFormulario();
}

// ==========================================
// EXCLUIR PRODUTO
// ==========================================

async function excluirProduto(id) {
    const item = produtos.find(
        produto => Number(produto.id) === Number(id)
    );

    if (!item) return;

    const confirmar = confirm(`Deseja excluir "${item.produto}"?`);
    if (!confirmar) return;

    try {
        const { error } = await supabaseClient
            .from("lista_compras")
            .delete()
            .eq("id", id);

        if (error) {
            throw error;
        }

        if (
            editandoId !== null &&
            Number(editandoId) === Number(id)
        ) {
            cancelarEdicao();
        }

        await carregarProdutos();
    } catch (erro) {
        mostrarErro(
            "Não foi possível excluir o produto do banco de dados.",
            erro
        );
    }
}

// ==========================================
// ENTER / ESC
// ==========================================

[
    produtoInput,
    quantidadeInput,
    unidadeInput,
    precoInput
].forEach(input => {
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            adicionarProduto();
        }

        if (event.key === "Escape" && editandoId !== null) {
            cancelarEdicao();
        }
    });
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================

async function iniciar() {
    renderizar();
    await carregarProdutos();
}

iniciar();
