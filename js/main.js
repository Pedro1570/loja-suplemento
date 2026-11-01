const ICONES_CATEGORIA = {
  dumbbell: '<path d="M6.5 4v16M17.5 4v16M2 9h4.5M17.5 9H22M2 15h4.5M17.5 15H22M6.5 12h11"/>',
  zap: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>',
  flame: '<path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-1.5.8-2.5 1.5-3.5 0 1.5 1 2 1.5 1 0-2-1.5-3-1.5-5.5C8.5 2 12 2 12 2Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  package: '<path d="M21 8V6l-9-4-9 4v2m18 0-9 4m9-4v10l-9 4M3 8l9 4m-9-4v10l9 4m0-14v14"/>',
  'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'
};

function cardCategoriaHtml(cat) {
  const svg = ICONES_CATEGORIA[cat.icone] || ICONES_CATEGORIA.grid;
  return `
    <a href="produtos.html?categoria=${encodeURIComponent(cat.slug)}" class="card-categoria">
      <div class="card-categoria__icone"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${svg}</svg></div>
      <span>${esc(cat.nome)}</span>
    </a>`;
}

// Produtos renderizados nos cards (o botão "Adicionar" usa o id, nunca JSON dentro de atributo HTML).
const PRODUTOS_RENDERIZADOS = new Map();

function cardProdutoHtml(p) {
  PRODUTOS_RENDERIZADOS.set(Number(p.id), p);
  const temPromo = p.preco_promocional && Number(p.preco_promocional) < Number(p.preco);
  const desconto = temPromo ? Math.round((1 - p.preco_promocional / p.preco) * 100) : 0;
  return `
    <div class="card-produto">
      <a href="produto.html?slug=${encodeURIComponent(p.slug)}" class="card-produto__imagem">
        ${temPromo ? `<div class="card-produto__badges"><span class="badge badge-desconto">-${desconto}%</span></div>` : ''}
        ${p.imagem ? `<img src="${esc(urlArquivo(p.imagem))}" alt="${esc(p.nome)}" onerror="this.remove()">` : svgPlaceholderProduto()}
      </a>
      <div class="card-produto__corpo">
        <span class="card-produto__marca">${esc(p.marca_nome || '')}</span>
        <a href="produto.html?slug=${encodeURIComponent(p.slug)}"><h3 class="card-produto__nome">${esc(p.nome)}</h3></a>
        <div class="card-produto__avaliacao"><span class="estrela">★</span> ${Number(p.avaliacao_media || 0).toFixed(1)} · ${Number(p.vendidos) || 0} vendidos</div>
        <div class="card-produto__precos">
          ${temPromo ? `<span class="preco-original">${formatarPreco(p.preco)}</span>` : ''}
          <span class="preco-atual">${formatarPreco(temPromo ? p.preco_promocional : p.preco)}</span>
        </div>
      </div>
      <div class="card-produto__acoes">
        <a href="produto.html?slug=${encodeURIComponent(p.slug)}" class="btn btn-secundario btn-sm">Ver detalhes</a>
        <button class="btn btn-primario btn-sm" data-adicionar-produto="${Number(p.id)}">Adicionar</button>
      </div>
    </div>`;
}

function adicionarRapido(produto) {
  Carrinho.adicionar(produto, 1, null);
  mostrarToast(`${produto.nome} adicionado ao carrinho!`);
}

document.addEventListener('click', (ev) => {
  const btn = ev.target.closest && ev.target.closest('[data-adicionar-produto]');
  if (!btn) return;
  const produto = PRODUTOS_RENDERIZADOS.get(Number(btn.dataset.adicionarProduto));
  if (produto) adicionarRapido(produto);
});

async function carregarHome() {
  try {
    const { categorias } = await Api.get('/categorias');
    document.getElementById('grid-categorias').innerHTML = categorias.map(cardCategoriaHtml).join('');
  } catch (e) { console.error(e); }

  try {
    const { itens } = await Api.get('/produtos?ordenar=mais_vendidos&limite=8');
    document.getElementById('grid-destaques').innerHTML = itens.map(cardProdutoHtml).join('') || '<p class="txt-cinza">Nenhum produto encontrado.</p>';
  } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', async () => {
  await iniciarLayout('inicio');
  carregarHome();
  document.getElementById('btn-contato-whatsapp')?.addEventListener('click', () => {
    document.getElementById('ps-whatsapp')?.click();
  });
});
