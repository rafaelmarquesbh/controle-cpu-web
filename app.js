// ==========================================
// LISTA DE COMPRAS
// SUPABASE
// ==========================================

const SUPABASE_URL =
    "https://oipbdwctkkhsibqtitmy.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_NB8Zj3BupM5huL9uiS1LkQ_8sYLB_yp";


// ==========================================
// CONEXÃO COM SUPABASE
// ==========================================

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ==========================================
// ELEMENTOS DA TELA
// ==========================================

const produtoInput =
    document.getElementById("produto");

const quantidadeInput =
    document.getElementById("quantidade");

const unidadeInput =
    document.getElementById("unidade");

const precoInput =
    document.getElementById("preco");

const btnAdicionar =
    document.getElementById("btnAdicionar");

const listaProdutos =
    document.getElementById("listaProdutos");

const listaComprados =
    document.getElementById("listaComprados");

const contador =
    document.getElementById("contador");

const contadorComprados =
    document.getElementById("contadorComprados");

const total =
    document.getElementById("total");

const totalComprados =
    document.getElementById("totalComprados");

const totalItens =
    document.getElementById("totalItens");


// ==========================================
// VARIÁVEIS
// ==========================================

let produtos = [];

let editandoId = null;


// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    carregarProdutos
);


// ==========================================
// FORMATAÇÃO DE MOEDA
// ==========================================

function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


// ==========================================
// ESCAPAR HTML
// ==========================================

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        texto ?? "";

    return div.innerHTML;

}


// ==========================================
// CARREGAR PRODUTOS DO SUPABASE
// ==========================================

async function carregarProdutos() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("lista_compras")
            .select("*")
            .order("id", {
                ascending: true
            });


        if (error) {

            console.error(
                "Erro ao carregar produtos:",
                error
            );

            alert(
                "Não foi possível carregar os produtos do banco de dados."
            );

            return;

        }


        produtos = data || [];

        renderizar();

    }

    catch (erro) {

        console.error(erro);

        alert(
            "Erro de conexão com o banco de dados."
        );

    }

}


// ==========================================
// ADICIONAR PRODUTO
// ==========================================

btnAdicionar.addEventListener(
    "click",
    adicionarProduto
);


async function adicionarProduto() {

    const produto =
        produtoInput.value.trim();

    const quantidade =
        Number(quantidadeInput.value);

    const unidade =
        unidadeInput.value.trim();

    const preco =
        Number(precoInput.value);


    // ======================================
    // VALIDAÇÕES
    // ======================================

    if (!produto) {

        alert(
            "Digite o nome do produto."
        );

        produtoInput.focus();

        return;

    }


    if (!quantidade || quantidade <= 0) {

        alert(
            "Informe uma quantidade válida."
        );

        quantidadeInput.focus();

        return;

    }


    if (!unidade) {

        alert(
            "Informe a unidade."
        );

        unidadeInput.focus();

        return;

    }


    if (isNaN(preco) || preco < 0) {

        alert(
            "Informe um preço válido."
        );

        precoInput.focus();

        return;

    }


    // ======================================
    // EDITAR
    // ======================================

    if (editandoId !== null) {

        await atualizarProduto(
            produto,
            quantidade,
            unidade,
            preco
        );

        return;

    }


    // ======================================
    // NOVO PRODUTO
    // ======================================

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("lista_compras")
            .insert([
                {
                    produto: produto,
                    quantidade: quantidade,
                    unidade: unidade,
                    preco: preco,
                    comprado: false
                }
            ])
            .select()
            .single();


        if (error) {

            console.error(
                "Erro ao adicionar:",
                error
            );

            alert(
                "Erro ao salvar no banco de dados:\n\n" +
                error.message
            );

            return;

        }


        produtos.push(data);

        limparFormulario();

        renderizar();

    }

    catch (erro) {

        console.error(erro);

        alert(
            "Erro de conexão com o banco de dados."
        );

    }

}


// ==========================================
// ATUALIZAR PRODUTO
// ==========================================

async function atualizarProduto(
    produto,
    quantidade,
    unidade,
    preco
) {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("lista_compras")
            .update({
                produto: produto,
                quantidade: quantidade,
                unidade: unidade,
                preco: preco
            })
            .eq("id", editandoId)
            .select()
            .single();


        if (error) {

            console.error(
                "Erro ao atualizar:",
                error
            );

            alert(
                "Erro ao atualizar no banco de dados:\n\n" +
                error.message
            );

            return;

        }


        const indice =
            produtos.findIndex(
                item => item.id === editandoId
            );


        if (indice !== -1) {

            produtos[indice] = data;

        }


        editandoId = null;

        btnAdicionar.textContent =
            "+ Adicionar produto";

        limparFormulario();

        renderizar();

    }

    catch (erro) {

        console.error(erro);

        alert(
            "Erro de conexão com o banco de dados."
        );

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
// RENDERIZAR
// ==========================================

function renderizar() {

    const pendentes =
        produtos.filter(
            item => !item.comprado
        );


    const comprados =
        produtos.filter(
            item => item.comprado
        );


    // ======================================
    // PENDENTES
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

    }

    else {

        listaProdutos.innerHTML =
            pendentes
                .map(criarProdutoHTML)
                .join("");

    }


    // ======================================
    // COMPRADOS
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

    }

    else {

        listaComprados.innerHTML =
            comprados
                .map(criarProdutoHTML)
                .join("");

    }


    // ======================================
    // CONTADORES
    // ======================================

    contador.textContent =
        `${pendentes.length} ${
            pendentes.length === 1
                ? "item"
                : "itens"
        }`;


    contadorComprados.textContent =
        `${comprados.length} ${
            comprados.length === 1
                ? "item"
                : "itens"
        }`;


    totalItens.textContent =
        pendentes.length;


    // ======================================
    // TOTAL PENDENTE
    // ======================================

    const totalPendente =
        pendentes.reduce(
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

    const totalCompra =
        comprados.reduce(
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
// MARCAR COMO COMPRADO
// ==========================================

async function alternarComprado(id) {

    const item =
        produtos.find(
            produto => produto.id === id
        );


    if (!item) {

        return;

    }


    const novoStatus =
        !item.comprado;


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("lista_compras")
            .update({
                comprado: novoStatus
            })
            .eq("id", id)
            .select()
            .single();


        if (error) {

            console.error(
                "Erro ao marcar comprado:",
                error
            );

            alert(
                "Erro ao atualizar o produto:\n\n" +
                error.message
            );

            renderizar();

            return;

        }


        const indice =
            produtos.findIndex(
                produto => produto.id === id
            );


        if (indice !== -1) {

            produtos[indice] = data;

        }


        renderizar();

    }

    catch (erro) {

        console.error(erro);

        alert(
            "Erro de conexão com o banco de dados."
        );

    }

}


// ==========================================
// EDITAR PRODUTO
// ==========================================

function editarProduto(id) {

    const item =
        produtos.find(
            produto => produto.id === id
        );


    if (!item) {

        return;

    }


    produtoInput.value =
        item.produto;

    quantidadeInput.value =
        item.quantidade;

    unidadeInput.value =
        item.unidade;

    precoInput.value =
        item.preco;


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
// EXCLUIR PRODUTO
// ==========================================

async function excluirProduto(id) {

    const item =
        produtos.find(
            produto => produto.id === id
        );


    if (!item) {

        return;

    }


    const confirmar =
        confirm(
            `Deseja excluir "${item.produto}"?`
        );


    if (!confirmar) {

        return;

    }


    try {

        const {
            error
        } = await supabaseClient
            .from("lista_compras")
            .delete()
            .eq("id", id);


        if (error) {

            console.error(
                "Erro ao excluir:",
                error
            );

            alert(
                "Erro ao excluir do banco de dados:\n\n" +
                error.message
            );

            return;

        }


        produtos =
            produtos.filter(
                produto => produto.id !== id
            );


        if (editandoId === id) {

            editandoId = null;

            btnAdicionar.textContent =
                "+ Adicionar produto";

            limparFormulario();

        }


        renderizar();

    }

    catch (erro) {

        console.error(erro);

        alert(
            "Erro de conexão com o banco de dados."
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
]
.forEach(input => {

    input.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                adicionarProduto();

            }

        }
    );

});
