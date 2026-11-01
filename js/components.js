/**
 * Componentes compartilhados de layout: header, menu mobile, bottom nav,
 * botão de WhatsApp e footer. Injetados via JS para evitar duplicar HTML
 * em todas as páginas (componentização pedida no escopo do projeto).
 */
let CONFIG_LOJA = {};

async function carregarConfigLoja() {
  try {
    const resposta = await Api.get('/config');
    CONFIG_LOJA = resposta.config || {};
  } catch (e) {
    CONFIG_LOJA = { nome_loja: 'PowerSupps' };
  }
  return CONFIG_LOJA;
}

function montarLogoHtml() {
  const nome = CONFIG_LOJA.nome_loja || 'PowerSupps';
  const meio = Math.max(1, nome.length - 4);
  return `${esc(nome.slice(0, meio))}<span>${esc(nome.slice(meio))}</span>`;
}

function montarHeader(paginaAtiva = '') {
  const el = document.getElementById('ps-header');
  if (!el) return;

  const linkAtivo = (nome) => (paginaAtiva === nome ? 'ativo' : '');
  const logado = !!localStorage.getItem('ps_token_cliente');

  el.innerHTML = `
    <div class="container">
      <div class="header__linha-top">
        <button class="btn-menu-mobile" id="btn-abrir-menu" aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
        <a href="index.html" class="logo">${montarLogoHtml()}</a>
        <form class="header__busca" id="form-busca-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="search" name="q" placeholder="Buscar suplementos...">
        </form>
        <div class="header__acoes">
          <button class="btn-busca-mobile" id="btn-busca-mobile" aria-label="Buscar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <a href="${logado ? 'minha-conta.html' : 'login.html'}" class="icone-acao" aria-label="Conta" style="display:none" id="link-conta-desktop">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
          </a>
          <a href="carrinho.html" class="icone-acao" aria-label="Carrinho">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
            <span class="contador js-contador-carrinho" style="display:none">0</span>
          </a>
        </div>
      </div>
      <nav class="nav-desktop">
        <a href="index.html" class="${linkAtivo('inicio')}">Início</a>
        <a href="produtos.html" class="${linkAtivo('produtos')}">Produtos</a>
        <a href="produtos.html" class="${linkAtivo('categorias')}">Categorias</a>
        <a href="produtos.html?ofertas=1" class="${linkAtivo('ofertas')}">Ofertas</a>
        <a href="index.html#sobre" class="${linkAtivo('sobre')}">Sobre</a>
        <a href="index.html#contato" class="${linkAtivo('contato')}">Contato</a>
        <a href="${logado ? 'minha-conta.html' : 'login.html'}" class="${linkAtivo('conta')}">Minha Conta</a>
      </nav>
    </div>
  `;

  const buscaEl = el.querySelector('#form-busca-header');
  buscaEl.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const q = new FormData(buscaEl).get('q');
    window.location.href = `produtos.html?busca=${encodeURIComponent(q)}`;
  });

  document.getElementById('btn-abrir-menu')?.addEventListener('click', abrirMenuMobile);
  document.getElementById('btn-busca-mobile')?.addEventListener('click', () => {
    const q = prompt('O que você está procurando?');
    if (q) window.location.href = `produtos.html?busca=${encodeURIComponent(q)}`;
  });

  Carrinho.atualizarContador();
  montarMenuMobile(paginaAtiva);
  montarBottomNav(paginaAtiva);
}

function montarMenuMobile() {
  if (document.getElementById('ps-menu-mobile')) return;
  const logado = !!localStorage.getItem('ps_token_cliente');
  const div = document.createElement('div');
  div.className = 'menu-mobile';
  div.id = 'ps-menu-mobile';
  div.innerHTML = `
    <div class="menu-mobile__painel">
      <button class="btn-secundario btn-sm mb-3" id="btn-fechar-menu">Fechar ✕</button>
      <a href="index.html">Início</a>
      <a href="produtos.html">Produtos</a>
      <a href="produtos.html?ofertas=1">Ofertas</a>
      <a href="index.html#sobre">Sobre</a>
      <a href="index.html#contato">Contato</a>
      <a href="${logado ? 'minha-conta.html' : 'login.html'}">${logado ? 'Minha Conta' : 'Entrar / Criar conta'}</a>
    </div>`;
  document.body.appendChild(div);
  div.addEventListener('click', (ev) => { if (ev.target === div) fecharMenuMobile(); });
  document.getElementById('btn-fechar-menu').addEventListener('click', fecharMenuMobile);
}
function abrirMenuMobile() { document.getElementById('ps-menu-mobile')?.classList.add('aberto'); }
function fecharMenuMobile() { document.getElementById('ps-menu-mobile')?.classList.remove('aberto'); }

function montarBottomNav(paginaAtiva) {
  if (document.getElementById('ps-bottom-nav')) return;
  const logado = !!localStorage.getItem('ps_token_cliente');
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.id = 'ps-bottom-nav';
  const item = (href, label, ativa, svg) =>
    `<a href="${href}" class="${paginaAtiva === ativa ? 'ativo' : ''}">${svg}${label}</a>`;
  nav.innerHTML = `
    ${item('index.html', 'Início', 'inicio', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>')}
    ${item('produtos.html', 'Produtos', 'produtos', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>')}
    <a href="carrinho.html" class="${paginaAtiva === 'carrinho' ? 'ativo' : ''}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
      Carrinho
      <span class="contador js-contador-carrinho" style="display:none">0</span>
    </a>
    ${item(logado ? 'minha-conta.html' : 'login.html', 'Conta', 'conta', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>')}
  `;
  document.body.appendChild(nav);
}

function montarWhatsapp(mensagem) {
  if (document.getElementById('ps-whatsapp')) return;
  const numero = CONFIG_LOJA.whatsapp || '5595999990000';
  const texto = encodeURIComponent(mensagem || `Olá! Vim pelo site da ${CONFIG_LOJA.nome_loja || 'loja'} e gostaria de mais informações.`);
  const a = document.createElement('a');
  a.id = 'ps-whatsapp';
  a.className = 'whatsapp-flutuante';
  a.href = `https://wa.me/${encodeURIComponent(String(numero).replace(/\D/g, ''))}?text=${texto}`;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', 'Falar no WhatsApp');
  a.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2m0 1.67c2.24 0 4.35.87 5.93 2.46a8.3 8.3 0 0 1 2.45 5.92c0 4.61-3.76 8.36-8.38 8.36-1.4 0-2.78-.36-4-1.03l-.29-.16-3.12.82.84-3.04-.19-.32a8.26 8.26 0 0 1-1.26-4.42c0-4.61 3.76-8.36 8.4-8.36m4.62 12.63c-.2.55-1.15 1.05-1.6 1.11-.42.06-.94.09-1.52-.1-.35-.11-.8-.26-1.38-.5-2.42-1.05-4-3.47-4.12-3.63-.12-.16-.99-1.31-.99-2.5s.62-1.77.84-2.02c.22-.24.48-.3.64-.3l.46.01c.15.01.34-.06.53.4.2.48.68 1.66.74 1.78.06.12.1.27.02.43-.08.16-.12.27-.24.41-.12.15-.25.33-.36.44-.12.12-.25.25-.1.5.14.24.64 1.05 1.37 1.7.94.84 1.74 1.1 1.98 1.22.24.12.38.1.53-.06.14-.16.62-.72.79-.97.16-.24.33-.2.55-.12.22.08 1.42.67 1.67.79.24.12.4.18.46.29.06.1.06.6-.14 1.15Z"/></svg>`;
  document.body.appendChild(a);
}

function montarFooter() {
  const el = document.getElementById('ps-footer');
  if (!el) return;
  el.innerHTML = `
    <div class="container">
      <div class="footer__grid">
        <div>
          <p class="logo mb-2">${esc(CONFIG_LOJA.nome_loja || 'PowerSupps')}</p>
          <p class="txt-cinza" style="max-width:280px;font-size:.85rem">${esc(CONFIG_LOJA.endereco_loja || '')}</p>
          <p class="txt-cinza mt-1" style="font-size:.85rem">${esc(CONFIG_LOJA.horario_funcionamento || '')}</p>
        </div>
        <div>
          <h4>Institucional</h4>
          <ul><li><a href="index.html#sobre">Sobre nós</a></li><li><a href="index.html#contato">Contato</a></li><li><a href="produtos.html">Produtos</a></li></ul>
        </div>
        <div>
          <h4>Minha Conta</h4>
          <ul><li><a href="login.html">Entrar</a></li><li><a href="minha-conta.html">Meus pedidos</a></li><li><a href="carrinho.html">Carrinho</a></li></ul>
        </div>
        <div>
          <h4>Contato</h4>
          <ul>
            <li><a href="tel:${esc((CONFIG_LOJA.telefone || '').replace(/[^\d+]/g, ''))}">${esc(CONFIG_LOJA.telefone || '')}</a></li>
            <li><a href="https://instagram.com/${encodeURIComponent((CONFIG_LOJA.instagram || '').replace('@',''))}" target="_blank" rel="noopener">${esc(CONFIG_LOJA.instagram || '')}</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__base">© ${new Date().getFullYear()} ${esc(CONFIG_LOJA.nome_loja || 'PowerSupps')}. Loja de demonstração — produtos fictícios, não comercializados de fato.</div>
    </div>
  `;
}

async function iniciarLayout(paginaAtiva) {
  await carregarConfigLoja();
  montarHeader(paginaAtiva);
  montarFooter();
  montarWhatsapp();
}
