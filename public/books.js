function renderBooks(container, books) {
  container.replaceChildren();
  for (const book of books) {
    const card = document.createElement('article');
    card.className = 'book-card';

    const title = document.createElement('h3');
    title.textContent = String(book.title ?? '');
    card.appendChild(title);

    for (const [label, value] of [
      ['Author', book.author],
      ['Genre', book.genre],
      ['Format', book.format],
      ['Language', book.language],
      ['Publication date', book.publicationDate],
      ['Average rating', book.averageRating]
    ]) {
      if (value === undefined || value === null || value === '') continue;
      const detail = document.createElement('p');
      detail.textContent = `${label}: ${String(value)}`;
      card.appendChild(detail);
    }

    container.appendChild(card);
  }
}

function showStatus(status, message, state = '') {
  status.textContent = message;
  if (state) status.dataset.state = state;
  else delete status.dataset.state;
}

async function initializeBooksPage() {
  const filtersContainer = document.getElementById('book-filters');
  const resultsContainer = document.getElementById('book-results');
  const status = document.getElementById('books-status');
  const genreButtons = Array.from(document.querySelectorAll('.genre-button'));
  let genre = 'non-fiction';
  let latestRequest = 0;
  const controls = new Map();

  function updateGenreButtons() {
    for (const button of genreButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.genre === genre));
    }
  }

  async function loadBooks() {
    const requestId = ++latestRequest;
    showStatus(status, 'Loading books…');
    const params = new URLSearchParams({ genre });
    for (const [key, control] of controls) {
      if (control.value) params.set(key, control.value);
    }

    try {
      const response = await fetch(`/api/books?${params.toString()}`);
      if (!response.ok) throw new Error('Book request failed.');
      const books = await response.json();
      if (requestId !== latestRequest) return;
      renderBooks(resultsContainer, books);
      if (books.length === 0) showStatus(status, 'No books match these filters.');
      else showStatus(status, `${books.length} book${books.length === 1 ? '' : 's'} found.`);
    } catch (error) {
      if (requestId !== latestRequest) return;
      showStatus(status, 'Books could not be loaded. Please try again.', 'error');
    }
  }

  try {
    const response = await fetch('/book-filter-options.json');
    if (!response.ok) throw new Error('Filter options unavailable.');
    const definition = await response.json();

    for (const category of definition.categories) {
      const label = document.createElement('label');
      label.className = 'filter-control';
      label.textContent = category.label;

      const select = document.createElement('select');
      select.name = category.key;
      const clearOption = document.createElement('option');
      clearOption.value = '';
      clearOption.textContent = 'All';
      select.appendChild(clearOption);

      for (const option of category.options) {
        const element = document.createElement('option');
        element.value = option.value;
        element.textContent = option.label;
        select.appendChild(element);
      }

      select.addEventListener('change', loadBooks);
      label.appendChild(select);
      filtersContainer.appendChild(label);
      controls.set(category.key, select);
    }

    for (const button of genreButtons) {
      button.addEventListener('click', () => {
        genre = button.dataset.genre;
        updateGenreButtons();
        return loadBooks();
      });
    }
    updateGenreButtons();
    await loadBooks();
  } catch (error) {
    showStatus(status, 'Filters could not be loaded. Please try again.', 'error');
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeBooksPage);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeBooksPage, renderBooks, showStatus };
}
