// ...new file...

const API_BASE = '/api/recipes'; // ajuste conforme rota do seu backend

// elementos
const postsGrid = document.getElementById('postsGrid');
const btnOpen = document.getElementById('btnOpenNewPost');
const modal = document.getElementById('newPostModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const form = document.getElementById('newPostForm');
const msgEl = document.getElementById('formMessage');

// helpers
function createCard(recipe) {
  const article = document.createElement('article');
  article.className = 'post-card';

  const hasImage = recipe.image && recipe.image.trim() !== '';
  if (hasImage) {
    const img = document.createElement('img');
    img.className = 'post-image';
    img.src = recipe.image;
    img.alt = recipe.title || 'Imagem da receita';
    article.appendChild(img);
  }

  const content = document.createElement('div');
  content.className = 'post-content';

  const h3 = document.createElement('h3');
  h3.className = 'post-title';
  h3.textContent = recipe.title || 'Sem título';

  const p = document.createElement('p');
  p.className = 'post-excerpt';
  p.textContent = recipe.excerpt || '';

  const meta = document.createElement('div');
  meta.className = 'post-meta';
  meta.textContent = recipe.author ? `Por ${recipe.author}` : 'Por Usuário';

  content.appendChild(h3);
  content.appendChild(p);
  content.appendChild(meta);

  article.appendChild(content);
  return article;
}

function renderRecipes(list) {
  postsGrid.innerHTML = '';
  if (!Array.isArray(list) || list.length === 0) {
    postsGrid.innerHTML = '<p style="color:#fff">Nenhuma receita encontrada.</p>';
    return;
  }
  list.forEach(r => postsGrid.appendChild(createCard(r)));
}

// fetch receitas do backend
async function loadRecipes() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Erro ao carregar receitas');
    const data = await res.json();
    renderRecipes(data);
    // tentar sincronizar pendências depois de carregar
    syncPending();
  } catch (err) {
    console.warn('Falha ao carregar do servidor, mostrando pendentes locais se houver.', err);
    const pending = JSON.parse(localStorage.getItem('recipes_pending') || '[]');
    renderRecipes(pending);
  }
}

// submit nova receita
async function submitRecipe(payload) {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Erro no servidor ao salvar receita');
    const saved = await res.json();
    // adicionar ao topo da lista
    postsGrid.prepend(createCard(saved));
    return { success: true, saved };
  } catch (err) {
    console.warn('Falha ao enviar, salvando localmente', err);
    // salvar pendente
    const pending = JSON.parse(localStorage.getItem('recipes_pending') || '[]');
    pending.unshift(payload);
    localStorage.setItem('recipes_pending', JSON.stringify(pending));
    return { success: false, error: err };
  }
}

// tentar sincronizar pendentes
async function syncPending() {
  const pending = JSON.parse(localStorage.getItem('recipes_pending') || '[]');
  if (!pending.length) return;
  const remaining = [];
  for (const p of pending) {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      if (!res.ok) throw new Error('sync failed');
      const saved = await res.json();
      postsGrid.prepend(createCard(saved));
    } catch (e) {
      remaining.push(p); // manter para próxima tentativa
    }
  }
  localStorage.setItem('recipes_pending', JSON.stringify(remaining));
}

// modal open/close
(function () {
  const openBtn = document.getElementById('btnOpenNewPost');
  const modal = document.getElementById('newPostModal');
  const backdrop = document.getElementById('modalBackdrop');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const form = document.getElementById('newPostForm');
  const firstField = document.getElementById('postTitle');

  if (!openBtn || !modal) return;

  function openModal() {
    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    // foco no primeiro campo
    if (firstField) firstField.focus();
    // listen for Escape while modal aberto
    document.addEventListener('keydown', onKeyDown);
  }

  function closeModal() {
    modal.classList.remove('modal-visible');
    modal.classList.add('modal-hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    openBtn.focus();
    document.removeEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  }

  // eventos
  openBtn.addEventListener('click', openModal);

  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  // evitar submit real (opcional); ajustar conforme sua lógica de envio
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // ...aqui você pode enviar via fetch/ajustar comportamento...
      // por enquanto apenas fecha o modal após "publicar"
      closeModal();
    });
  }
})();

// eventos
btnOpen.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('postTitle').value.trim();
  const image = document.getElementById('postImage').value.trim();
  const excerpt = document.getElementById('postExcerpt').value.trim();

  if (!title || !excerpt) {
    msgEl.textContent = 'Preencha título e descrição.';
    return;
  }

  const payload = {
    title,
    image,
    excerpt,
    author: 'Usuário', // ajuste conforme autenticação do seu sistema
    createdAt: new Date().toISOString(),
  };

  msgEl.textContent = 'Enviando...';
  const result = await submitRecipe(payload);
  if (result.success) {
    msgEl.textContent = 'Receita publicada.';
    setTimeout(closeModal, 700);
  } else {
    msgEl.textContent = 'Salvo localmente. Será sincronizado quando possível.';
    setTimeout(closeModal, 900);
  }
});

// inicialização
document.addEventListener('DOMContentLoaded', loadRecipes);
