function trocarTab(nomeTab) {
  document.querySelectorAll('.menu-conta a[data-tab]').forEach((a) => a.classList.toggle('ativo', a.dataset.tab === nomeTab));
  ['pedidos', 'dados', 'senha'].forEach((t) => document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== nomeTab));
}

async function carregarPedidos() {
  const { pedidos } = await Api.get('/pedidos/minha-conta/pedidos', { tokenCliente: true });
  const corpo = document.getElementById('corpo-tabela-pedidos');
  if (!pedidos.length) {
    corpo.innerHTML = `<tr><td colspan="5" class="txt-cinza text-center">Você ainda não fez nenhum pedido.</td></tr>`;
    return;
  }
  corpo.innerHTML = pedidos.map((p) => `
    <tr>
      <td>${esc(p.numero_pedido)}</td>
      <td>${formatarData(p.criado_em)}</td>
      <td>${formatarPreco(p.total)}</td>
      <td><span class="badge badge-status">${esc(rotuloStatus(p.status))}</span></td>
      <td><button class="btn btn-secundario btn-sm" data-id="${Number(p.id)}">Ver detalhes</button></td>
    </tr>`).join('');

  corpo.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => verDetalhePedido(btn.dataset.id));
  });
}

async function verDetalhePedido(id) {
  const { pedido } = await Api.get(`/pedidos/minha-conta/pedidos/${id}`, { tokenCliente: true });
  document.getElementById('detalhe-pedido').innerHTML = `
    <div class="resumo-confirmacao">
      <h3 class="mb-2">Pedido ${esc(pedido.numero_pedido)}</h3>
      ${pedido.itens.map((i) => `<div class="resumo-linha"><span>${Number(i.quantidade)}x ${esc(i.produto_nome)}${i.sabor ? ` (${esc(i.sabor)})` : ''}</span><span>${formatarPreco(i.subtotal)}</span></div>`).join('')}
      <div class="resumo-linha total"><span>Total</span><span>${formatarPreco(pedido.total)}</span></div>
      <p class="mt-2"><span class="badge badge-status">${esc(rotuloStatus(pedido.status))}</span></p>
    </div>
  `;
}

async function carregarDados() {
  const { cliente } = await Api.get('/auth/clientes/me', { tokenCliente: true });
  document.getElementById('dados-cliente').innerHTML = `
    <div class="grupo-form"><label>Nome</label><input type="text" value="${esc(cliente.nome)}" disabled></div>
    <div class="grupo-form"><label>E-mail</label><input type="text" value="${esc(cliente.email)}" disabled></div>
    <div class="grupo-form"><label>Telefone</label><input type="text" value="${esc(cliente.telefone || '-')}" disabled></div>
    <p class="txt-cinza" style="font-size:.8rem">Para alterar seus dados cadastrais, entre em contato pelo WhatsApp.</p>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('ps_token_cliente')) { window.location.href = 'login.html'; return; }

  await iniciarLayout('conta');
  carregarPedidos();

  document.querySelectorAll('.menu-conta a[data-tab]').forEach((a) => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      trocarTab(a.dataset.tab);
      if (a.dataset.tab === 'dados') carregarDados();
    });
  });

  document.getElementById('link-sair').addEventListener('click', (ev) => {
    ev.preventDefault();
    localStorage.removeItem('ps_token_cliente');
    localStorage.removeItem('ps_cliente_nome');
    window.location.href = 'index.html';
  });

  document.getElementById('form-senha').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dados = Object.fromEntries(new FormData(ev.target));
    try {
      await Api.put('/auth/clientes/senha', dados, { tokenCliente: true });
      document.getElementById('msg-senha').innerHTML = '<div class="mensagem-sucesso">Senha alterada com sucesso!</div>';
      ev.target.reset();
    } catch (e) {
      document.getElementById('msg-senha').innerHTML = `<div class="mensagem-erro">${esc(e.message)}</div>`;
    }
  });
});
