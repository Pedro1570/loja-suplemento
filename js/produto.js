let PRODUTO_ATUAL = null;
let SABOR_SELECIONADO = null;
let QTD_SELECIONADA = 1;

function montarPaginaProduto(p) {
  const temPromo = p.preco_promocional && Number(p.preco_promocional) < Number(p.preco);
  const imagemPrincipal = (p.imagens && p.imagens[0] && p.imagens[0].url) || '';

  document.getElementById('titulo-pagina').textContent = `${p.nome} — ${(typeof CONFIG_LOJA !== 'undefined' && CONFIG_LOJA.nome_loja) || 'PowerSupps'}`;

  document.getElementById('conteudo-produto').innerHTML = `
    <p class="migalha"><a href="index.html">Início</a> / <a href="produtos.html">Produtos</a> / <a href="produtos.html?categoria=${encodeURIComponent(p.categoria_slug || '')}">${esc(p.categoria_nome || '')}</a> / ${esc(p.nome)}</p>
    <div class="produto__layout">
      <div>
        <div class="produto__galeria-principal" id="galeria-principal">
          ${imagemPrincipal ? `<img src="${esc(urlArquivo(imagemPrincipal))}" alt="${esc(p.nome)}" onerror="this.remove()">` : svgPlaceholderProduto()}
        </div>
        <div class="produto__miniaturas">
          ${(p.imagens || []).map((img, i) => `<button class="${i === 0 ? 'ativo' : ''}" data-url="${esc(urlArquivo(img.url))}"><img src="${esc(urlArquivo(img.url))}" onerror="this.parentElement.remove()"></button>`).join('')}
        </div>
      </div>
      <div class="produto__info">
        <span class="card-produto__marca">${esc(p.marca_nome || '')}</span>
        <h1>${esc(p.nome)}</h1>
        <div class="card-produto__avaliacao"><span class="estrela">★</span> ${Number(p.avaliacao_media || 0).toFixed(1)} (${(p.avaliacoes || []).length} avaliações) · ${Number(p.vendidos) || 0} vendidos</div>
        <div class="produto__precos">
          ${temPromo ? `<span class="preco-original">${formatarPreco(p.preco)}</span>` : ''}
          <span class="preco-atual">${formatarPreco(temPromo ? p.preco_promocional : p.preco)}</span>
          ${temPromo ? `<span class="badge badge-desconto">-${Math.round((1 - p.preco_promocional / p.preco) * 100)}%</span>` : ''}
        </div>
        <p class="produto__descricao">${esc(p.descricao || '')}</p>

        ${(p.sabores && p.sabores.length) ? `
        <div class="produto__opcao">
          <h4>Sabor</h4>
          <div class="chips" id="chips-sabores">
            ${p.sabores.map((s, i) => `<button class="chip ${i === 0 ? 'ativo' : ''}" data-sabor="${esc(s.nome)}">${esc(s.nome)}</button>`).join('')}
          </div>
        </div>` : ''}

        <div class="produto__opcao">
          <h4>Peso / variação</h4>
          <p class="txt-cinza">${esc(p.peso || 'Único')}</p>
        </div>

        <div class="produto__opcao">
          <h4>Quantidade ${p.estoque > 0 ? `<span class="txt-cinza">(${Number(p.estoque)} em estoque)</span>` : ''}</h4>
          <div class="seletor-qtd">
            <button id="btn-menos">−</button>
            <span id="qtd-atual">1</span>
            <button id="btn-mais">+</button>
          </div>
        </div>

        <div class="produto__acoes-compra">
          <button class="btn btn-primario" id="btn-add-carrinho" ${p.estoque <= 0 ? 'disabled' : ''}>
            ${p.estoque <= 0 ? 'Fora de estoque' : 'Adicionar ao carrinho'}
          </button>
          <a href="carrinho.html" class="btn btn-secundario">Ver carrinho</a>
        </div>

        <div class="produto__tabs">
          <div class="tabs-cabecalho">
            <button class="ativo" data-tab="nutricao">Info. Nutricional</button>
            <button data-tab="avaliacoes">Avaliações (${(p.avaliacoes || []).length})</button>
          </div>
          <div id="tab-nutricao">
            <p class="txt-cinza">${esc(p.informacoes_nutricionais || 'Informações não disponíveis para este produto.')}</p>
          </div>
          <div id="tab-avaliacoes" class="hidden">
            ${(p.avaliacoes || []).length ? p.avaliacoes.map((a) => `
              <div class="avaliacao-item">
                <strong>${esc(a.cliente_nome)}</strong>
                <div class="estrelas">${estrelas(a.nota)}</div>
                <p class="txt-cinza" style="font-size:.85rem">${esc(a.comentario || '')}</p>
              </div>`).join('') : '<p class="txt-cinza">Ainda não há avaliações para este produto.</p>'}
          </div>
        </div>
      </div>
    </div>

    ${(p.relacionados && p.relacionados.length) ? `
    <div class="secao__titulo mt-4">
      <div><h2>Produtos relacionados</h2></div>
    </div>
    <div class="grid-produtos">${p.relacionados.map(cardProdutoHtml).join('')}</div>` : ''}
  `;

  document.querySelectorAll('.produto__miniaturas button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const galeria = document.querySelector('.produto__galeria-principal');
      const img = document.createElement('img');
      img.src = btn.dataset.url;
      img.alt = p.nome;
      galeria.replaceChildren(img);
      document.querySelectorAll('.produto__miniaturas button').forEach((b) => b.classList.remove('ativo'));
      btn.classList.add('ativo');
    });
  });

  document.querySelectorAll('#chips-sabores .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#chips-sabores .chip').forEach((c) => c.classList.remove('ativo'));
      chip.classList.add('ativo');
      SABOR_SELECIONADO = chip.dataset.sabor;
    });
  });
  SABOR_SELECIONADO = p.sabores && p.sabores[0] ? p.sabores[0].nome : null;

  document.getElementById('btn-menos').addEventListener('click', () => {
    QTD_SELECIONADA = Math.max(1, QTD_SELECIONADA - 1);
    document.getElementById('qtd-atual').textContent = QTD_SELECIONADA;
  });
  document.getElementById('btn-mais').addEventListener('click', () => {
    QTD_SELECIONADA = Math.min(p.estoque, QTD_SELECIONADA + 1);
    document.getElementById('qtd-atual').textContent = QTD_SELECIONADA;
  });

  document.getElementById('btn-add-carrinho')?.addEventListener('click', () => {
    Carrinho.adicionar(p, QTD_SELECIONADA, SABOR_SELECIONADO);
    mostrarToast(`${p.nome} adicionado ao carrinho!`);
  });

  document.querySelectorAll('.tabs-cabecalho button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs-cabecalho button').forEach((b) => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      document.getElementById('tab-nutricao').classList.toggle('hidden', btn.dataset.tab !== 'nutricao');
      document.getElementById('tab-avaliacoes').classList.toggle('hidden', btn.dataset.tab !== 'avaliacoes');
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await iniciarLayout('');
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) { window.location.href = 'produtos.html'; return; }

  try {
    const { produto } = await Api.get(`/produtos/${slug}`);
    PRODUTO_ATUAL = produto;
    montarPaginaProduto(produto);
  } catch (e) {
    document.getElementById('conteudo-produto').innerHTML = `<p class="badge-erro text-center mt-4">Produto não encontrado.</p>`;
  }
});
