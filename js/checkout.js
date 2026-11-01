function renderizarResumoCheckout() {
  const itens = Carrinho.obterItens();
  document.getElementById('resumo-itens-checkout').innerHTML = itens.map((i) => `
    <div class="resumo-linha"><span>${Number(i.quantidade) || 0}x ${esc(i.nome)}${i.sabor ? ` (${esc(i.sabor)})` : ''}</span><span>${formatarPreco(i.preco * i.quantidade)}</span></div>
  `).join('');
  const subtotal = Carrinho.subtotal();
  document.getElementById('checkout-subtotal').textContent = formatarPreco(subtotal);

  const tipoEntrega = document.querySelector('input[name="tipoRecebimento"]:checked')?.value;
  const taxa = tipoEntrega === 'entrega' ? Number(CONFIG_LOJA.taxa_entrega || 0) : 0;
  document.getElementById('checkout-frete').textContent = taxa > 0 ? formatarPreco(taxa) : 'Grátis';
  document.getElementById('checkout-total').textContent = formatarPreco(subtotal + taxa);
}

function configurarOpcoesRecebimento() {
  document.querySelectorAll('#opcoes-recebimento .opcao-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('#opcoes-recebimento .opcao-card').forEach((c) => c.classList.remove('selecionada'));
      card.classList.add('selecionada');
      card.querySelector('input').checked = true;
      const isEntrega = card.dataset.tipo === 'entrega';
      document.getElementById('info-retirada').classList.toggle('hidden', isEntrega);
      document.getElementById('campos-entrega').classList.toggle('hidden', !isEntrega);
      document.querySelectorAll('#campos-entrega input').forEach((inp) => { inp.required = isEntrega; });
      renderizarResumoCheckout();
    });
  });
}

function configurarOpcoesPagamento() {
  document.querySelectorAll('#opcoes-pagamento .opcao-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('#opcoes-pagamento .opcao-card').forEach((c) => c.classList.remove('selecionada'));
      card.classList.add('selecionada');
      card.querySelector('input').checked = true;
    });
  });
}

async function enviarCheckout(ev) {
  ev.preventDefault();
  const msgEl = document.getElementById('mensagem-checkout');
  msgEl.innerHTML = '';

  const itens = Carrinho.obterItens();
  if (!itens.length) {
    msgEl.innerHTML = '<div class="mensagem-erro">Seu carrinho está vazio.</div>';
    return;
  }

  const form = ev.target;
  const dados = new FormData(form);
  const tipoRecebimento = dados.get('tipoRecebimento');
  const formaPagamento = dados.get('formaPagamento');

  const payload = {
    itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade, sabor: i.sabor })),
    tipoRecebimento,
    formaPagamento
  };

  if (tipoRecebimento === 'entrega') {
    payload.endereco = {
      cep: dados.get('cep'), estado: dados.get('estado'), cidade: dados.get('cidade'),
      bairro: dados.get('bairro'), rua: dados.get('rua'), numero: dados.get('numero'),
      complemento: dados.get('complemento'), principal: true
    };
  }

  const tokenCliente = localStorage.getItem('ps_token_cliente');
  const opcoes = {};
  if (tokenCliente) {
    opcoes.tokenCliente = true;
  } else {
    payload.visitante = {
      nome: dados.get('nome'), email: dados.get('email'),
      telefone: dados.get('telefone'), cpf: dados.get('cpf')
    };
  }

  const btn = document.getElementById('btn-continuar-pagamento');
  btn.disabled = true;
  btn.textContent = 'Processando...';

  try {
    const { pedido, tokenAcesso } = await Api.post('/pedidos', payload, opcoes);
    // O token de acesso só é devolvido nesta resposta: é ele que autoriza o visitante a pagar/acompanhar o pedido.
    salvarTokenPedido(pedido.numero_pedido, tokenAcesso);
    Carrinho.limpar();
    window.location.href = `pagamento.html?pedido=${encodeURIComponent(pedido.numero_pedido)}&metodo=${encodeURIComponent(formaPagamento)}`;
  } catch (e) {
    msgEl.innerHTML = `<div class="mensagem-erro">${esc(e.message)}</div>`;
    btn.disabled = false;
    btn.textContent = 'Continuar para pagamento';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await iniciarLayout('');

  if (!Carrinho.obterItens().length) {
    window.location.href = 'carrinho.html';
    return;
  }

  document.getElementById('txt-endereco-loja').textContent = CONFIG_LOJA.endereco_loja || '';
  document.getElementById('txt-horario-loja').textContent = CONFIG_LOJA.horario_funcionamento || '';

  const logado = !!localStorage.getItem('ps_token_cliente');
  if (logado) {
    const bloco = document.getElementById('bloco-visitante');
    bloco.classList.add('hidden');
    bloco.querySelectorAll('input[required]').forEach((inp) => { inp.required = false; });
  }

  configurarOpcoesRecebimento();
  configurarOpcoesPagamento();
  renderizarResumoCheckout();

  document.getElementById('form-checkout').addEventListener('submit', enviarCheckout);
});
