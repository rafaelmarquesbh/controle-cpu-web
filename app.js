// ==========================================
// LISTA DE COMPRAS
// VERSÃO COM SUPABASE
// ==========================================

// Dados do seu projeto Supabase
const SUPABASE_URL = "https://oipbdwctkkhsibqtitmy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_NB8Zj3BupM5huL9uiS1LkQ_8sYLB_yp";

const API_URL = `${SUPABASE_URL}/rest/v1/lista_compras`;

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
// CABEÇALHOS SUPABASE
// ==========================================

function headersSupabase() {
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
    };
}

// ==========================================
// FORMATAÇÃO DE MOEDA
// ==========================================

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// ==========================================
// ESCAPAR HTML
// ==========================================

function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

// ==========================================
// MENSAGEM DE ERRO
// ==========================================

function mostrarErro(mensagem, erro = null) {

    console.error(mensagem, erro);

    let detalhe = "";

    if (erro) {
        detalhe = erro.message || erro.details || erro.hint || "";
    }

    alert(
        detalhe
            ? `${mensagem}\n\nDetalhes: ${detalhe}`
            : mensagem
    );
}

// ==========================================
// CARREGAR PRODUTOS DO SUPABASE
// ==========================================

async function carregarProdutos() {

    try {

        const resposta = await fetch(
            `${API_URL}?select=*&order=id.asc`,
            {
                method: "GET",
                headers: headersSupabase()
            }
        );

        if (!resposta.ok) {

            const erro = await resposta.json().catch(() => ({}));

            throw new Error(
                erro.message ||
                erro.details ||
                `Erro HTTP ${resposta.status}`
            );
        }

        produtos = await resposta.json();

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

    // Validações

    if (!produto) {

        alert("Digite o nome do produto.");
        produtoInput.focus();
        return;
    }

    if (!quantidade || quantidade <= 0) {

        alert("Informe uma quantidade válida.");
        quantidadeInput.focus();
        return;
    }

    if (!unidade) {

        alert("Informe a unidade.");
        unidadeInput.focus();
        return;
    }

    if (isNaN(preco) || preco < 0) {

        alert("Informe um preço válido.");
        precoInput.focus();
        return;
    }

    btnAdicionar.disabled = true;

    try {

        // ======================================
        // EDITAR PRODUTO EXISTENTE
        // ======================================

        if (editandoId !== null) {

            const resposta = await fetch(
                `${API_URL}?id=eq.${encodeURIComponent(editandoId)}`,
                {
                    method: "PATCH",

                    headers: {
                        ...headersSupabase(),
                        "Prefer": "return=representation"
                    },

                    body: JSON.stringify({
                        produto: produto,
                        quantidade: quantidade,
                        unidade: unidade,
                        preco: preco
                    })
                }
            );

            if (!resposta.ok) {

                const erro = await resposta.json().catch(() => ({}));

                throw new Error(
                    erro.message ||
                    erro.details ||
                    `Erro HTTP ${resposta.status}`
                );
            }

            editandoId = null;

            btnAdicionar.textContent =
                "+ Adicionar produto";
        }

        // ======================================
        // NOVO PRODUTO
        // ======================================

        else {

            const novoProduto = {

                produto: produto,
                quantidade: quantidade,
                unidade: unidade,
                preco: preco,
                comprado: false

            };

            const resposta = await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        ...headersSupabase(),
                        "Prefer": "return=representation"
                    },

                    body: JSON.stringify(novoProduto)
                }
            );

            if (!resposta.ok) {

                const erro = await resposta.json().catch(() => ({}));

                throw new Error(
                    erro.message ||
                    erro.details ||
                    `Erro HTTP ${resposta.status}`
                );
            }
        }

        limparFormulario();

        await carregarProdutos();

    } catch (erro) {

        mostrarErro(

            editandoId !== null
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

    const pendentes = produtos.filter(
        item => !item.comprado
    );

    const comprados = produtos.filter(
        item => item.comprado
    );

    // ======================================
    // LISTA PENDENTE
    // ======================================

    if (pendentes.length === 0) {

        listaProdutos.innerHTML = `

            <div class="vazio">

                <div class="vazio-icone">
                    🛒
                </div>

                <p>
                    Nenhum produto adicionado.
                </p>

                <span>
                    Adicione seu primeiro produto acima.
                </span>

            </div>

        `;

    } else {

        listaProdutos.innerHTML = pendentes
            .map(criarProdutoHTML)
            .join("");
    }

    // ======================================
    // LISTA COMPRADOS
    // ======================================

    if (comprados.length === 0) {

        listaComprados.innerHTML = `

            <div class="vazio">

                <div class="vazio-icone">
                    ✅
                </div>

                <p>
                    Nenhum produto comprado.
                </p>

            </div>

        `;

    } else {

        listaComprados.innerHTML = comprados
            .map(criarProdutoHTML)
            .join("");
    }

    // ======================================
    // CONTADORES
    // ======================================

    contador.textContent =
        `${pendentes.length} ${
            pendentes.length === 1 ? "item" : "itens"
        }`;

    contadorComprados.textContent =
        `${comprados.length} ${
            comprados.length === 1 ? "item" : "itens"
        }`;

    totalItens.textContent = pendentes.length;

    // ======================================
    // TOTAL PENDENTE
    // ======================================

    const totalPendente = pendentes.reduce(
        (soma, item) => {

            return soma +
                (
                    Number(item.quantidade) *
                    Number(item.preco)
                );

        },
        0
    );

    total.textContent =
        formatarMoeda(totalPendente);

    // ======================================
    // TOTAL COMPRADO
    // ======================================

    const totalCompra = comprados.reduce(
        (soma, item) => {

            return soma +
                (
                    Number(item.quantidade) *
                    Number(item.preco)
                );

        },
        0
    );

    totalComprados.textContent =
        formatarMoeda(totalCompra);
}

// ==========================================
// CRIAR HTML DO PRODUTO
// ==========================================

function criarProdutoHTML(item) {

    const precoTotal =
        Number(item.quantidade) *
        Number(item.preco);

    return `

        <div class="produto">

            <input

                type="checkbox"

                class="checkbox"

                ${item.comprado ? "checked" : ""}

                onchange="alternarComprado(${item.id})"

            >

            <div class="produto-info">

                <div class="produto-nome">

                    ${escaparHTML(item.produto)}

                </div>

                <div class="produto-detalhes">

                    ${item.quantidade}

                    ${escaparHTML(item.unidade)}

                    •

                    ${formatarMoeda(item.preco)}
                    / unidade

                </div>

            </div>

            <div class="produto-preco">

                ${formatarMoeda(precoTotal)}

            </div>

            <div class="acoes">

                <button

                    class="btn-editar"

                    onclick="editarProduto(${item.id})"

                    title="Editar"

                >

                    ✏️

                </button>

                <button

                    class="btn-excluir"

                    onclick="excluirProduto(${item.id})"

                    title="Excluir"

                >

                    🗑️

                </button>

            </div>

        </div>

    `;
}

// ==========================================
// MARCAR / DESMARCAR COMO COMPRADO
// ==========================================

async function alternarComprado(id) {

    const item = produtos.find(
        produto => Number(produto.id) === Number(id)
    );

    if (!item) {
        return;
    }

    try {

        const novoStatus = !item.comprado;

        const resposta = await fetch(

            `${API_URL}?id=eq.${encodeURIComponent(id)}`,

            {
                method: "PATCH",

                headers: {

                    ...headersSupabase(),

                    "Prefer": "return=representation"

                },

                body: JSON.stringify({

                    comprado: novoStatus

                })
            }
        );

        if (!resposta.ok) {

            const erro =
                await resposta.json().catch(() => ({}));

            throw new Error(

                erro.message ||
                erro.details ||
                `Erro HTTP ${resposta.status}`

            );
        }

        await carregarProdutos();

    } catch (erro) {

        mostrarErro(

            "Não foi possível atualizar o status do produto.",

            erro

        );
    }
}

// ==========================================
// EDITAR PRODUTO
// ==========================================

function editarProduto(id) {

    const item = produtos.find(
        produto => Number(produto.id) === Number(id)
    );

    if (!item) {
        return;
    }

    produtoInput.value = item.produto;
    quantidadeInput.value = item.quantidade;
    unidadeInput.value = item.unidade;
    precoInput.value = item.preco;

    editandoId = id;

    btnAdicionar.textContent =
        "💾 Salvar alteração";

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

    btnAdicionar.textContent =
        "+ Adicionar produto";

    limparFormulario();
}

// ==========================================
// EXCLUIR PRODUTO
// ==========================================

async function excluirProduto(id) {

    const item = produtos.find(
        produto => Number(produto.id) === Number(id)
    );

    if (!item) {
        return;
    }

    const confirmar = confirm(
        `Deseja excluir "${item.produto}"?`
    );

    if (!confirmar) {
        return;
    }

    try {

        const resposta = await fetch(

            `${API_URL}?id=eq.${encodeURIComponent(id)}`,

            {
                method: "DELETE",

                headers: {

                    ...headersSupabase(),

                    "Prefer": "return=representation"

                }
            }
        );

        if (!resposta.ok) {

            const erro =
                await resposta.json().catch(() => ({}));

            throw new Error(

                erro.message ||
                erro.details ||
                `Erro HTTP ${resposta.status}`

            );
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
// ENTER PARA ADICIONAR
// ==========================================

[
    produtoInput,
    quantidadeInput,
    unidadeInput,
    precoInput

].forEach(input => {

    input.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                adicionarProduto();

            }

            if (
                event.key === "Escape" &&
                editandoId !== null
            ) {

                cancelarEdicao();

            }

        }
    );

});

// ==========================================
// INICIALIZAÇÃO
// ==========================================

async function iniciar() {

    renderizar();

    await carregarProdutos();

}

iniciar();
