const estadoCatalogo = { pagina: 1, limite: 12 };

function lerParametros() {
  const params = new URLSearchParams(window.location.search);
  return {
    busca: params.get('busca') || '',
    categoria: params.get('categoria') || '',
    marca: params.get('marca') || '',
    ordenar: params.get('ordenar') || 'mais_recentes'
  };
}

function atualizarUrl(params) {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([chave, valor]) => {
    if (valor) url.searchParams.set(chave, valor);
    else url.searchParams.delete(chave);
  });
  window.history.replaceState({}, '', url);
}

async function montarFiltros(atuais) {
  const { categorias } = await Api.get('/categorias');
  document.getElementById('filtro-categorias').innerHTML = categorias.map((c) => `
    <label class="filtro-opcao">
      <input type="radio" name="categoria" value="${esc(c.slug)}" ${atuais.categoria === c.slug ? 'checked' : ''}>
      ${esc(c.nome)}
    </label>`).join('') + `
    <label class="filtro-opcao"><input type="radio" name="categoria" value="" ${!atuais.categoria ? 'checked' : ''}> Todas</label>`;

  const { marcas } = await Api.get('/marcas');
  document.getElementById('filtro-marcas').innerHTML = marcas.map((m) => `
    <label class="filtro-opcao">
      <input type="radio" name="marca" value="${esc(m.slug)}" ${atuais.marca === m.slug ? 'checked' : ''}>
      ${esc(m.nome)}
    </label>`).join('') + `
    <label class="filtro-opcao"><input type="radio" name="marca" value="" ${!atuais.marca ? 'checked' : ''}> Todas</label>`;

  document.querySelectorAll('input[name="categoria"], input[name="marca"]').forEach((input) => {
    input.addEventListener('change', () => carregarCatalogo(true));
  });
}

async function carregarCatalogo(resetarPagina = false) {
  if (resetarPagina) estadoCatalogo.pagina = 1;

  const categoria = document.querySelector('input[name="categoria"]:checked')?.value || '';
  const marca = document.querySelector('input[name="marca"]:checked')?.value || '';
  const ordenar = document.getElementById('select-ordenar').value;
  const params = lerParametros();
  const busca = params.busca;

  atualizarUrl({ busca, categoria, marca, ordenar });

  const grid = document.getElementById('grid-catalogo');
  grid.innerHTML = Array.from({ length: 8 }).map(() => '<div class="skeleton" style="aspect-ratio:3/4"></div>').join('');

  try {
    const query = new URLSearchParams({
      pagina: estadoCatalogo.pagina, limite: estadoCatalogo.limite, ordenar
    });
    if (busca) query.set('busca', busca);
    if (categoria) query.set('categoria', categoria);
    if (marca) query.set('marca', marca);

    const resultado = await Api.get(`/produtos?${query.toString()}`);
    grid.innerHTML = resultado.itens.map(cardProdutoHtml).join('') || '<p class="txt-cinza">Nenhum produto encontrado com esses filtros.</p>';

    document.getElementById('contagem-resultados').textContent = `${resultado.total} produto(s) encontrado(s)`;
    document.getElementById('titulo-catalogo').textContent = busca ? `Resultados para "${busca}"` : 'Todos os produtos';

    montarPaginacao(resultado.total, resultado.limite);
  } catch (e) {
    const erroEl = document.createElement('p');
    erroEl.className = 'badge-erro';
    erroEl.textContent = `Erro ao carregar produtos: ${e.message}`;
    grid.replaceChildren(erroEl);
  }
}

function montarPaginacao(total, limite) {
  const totalPaginas = Math.ceil(total / limite);
  const el = document.getElementById('paginacao');
  if (totalPaginas <= 1) { el.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= totalPaginas; i++) {
    html += `<button class="${i === estadoCatalogo.pagina ? 'ativo' : ''}" data-pagina="${i}">${i}</button>`;
  }
  el.innerHTML = html;
  el.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      estadoCatalogo.pagina = Number(btn.dataset.pagina);
      carregarCatalogo();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await iniciarLayout('produtos');
  const atuais = lerParametros();
  document.getElementById('select-ordenar').value = atuais.ordenar;
  await montarFiltros(atuais);
  carregarCatalogo();

  document.getElementById('select-ordenar').addEventListener('change', () => carregarCatalogo(true));
  document.getElementById('btn-limpar-filtros').addEventListener('click', () => {
    window.location.href = 'produtos.html';
  });
});
