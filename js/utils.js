/** Escapa texto para uso seguro dentro de templates HTML (conteúdo e atributos). */
function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Token de acesso do pedido (checkout de visitante). Guardado só neste navegador. */
function salvarTokenPedido(numero, token) {
  try { if (numero && token) localStorage.setItem(`ps_pedido_token_${numero}`, token); } catch (e) { /* sem storage */ }
}
function obterTokenPedido(numero) {
  try { return localStorage.getItem(`ps_pedido_token_${numero}`) || ''; } catch (e) { return ''; }
}
/** Opções do Api.* para consultar/pagar um pedido: JWT do cliente (se logado) e/ou token do pedido. */
function opcoesPedido(numero) {
  const opcoes = {};
  if (localStorage.getItem('ps_token_cliente')) opcoes.tokenCliente = true;
  const t = obterTokenPedido(numero);
  if (t) opcoes.headers = { 'X-Pedido-Token': t };
  return opcoes;
}

/** Rótulo de status do pedido (nunca 'undefined' para status novos). */
function rotuloStatus(status) {
  return STATUS_LABEL[status] || String(status || '');
}

function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataStr) {
  const d = new Date(dataStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const STATUS_LABEL = {
  aguardando_pagamento: 'Aguardando pagamento',
  pagamento_aprovado: 'Pagamento aprovado',
  em_preparacao: 'Em preparação',
  pronto_retirada: 'Pronto para retirada',
  enviado: 'Enviado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  expirado: 'Expirado'
};

function estrelas(nota) {
  const cheias = Math.round(nota || 0);
  return '★'.repeat(cheias) + '☆'.repeat(5 - cheias);
}

function svgPlaceholderProduto() {
  return `<svg class="placeholder-produto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>`;
}

function mostrarToast(mensagem, tipo = 'sucesso') {
  let toast = document.getElementById('ps-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ps-toast';
    toast.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(100px);
      background:${tipo === 'erro' ? '#ff4d4d' : '#b9ff2a'}; color:${tipo === 'erro' ? '#fff' : '#0a0b0d'};
      padding:14px 24px; border-radius:999px; font-weight:700; font-size:0.88rem; z-index:9999;
      box-shadow:0 10px 30px rgba(0,0,0,0.4); transition: transform .25s ease; max-width:90vw; text-align:center;`;
    document.body.appendChild(toast);
  }
  toast.style.background = tipo === 'erro' ? '#ff4d4d' : '#b9ff2a';
  toast.style.color = tipo === 'erro' ? '#fff' : '#0a0b0d';
  toast.textContent = mensagem;
  requestAnimationFrame(() => { toast.style.transform = 'translateX(-50%) translateY(0)'; });
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
  }, 3000);
}
