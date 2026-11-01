/**
 * Carrinho de compras: persiste no localStorage para sobreviver a
 * atualizações de página, conforme pedido no escopo do projeto.
 */
const CARRINHO_CHAVE = 'ps_carrinho';

const Carrinho = {
  obterItens() {
    try {
      return JSON.parse(localStorage.getItem(CARRINHO_CHAVE)) || [];
    } catch (e) { return []; }
  },

  salvar(itens) {
    localStorage.setItem(CARRINHO_CHAVE, JSON.stringify(itens));
    this.atualizarContador();
  },

  adicionar(produto, quantidade = 1, sabor = null) {
    const itens = this.obterItens();
    const existente = itens.find((i) => i.produtoId === produto.id && i.sabor === sabor);

    if (existente) {
      existente.quantidade += quantidade;
    } else {
      itens.push({
        produtoId: produto.id,
        nome: produto.nome,
        slug: produto.slug,
        imagem: produto.imagem || (produto.imagens && produto.imagens[0] && produto.imagens[0].url) || '',
        preco: Number(produto.preco_promocional || produto.preco),
        sabor,
        quantidade
      });
    }
    this.salvar(itens);
  },

  atualizarQuantidade(produtoId, sabor, quantidade) {
    let itens = this.obterItens();
    if (quantidade <= 0) {
      itens = itens.filter((i) => !(i.produtoId === produtoId && i.sabor === sabor));
    } else {
      const item = itens.find((i) => i.produtoId === produtoId && i.sabor === sabor);
      if (item) item.quantidade = quantidade;
    }
    this.salvar(itens);
  },

  remover(produtoId, sabor) {
    const itens = this.obterItens().filter((i) => !(i.produtoId === produtoId && i.sabor === sabor));
    this.salvar(itens);
  },

  limpar() {
    localStorage.removeItem(CARRINHO_CHAVE);
    this.atualizarContador();
  },

  totalItens() {
    return this.obterItens().reduce((soma, i) => soma + i.quantidade, 0);
  },

  subtotal() {
    return this.obterItens().reduce((soma, i) => soma + i.preco * i.quantidade, 0);
  },

  atualizarContador() {
    const total = this.totalItens();
    document.querySelectorAll('.js-contador-carrinho').forEach((el) => {
      el.textContent = total;
      el.style.display = total > 0 ? 'flex' : 'none';
    });
  }
};

document.addEventListener('DOMContentLoaded', () => Carrinho.atualizarContador());
