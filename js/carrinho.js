function renderizarCarrinho() {
  const itens = Carrinho.obterItens();
  const lista = document.getElementById('lista-carrinho');

  if (!itens.length) {
    lista.innerHTML = `
      <div class="carrinho-vazio">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
        <p>Seu carrinho está vazio.</p>
        <a href="produtos.html" class="btn btn-primario mt-2">Ver produtos</a>
      </div>`;
    document.getElementById('btn-finalizar').classList.add('hidden');
  } else {
    lista.innerHTML = itens.map((item) => `
      <div class="carrinho-item">
        <div class="carrinho-item__imagem">
          ${item.imagem ? `<img src="${esc(urlArquivo(item.imagem))}" alt="" onerror="this.remove()">` : ''}
        </div>
        <div>
          <a href="produto.html?slug=${encodeURIComponent(item.slug)}"><p class="carrinho-item__nome">${esc(item.nome)}</p></a>
          ${item.sabor ? `<p class="carrinho-item__variacao">Sabor: ${esc(item.sabor)}</p>` : ''}
          <div class="carrinho-item__linha-baixo">
            <div class="seletor-qtd">
              <button data-acao="menos" data-produto="${Number(item.produtoId)}" data-sabor="${esc(item.sabor || '')}">−</button>
              <span>${Number(item.quantidade) || 0}</span>
              <button data-acao="mais" data-produto="${Number(item.produtoId)}" data-sabor="${esc(item.sabor || '')}">+</button>
            </div>
            <button class="carrinho-item__remover" data-acao="remover" data-produto="${Number(item.produtoId)}" data-sabor="${esc(item.sabor || '')}">Remover</button>
          </div>
        </div>
        <div class="carrinho-item__totais">
          <p class="txt-cinza" style="font-size:.8rem">${formatarPreco(item.preco)} un.</p>
          <p class="carrinho-item__subtotal">${formatarPreco(item.preco * item.quantidade)}</p>
        </div>
      </div>`).join('');
    document.getElementById('btn-finalizar').classList.remove('hidden');
  }

  document.getElementById('resumo-subtotal').textContent = formatarPreco(Carrinho.subtotal());
  document.getElementById('resumo-total').textContent = formatarPreco(Carrinho.subtotal());

  lista.querySelectorAll('button[data-acao]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const produtoId = Number(btn.dataset.produto);
      const sabor = btn.dataset.sabor || null;
      const itemAtual = Carrinho.obterItens().find((i) => i.produtoId === produtoId && i.sabor === sabor);
      if (btn.dataset.acao === 'mais') Carrinho.atualizarQuantidade(produtoId, sabor, itemAtual.quantidade + 1);
      if (btn.dataset.acao === 'menos') Carrinho.atualizarQuantidade(produtoId, sabor, itemAtual.quantidade - 1);
      if (btn.dataset.acao === 'remover') Carrinho.remover(produtoId, sabor);
      renderizarCarrinho();
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await iniciarLayout('carrinho');
  renderizarCarrinho();
});
