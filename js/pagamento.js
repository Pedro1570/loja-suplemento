let PEDIDO_ATUAL = null;
let INTERVALO_POLL = null;
let CONFIG_PAGAMENTO = { simulado: true, modo: 'desenvolvimento', publicKey: null };
let MP_INSTANCIA = null;

function opcoesDoPedido() {
  return opcoesPedido(PEDIDO_ATUAL.numero_pedido);
}

function mostrarMensagem(elId, texto, classe = 'mensagem-erro') {
  const el = document.getElementById(elId);
  const div = document.createElement('div');
  div.className = classe;
  div.textContent = texto; // textContent: mensagens da API nunca viram HTML
  el.replaceChildren(div);
}

function carregarSdkMercadoPago() {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) return resolve();
    const s = document.createElement('script');
    s.src = 'https://sdk.mercadopago.com/js/v2';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Não foi possível carregar o formulário seguro de cartão.'));
    document.head.appendChild(s);
  });
}

function telaPix(dados) {
  const simulado = dados.simulado === true;
  const aviso = simulado
    ? '<div class="mensagem-erro"><strong>AMBIENTE DE TESTE.</strong> Este código NÃO é um Pix válido e nenhuma cobrança real existe. O pagamento só é confirmado pela equipe, simulando o gateway.</div>'
    : '';
  const qr = !simulado && dados.qrCodeDataUrl
    ? `<img src="${esc(dados.qrCodeDataUrl)}" alt="QR Code Pix">`
    : '';

  document.getElementById('conteudo-pagamento').innerHTML = `
    <h3><span class="num">💠</span> Pagamento via Pix</h3>
    ${aviso}
    <div class="pix-box">
      ${qr}
      <p class="txt-cinza" style="font-size:.85rem">${simulado ? 'Código de teste:' : 'Escaneie o QR Code com o app do seu banco ou copie o código abaixo.'}</p>
      <div class="pix-copia-cola">
        <input type="text" readonly value="${esc(dados.copiaCola || '')}" id="input-copia-cola">
        <button class="btn btn-primario btn-sm" id="btn-copiar-pix">Copiar código</button>
      </div>
      <p class="timer-pix" id="timer-pix"></p>
      <div class="status-pagamento pendente" id="status-pagamento">
        <div class="spinner"></div> Aguardando confirmação do pagamento...
      </div>
      <p class="txt-cinza mt-2" style="font-size:.78rem">Pedido nº <strong>${esc(PEDIDO_ATUAL.numero_pedido)}</strong></p>
    </div>
  `;

  document.getElementById('btn-copiar-pix').addEventListener('click', () => {
    const input = document.getElementById('input-copia-cola');
    input.select();
    navigator.clipboard?.writeText(input.value);
    mostrarToast('Código copiado!');
  });

  if (dados.expiracao) iniciarTimer(new Date(dados.expiracao));
  iniciarPollingStatus();
}

function iniciarTimer(dataExpiracao) {
  const el = document.getElementById('timer-pix');
  function atualizar() {
    const diffMs = dataExpiracao - new Date();
    if (diffMs <= 0) { el.textContent = 'Código Pix expirado. Recarregue a página para gerar um novo.'; clearInterval(intervalo); return; }
    const min = Math.floor(diffMs / 60000);
    const seg = Math.floor((diffMs % 60000) / 1000);
    el.textContent = `Expira em ${min}:${String(seg).padStart(2, '0')}`;
  }
  atualizar();
  const intervalo = setInterval(atualizar, 1000);
}

// O estado exibido é SEMPRE o que o servidor informa (confirmado pelo gateway), nunca presumido.
function iniciarPollingStatus() {
  INTERVALO_POLL = setInterval(async () => {
    try {
      const { pagamento, pedidoStatus } = await Api.get(`/pagamentos/pedido/${PEDIDO_ATUAL.id}`, opcoesDoPedido());
      const statusEl = document.getElementById('status-pagamento');
      if (pagamento.status === 'aprovado') {
        clearInterval(INTERVALO_POLL);
        window.location.href = `pedido-confirmado.html?numero=${encodeURIComponent(PEDIDO_ATUAL.numero_pedido)}`;
      } else if (['cancelado', 'expirado'].includes(pedidoStatus) || ['recusado', 'estornado'].includes(pagamento.status)) {
        clearInterval(INTERVALO_POLL);
        statusEl.textContent = pedidoStatus === 'expirado' ? '⌛ Pedido expirado. Faça um novo pedido.' : '❌ Pagamento não aprovado ou pedido cancelado.';
        statusEl.className = 'status-pagamento';
      }
    } catch (e) { /* silencia erros de polling; tenta de novo */ }
  }, 4000);
}

function detectarBandeiraVisual(numero) {
  const n = numero.replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  return 'Desconhecida';
}

function telaCartao() {
  const simulado = CONFIG_PAGAMENTO.simulado === true;
  document.getElementById('conteudo-pagamento').innerHTML = `
    <h3><span class="num">💳</span> Pagamento com cartão</h3>
    ${simulado ? `<div class="mensagem-erro"><strong>AMBIENTE DE TESTE.</strong> Nenhuma cobrança real será feita. Não digite dados de um cartão real.</div>
      <div class="grupo-form"><label>Resultado do teste</label>
        <select id="cartao-resultado-teste"><option value="sim_aprovado">Simular aprovação</option><option value="sim_recusado">Simular recusa</option></select>
      </div>` : ''}
    <form id="form-cartao" autocomplete="off">
      ${simulado ? '' : `
      <div class="grupo-form"><label>Número do cartão</label><input type="text" id="cartao-numero" maxlength="19" inputmode="numeric" placeholder="0000 0000 0000 0000" required></div>
      <div class="grupo-form"><label>Nome impresso no cartão</label><input type="text" id="cartao-nome" required></div>
      <div class="linha-form duas">
        <div class="grupo-form"><label>Validade</label><input type="text" id="cartao-validade" placeholder="MM/AA" maxlength="5" required></div>
        <div class="grupo-form"><label>CVV</label><input type="text" id="cartao-cvv" maxlength="4" inputmode="numeric" required></div>
      </div>
      <div class="grupo-form"><label>CPF do titular</label><input type="text" id="cartao-cpf" maxlength="14" inputmode="numeric" required></div>`}
      <div class="grupo-form">
        <label>Parcelas</label>
        <select id="cartao-parcelas">
          ${Array.from({ length: 12 }).map((_, i) => `<option value="${i + 1}">${i + 1}x de ${esc(formatarPreco(PEDIDO_ATUAL.total / (i + 1)))}</option>`).join('')}
        </select>
      </div>
      <p class="txt-cinza" style="font-size:.78rem;margin-bottom:14px">🔒 ${simulado ? 'Ambiente de teste.' : 'Os dados do cartão são enviados direto ao gateway de pagamento e nunca passam pelo nosso servidor.'}</p>
      <button type="submit" class="btn btn-primario btn-bloco" style="padding:15px">Pagar ${esc(formatarPreco(PEDIDO_ATUAL.total))}</button>
      <div id="mensagem-cartao" class="mt-2"></div>
    </form>
  `;

  document.getElementById('form-cartao').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const btn = ev.target.querySelector('button[type="submit"]');
    const textoBtn = `Pagar ${formatarPreco(PEDIDO_ATUAL.total)}`;
    btn.disabled = true;
    btn.textContent = 'Processando...';

    try {
      const parcelas = Number(document.getElementById('cartao-parcelas').value);
      let cartao;
      if (simulado) {
        cartao = { token: document.getElementById('cartao-resultado-teste').value, parcelas };
      } else {
        // Tokenização no navegador pelo SDK oficial: o número do cartão NUNCA vai para o nosso backend.
        await carregarSdkMercadoPago();
        if (!CONFIG_PAGAMENTO.publicKey) throw new Error('Pagamento com cartão indisponível no momento.');
        MP_INSTANCIA = MP_INSTANCIA || new window.MercadoPago(CONFIG_PAGAMENTO.publicKey, { locale: 'pt-BR' });
        const numero = document.getElementById('cartao-numero').value.replace(/\D/g, '');
        const [mes, ano] = document.getElementById('cartao-validade').value.split('/');
        const cpf = document.getElementById('cartao-cpf').value.replace(/\D/g, '');
        const metodos = await MP_INSTANCIA.getPaymentMethods({ bin: numero.slice(0, 8) });
        const paymentMethodId = metodos && metodos.results && metodos.results[0] && metodos.results[0].id;
        if (!paymentMethodId) throw new Error('Cartão não reconhecido.');
        const tk = await MP_INSTANCIA.createCardToken({
          cardNumber: numero,
          cardholderName: document.getElementById('cartao-nome').value,
          cardExpirationMonth: mes,
          cardExpirationYear: ano && ano.length === 2 ? `20${ano}` : ano,
          securityCode: document.getElementById('cartao-cvv').value,
          identificationType: 'CPF',
          identificationNumber: cpf
        });
        cartao = { token: tk.id, paymentMethodId, parcelas, cpf };
        document.getElementById('form-cartao').reset(); // não mantém dados sensíveis no DOM
      }

      const { pagamento } = await Api.post('/pagamentos', { pedidoId: PEDIDO_ATUAL.id, metodo: 'cartao', cartao }, opcoesDoPedido());

      if (pagamento.status === 'aprovado') {
        window.location.href = `pedido-confirmado.html?numero=${encodeURIComponent(PEDIDO_ATUAL.numero_pedido)}`;
      } else if (pagamento.status === 'pendente') {
        mostrarMensagem('mensagem-cartao', 'Pagamento em análise. Você será avisado quando for confirmado.', 'mensagem-sucesso');
        iniciarPollingStatus();
      } else {
        mostrarMensagem('mensagem-cartao', 'Pagamento não aprovado. Tente outro cartão.');
        btn.disabled = false;
        btn.textContent = textoBtn;
      }
    } catch (e) {
      mostrarMensagem('mensagem-cartao', e.message || 'Não foi possível processar o pagamento.');
      btn.disabled = false;
      btn.textContent = textoBtn;
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await iniciarLayout('');
  const params = new URLSearchParams(window.location.search);
  const numeroPedido = params.get('pedido');
  const metodo = params.get('metodo');

  if (!numeroPedido) { window.location.href = 'produtos.html'; return; }

  const alvo = document.getElementById('conteudo-pagamento');
  try {
    try { CONFIG_PAGAMENTO = await Api.get('/pagamentos/config'); } catch (e) { /* mantém padrão seguro (sem cartão real) */ }

    const { pedido } = await Api.get(`/pedidos/rastrear/${encodeURIComponent(numeroPedido)}`, opcoesPedido(numeroPedido));
    PEDIDO_ATUAL = pedido;

    if (pedido.status !== 'aguardando_pagamento') {
      window.location.href = `pedido-confirmado.html?numero=${encodeURIComponent(numeroPedido)}`;
      return;
    }

    if (metodo === 'pix') {
      const { pagamento } = await Api.post('/pagamentos', { pedidoId: pedido.id, metodo: 'pix' }, opcoesDoPedido());
      telaPix(pagamento);
    } else {
      telaCartao();
    }
  } catch (e) {
    const p = document.createElement('p');
    p.className = 'badge-erro';
    p.textContent = e.message;
    alvo.replaceChildren(p);
  }
});
