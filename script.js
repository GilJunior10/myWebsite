const SEARCH_HISTORY_KEY = 'searchHistory';

function getSearchHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Erro ao ler histórico de pesquisa:', error);
    return [];
  }
}

function saveSearchQuery(query) {
  if (typeof query !== 'string') return;
  const text = query.trim();
  if (!text) return;

  const history = getSearchHistory();
  if (history.length > 0 && history[history.length - 1] === text) {
    return;
  }

  history.push(text);
  while (history.length > 20) {
    history.shift();
  }

  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

function clearSearchHistory() {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}

window.getSearchHistory = getSearchHistory;
window.saveSearchQuery = saveSearchQuery;
window.clearSearchHistory = clearSearchHistory;