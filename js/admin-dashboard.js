function renderizarGraficoBarras(containerId, dados, chaveLabel, chaveValor, corBarra = 'var(--verde-neon)') {
  const max = Math.max(...dados.map((d) => Number(d[chaveValor])), 1);
  document.getElementById(containerId).innerHTML = `
    <div style="display:flex;align-items:flex-end;gap:8px;height:180px;padding-top:10px">
      ${dados.map((d) => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end">
          <span style="font-size:.68rem;color:var(--cinza-texto)">${Number(d[chaveValor]).toFixed(0)}</span>
          <div style="width:100%;max-width:28px;background:${corBarra};border-radius:4px 4px 0 0;height:${Math.max(4, (d[chaveValor] / max) * 130)}px"></div>
          <span style="font-size:.65rem;color:var(--cinza-texto);text-align:center">${esc(d[chaveLabel])}</span>
        </div>`).join('')}
    </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = await iniciarAdmin('dashboard');
  if (!usuario) return;

  try {
    const { dashboard } = await Api.get('/dashboard', { tokenAdmin: true });

    document.getElementById('m-vendas-hoje').textContent = formatarPreco(dashboard.vendasHoje.valor);
    document.getElementById('m-pedidos-hoje').textContent = `${dashboard.vendasHoje.pedidos} pedido(s)`;
    document.getElementById('m-vendas-mes').textContent = formatarPreco(dashboard.vendasMes.valor);
    document.getElementById('m-pedidos-mes').textContent = `${dashboard.vendasMes.pedidos} pedido(s)`;
    document.getElementById('m-pendentes').textContent = dashboard.pendentes;
    document.getElementById('m-concluidos').textContent = dashboard.concluidos;
    document.getElementById('m-produtos').textContent = dashboard.totalProdutos;
    document.getElementById('m-clientes').textContent = dashboard.totalClientes;

    const vendasPorDia = dashboard.vendasPorDia.map((v) => ({ dia: formatarData(v.dia).slice(0, 5), total: v.total }));
    renderizarGraficoBarras('grafico-vendas', vendasPorDia.length ? vendasPorDia : [{ dia: '—', total: 0 }], 'dia', 'total');

    const porStatus = dashboard.porStatus.map((s) => ({ label: rotuloStatus(s.status).split(' ')[0], total: s.total }));
    renderizarGraficoBarras('grafico-status', porStatus.length ? porStatus : [{ label: '—', total: 0 }], 'label', 'total', 'var(--azul)');

    document.getElementById('tabela-mais-vendidos').innerHTML = dashboard.maisVendidos.map((p) => `
      <tr><td>${esc(p.nome)}</td><td>${Number(p.total_vendido)}</td></tr>`).join('') || '<tr><td colspan="2" class="txt-cinza">Sem dados ainda.</td></tr>';

    document.getElementById('tabela-estoque-baixo').innerHTML = dashboard.produtosEstoqueBaixo.map((p) => `
      <tr><td>${esc(p.nome)}</td><td><span class="badge badge-estoque-baixo">${Number(p.estoque)} un.</span></td></tr>`).join('') || '<tr><td colspan="2" class="txt-cinza">Nenhum produto com estoque baixo.</td></tr>';
  } catch (e) {
    console.error(e);
  }
});
