/**
 * Layout e proteção de rota compartilhados por todas as páginas do
 * painel administrativo (/pages/admin/*).
 */
function exigirLoginAdmin() {
  const token = localStorage.getItem('ps_token_admin');
  if (!token) { window.location.href = 'login.html'; return null; }
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    window.location.href = 'login.html';
    return null;
  }
}

function montarSidebarAdmin(paginaAtiva, usuario) {
  const el = document.getElementById('admin-sidebar');
  if (!el) return;
  const itens = [
    { id: 'dashboard', href: 'index.html', label: 'Dashboard', icone: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>' },
    { id: 'produtos', href: 'produtos.html', label: 'Produtos', icone: '<path d="M20 8v13H4V8M2 3h20v5H2z"/><path d="M10 12h4"/>' },
    { id: 'pedidos', href: 'pedidos.html', label: 'Pedidos', icone: '<path d="M16 3H8a2 2 0 0 0-2 2v16l6-3 6 3V5a2 2 0 0 0-2-2Z"/>' },
    { id: 'clientes', href: 'clientes.html', label: 'Clientes', icone: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
    { id: 'configuracoes', href: 'configuracoes.html', label: 'Configurações', icone: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>' }
  ];

  el.innerHTML = `
    <div class="logo">Power<span>Supps</span> <span class="badge badge-status" style="margin-left:6px">Admin</span></div>
    <nav>
      ${itens.map((i) => `<a href="${i.href}" class="${paginaAtiva === i.id ? 'ativo' : ''}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${i.icone}</svg> ${i.label}</a>`).join('')}
    </nav>
    <div class="sair">
      <p class="txt-cinza" style="font-size:.78rem;margin-bottom:8px">${esc(usuario?.nome || '')} · ${esc(usuario?.papel || '')}</p>
      <a href="#" id="btn-sair-admin" style="color:var(--vermelho);font-weight:600;font-size:.85rem">Sair do painel</a>
    </div>
  `;

  document.getElementById('btn-sair-admin').addEventListener('click', (ev) => {
    ev.preventDefault();
    localStorage.removeItem('ps_token_admin');
    window.location.href = 'login.html';
  });
}

async function iniciarAdmin(paginaAtiva) {
  const usuario = exigirLoginAdmin();
  if (!usuario) return null;
  montarSidebarAdmin(paginaAtiva, usuario);
  return usuario;
}

function badgeStatus(status) {
  return `<span class="status-pill status-${esc(status)}">${esc(rotuloStatus(status))}</span>`;
}
