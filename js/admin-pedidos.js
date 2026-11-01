async function carregarTabelaPedidos() {
  const status = document.getElementById('filtro-status-pedido').value;
  const query = new URLSearchParams({ limite: 100 });
  if (status) query.set('status', status);

  const { itens } = await Api.get(`/pedidos/admin/todos?${query.toString()}`, { tokenAdmin: true });
  document.getElementById('tabela-pedidos-admin').innerHTML = itens.map((p) => `
    <tr>
      <td><strong>${esc(p.numero_pedido)}</strong></td>
      <td>${esc(p.cliente_nome)}</td>
      <td>${formatarData(p.criado_em)}</td>
      <td>${formatarPreco(p.total)}</td>
      <td>${p.forma_pagamento === 'pix' ? 'Pix' : 'Cartão'}</td>
      <td>${p.tipo_recebimento === 'retirada' ? 'Retirada' : 'Entrega'}</td>
      <td>${badgeStatus(p.status)}</td>
      <td><button class="btn btn-secundario btn-sm" data-id="${Number(p.id)}">Abrir</button></td>
    </tr>`).join('') || '<tr><td colspan="8" class="txt-cinza text-center">Nenhum pedido encontrado.</td></tr>';

  document.querySelectorAll('#tabela-pedidos-admin button[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => abrirModalPedido(btn.dataset.id));
  });
}

async function abrirModalPedido(id) {
  const { pedido, proximosStatus = [] } = await Api.get(`/pedidos/admin/${id}`, { tokenAdmin: true });
  // A simulação só existe em ambiente de teste explícito (o backend também recusa fora dele).
  let simulado = false;
  try { simulado = (await Api.get('/pagamentos/config')).simulado === true; } catch (e) { /* mantém falso */ }
  const podeSimularPix = simulado && pedido.forma_pagamento === 'pix' && pedido.status === 'aguardando_pagamento';
  const opcoesStatus = [pedido.status, ...proximosStatus];

  document.getElementById('conteudo-modal-pedido').innerHTML = `
    <h2>Pedido ${esc(pedido.numero_pedido)}</h2>
    <p class="txt-cinza mb-2">${esc(pedido.cliente_nome)} · ${esc(pedido.cliente_email)} ${pedido.cliente_telefone ? `· ${esc(pedido.cliente_telefone)}` : ''}</p>

    ${pedido.tipo_recebimento === 'entrega' ? `
      <p class="txt-cinza mb-2" style="font-size:.85rem">
        Entregar em: ${esc(pedido.rua)}, ${esc(pedido.numero)} ${esc(pedido.complemento || '')} - ${esc(pedido.bairro)}, ${esc(pedido.cidade)}/${esc(pedido.estado)} - CEP ${esc(pedido.cep)}
      </p>` : `<p class="txt-cinza mb-2" style="font-size:.85rem">Retirada no local.</p>`}

    <table class="tabela-admin mb-2">
      <thead><tr><th>Item</th><th>Qtd</th><th>Subtotal</th></tr></thead>
      <tbody>
        ${pedido.itens.map((i) => `<tr><td>${esc(i.produto_nome)}${i.sabor ? ` (${esc(i.sabor)})` : ''}</td><td>${Number(i.quantidade)}</td><td>${formatarPreco(i.subtotal)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="resumo-linha"><span>Subtotal</span><span>${formatarPreco(pedido.subtotal)}</span></div>
    <div class="resumo-linha"><span>Entrega</span><span>${formatarPreco(pedido.taxa_entrega)}</span></div>
    <div class="resumo-linha total"><span>Total</span><span>${formatarPreco(pedido.total)}</span></div>

    <div class="grupo-form mt-2">
      <label>Status do pedido</label>
      <select id="select-status-pedido" class="input-admin" style="width:100%">
        ${opcoesStatus.map((s) => `<option value="${esc(s)}" ${s === pedido.status ? 'selected' : ''}>${esc(rotuloStatus(s))}</option>`).join('')}
      </select>
    </div>

    ${podeSimularPix ? `<button class="btn btn-secundario btn-bloco mb-2" id="btn-simular-pix">✅ Simular aprovação do Pix (SOMENTE ambiente de teste)</button>` : ''}

    <div class="flex gap-2">
      <button class="btn btn-primario" id="btn-salvar-status">Salvar status</button>
      <button class="btn btn-secundario" id="btn-fechar-modal-pedido">Fechar</button>
    </div>
  `;

  document.getElementById('modal-pedido').classList.add('aberto');
  document.getElementById('btn-fechar-modal-pedido').addEventListener('click', () => document.getElementById('modal-pedido').classList.remove('aberto'));

  document.getElementById('btn-salvar-status').addEventListener('click', async () => {
    const status = document.getElementById('select-status-pedido').value;
    if (status === pedido.status) { document.getElementById('modal-pedido').classList.remove('aberto'); return; }
    if (status === 'cancelado' && !confirm('Cancelar este pedido? O estoque será devolvido e, se já houver pagamento aprovado, o estorno será solicitado ao gateway. Esta ação não pode ser desfeita.')) return;
    try {
      await Api.patch(`/pedidos/admin/${id}/status`, { status }, { tokenAdmin: true });
      document.getElementById('modal-pedido').classList.remove('aberto');
      carregarTabelaPedidos();
    } catch (e) {
      alert(e.message);
    }
  });

  document.getElementById('btn-simular-pix')?.addEventListener('click', async () => {
    try {
      await Api.post(`/pagamentos/pedido/${id}/simular-aprovacao`, {}, { tokenAdmin: true });
      document.getElementById('modal-pedido').classList.remove('aberto');
      carregarTabelaPedidos();
    } catch (e) {
      alert(e.message);
    }
  });
}

async function verAguardandoRetirada() {
  const { pedidos } = await Api.get('/pedidos/admin/retirada', { tokenAdmin: true });
  document.getElementById('conteudo-modal-pedido').innerHTML = `
    <h2>Pedidos aguardando retirada</h2>
    <table class="tabela-admin mt-2">
      <thead><tr><th>Pedido</th><th>Cliente</th><th>Telefone</th><th>Total</th><th>Data</th></tr></thead>
      <tbody>
        ${pedidos.map((p) => `<tr><td>${esc(p.numero_pedido)}</td><td>${esc(p.cliente_nome)}</td><td>${esc(p.cliente_telefone || '-')}</td><td>${formatarPreco(p.total)}</td><td>${formatarData(p.criado_em)}</td></tr>`).join('') || '<tr><td colspan="5" class="txt-cinza">Nenhum pedido aguardando retirada.</td></tr>'}
      </tbody>
    </table>
    <button class="btn btn-secundario mt-2" id="btn-fechar-modal-pedido">Fechar</button>
  `;
  document.getElementById('modal-pedido').classList.add('aberto');
  document.getElementById('btn-fechar-modal-pedido').addEventListener('click', () => document.getElementById('modal-pedido').classList.remove('aberto'));
}

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = await iniciarAdmin('pedidos');
  if (!usuario) return;

  carregarTabelaPedidos();
  document.getElementById('filtro-status-pedido').addEventListener('change', carregarTabelaPedidos);
  document.getElementById('btn-ver-retirada').addEventListener('click', verAguardandoRetirada);

  document.getElementById('modal-pedido').addEventListener('click', (ev) => {
    if (ev.target.id === 'modal-pedido') document.getElementById('modal-pedido').classList.remove('aberto');
  });
});
