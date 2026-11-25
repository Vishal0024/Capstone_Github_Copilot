const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const bookCatalog = require('../bookCatalog');
const filterDefinition = require('../public/book-filter-options.json');
const { renderBooks } = require('../public/books');

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.value = '';
  }

  appendChild(child) {
    this.children.push(child);
  }

  replaceChildren(...children) {
    this.children = children;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  addEventListener(name, callback) {
    this.listeners[name] = callback;
  }

  async trigger(name) {
    if (this.listeners[name]) return this.listeners[name]();
  }
}

function book(overrides = {}) {
  return {
    id: 'book-1',
    title: 'A Sample Book',
    author: 'A. Writer',
    genre: 'non-fiction',
    format: 'hardcover',
    language: 'en',
    publicationDate: '2026-06-01',
    averageRating: 4,
    ...overrides
  };
}

function utcDateOffset(reference, days) {
  const date = new Date(reference);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function withTemporaryCatalog(content, run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'book-catalog-'));
  const file = path.join(directory, 'books.json');
  try {
    fs.writeFileSync(file, content);
    return run(file);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test('shared options preserve the exact labels and tokens for both genres', () => {
  const expected = [
    ['format', 'Book Format', [
      ['hardcover', 'hardcover'], ['paperback', 'paperback'], ['ebook', 'eBook'], ['audiobook', 'audiobook']
    ]],
    ['language', 'Language', [
      ['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German']
    ]],
    ['publishedWithin', 'Publication Date', [
      ['last-30-days', 'last 30 days'], ['last-6-months', 'last 6 months'], ['last-year', 'last year']
    ]],
    ['minRating', 'Customer Reviews', [
      ['4-plus', '4-stars and above'], ['3-plus', '3-stars and above']
    ]]
  ];
  assert.deepEqual(filterDefinition.categories.map(category => [
    category.key,
    category.label,
    category.options.map(option => [option.value, option.label])
  ]), expected);
  assert.equal(bookCatalog.isValidFilterValue('format', 'ebook'), true);
  assert.equal(bookCatalog.isValidFilterValue('format', 'digital'), false);
});

test('catalog validation accepts a valid catalog and fails closed on invalid shape or required fields', () => {
  const valid = [book()];
  assert.equal(bookCatalog.validateCatalog(valid), valid);
  assert.deepEqual(bookCatalog.validateCatalog([]), []);
  for (const invalid of [
    {},
    null,
    [null],
    [[]],
    [book({ id: '' })],
    [book({ title: '   ' })],
    [book({ author: null })],
    [book({ genre: 'memoir' })],
    [book(), book({ id: ' book-1 ' })]
  ]) {
    assert.throws(() => bookCatalog.validateCatalog(invalid));
  }
});

test('catalog reading rejects malformed JSON and invalid top-level data', () => {
  withTemporaryCatalog('{ invalid', file => {
    assert.throws(() => bookCatalog.readCatalog(file), SyntaxError);
  });
  withTemporaryCatalog('{"not":"an array"}', file => {
    assert.throws(() => bookCatalog.readCatalog(file), /Invalid catalog structure/);
  });
});

test('each supported filter matches records and selected categories combine with AND', () => {
  const books = [
    book({ id: 'hardcover-en', publicationDate: '2026-06-20', averageRating: 4.5 }),
    book({
      id: 'ebook-es',
      format: 'ebook',
      language: 'es',
      publicationDate: '2026-05-01',
      averageRating: 3
    }),
    book({ id: 'fiction', genre: 'fiction' })
  ];
  const now = new Date('2026-07-01T00:00:00.000Z');

  assert.deepEqual(bookCatalog.filterBooks(books, { genre: 'non-fiction', format: 'hardcover' }, now)
    .map(item => item.id), ['hardcover-en']);
  assert.deepEqual(bookCatalog.filterBooks(books, { genre: 'non-fiction', language: 'es' }, now)
    .map(item => item.id), ['ebook-es']);
  assert.deepEqual(bookCatalog.filterBooks(books, {
    genre: 'non-fiction', publishedWithin: 'last-6-months'
  }, now).map(item => item.id), ['hardcover-en', 'ebook-es']);
  assert.deepEqual(bookCatalog.filterBooks(books, {
    genre: 'non-fiction', minRating: '4-plus'
  }, now).map(item => item.id), ['hardcover-en']);
  assert.deepEqual(bookCatalog.filterBooks(books, {
    genre: 'non-fiction', format: 'ebook', language: 'es', minRating: '3-plus'
  }, now).map(item => item.id), ['ebook-es']);
  assert.deepEqual(bookCatalog.filterBooks(books, { genre: 'non-fiction', format: 'ebook', language: 'en' }, now), []);
  assert.deepEqual(bookCatalog.filterBooks(books, { genre: 'fiction' }, now).map(item => item.id), ['fiction']);
  assert.deepEqual(bookCatalog.filterBooks(books, { genre: 'unknown' }, now), []);
});

test('publication windows use deterministic UTC cutoffs inclusive of the cutoff date', () => {
  const reference = new Date('2026-07-01T15:45:00.000Z');
  for (const [value, days] of [
    ['last-30-days', 30],
    ['last-6-months', 180],
    ['last-year', 365]
  ]) {
    const cutoff = utcDateOffset('2026-07-01T00:00:00.000Z', days);
    const dayBefore = utcDateOffset(`${cutoff}T00:00:00.000Z`, 1);
    const results = bookCatalog.filterBooks([
      book({ id: 'cutoff', publicationDate: cutoff }),
      book({ id: 'before', publicationDate: dayBefore }),
      book({ id: 'future', publicationDate: '2026-07-02' })
    ], { genre: 'non-fiction', publishedWithin: value }, reference);
    assert.deepEqual(results.map(item => item.id), ['cutoff'], value);
  }
});

test('rating thresholds are inclusive and unrated books do not match an active rating filter', () => {
  const books = [
    book({ id: 'exact-four', averageRating: 4 }),
    book({ id: 'above-four', averageRating: 4.1 }),
    book({ id: 'exact-three', averageRating: 3 }),
    book({ id: 'below-three', averageRating: 2.99 }),
    book({ id: 'unrated', averageRating: undefined })
  ];
  assert.deepEqual(bookCatalog.filterBooks(books, { genre: 'non-fiction', minRating: '4-plus' })
    .map(item => item.id), ['exact-four', 'above-four']);
  assert.deepEqual(bookCatalog.filterBooks(books, { genre: 'non-fiction', minRating: '3-plus' })
    .map(item => item.id), ['exact-four', 'above-four', 'exact-three']);
  assert.deepEqual(bookCatalog.filterBooks(books, { genre: 'non-fiction' }).map(item => item.id),
    ['exact-four', 'above-four', 'exact-three', 'below-three', 'unrated']);
});

test('missing and invalid optional metadata only exclude records when that category is active', () => {
  const books = [
    book({ id: 'missing', format: undefined, language: undefined, publicationDate: undefined, averageRating: undefined }),
    book({ id: 'invalid', format: 'unlisted', language: 42, publicationDate: '2026-02-30', averageRating: '4' }),
    book({ id: 'valid', format: 'ebook', language: 'fr', publicationDate: '2026-06-20', averageRating: 4 })
  ];
  const genreOnly = bookCatalog.filterBooks(books, { genre: 'non-fiction' });
  assert.deepEqual(genreOnly.map(item => item.id), ['missing', 'invalid', 'valid']);

  for (const filters of [
    { format: 'ebook' },
    { language: 'fr' },
    { publishedWithin: 'last-year' },
    { minRating: '4-plus' }
  ]) {
    assert.deepEqual(bookCatalog.filterBooks(books, { genre: 'non-fiction', ...filters })
      .map(item => item.id), ['valid']);
  }

  assert.equal(bookCatalog.isValidDate('2026-02-28'), true);
  assert.equal(bookCatalog.isValidDate('2026-02-30'), false);
  assert.equal(bookCatalog.isValidDate('2026-2-03'), false);
});

test('catalog-controlled markup-like values are rendered literally as text', t => {
  const previousDocument = global.document;
  const createdElements = [];
  function fakeElement(tagName) {
    const element = {
      tagName,
      children: [],
      dataset: {},
      appendChild(child) {
        this.children.push(child);
      },
      replaceChildren(...children) {
        this.children = children;
      }
    };
    Object.defineProperty(element, 'innerHTML', {
      set() {
        throw new Error('innerHTML must not be used for catalog values.');
      }
    });
    createdElements.push(element);
    return element;
  }
  global.document = { createElement: fakeElement };
  t.after(() => {
    if (previousDocument === undefined) delete global.document;
    else global.document = previousDocument;
  });

  const container = fakeElement('div');
  const hostileText = '<img src=x onerror=alert(1)>';
  renderBooks(container, [book({
    title: hostileText,
    author: hostileText,
    genre: hostileText,
    format: hostileText,
    language: hostileText,
    publicationDate: hostileText,
    averageRating: hostileText
  })]);

  const renderedText = createdElements.flatMap(element => [
    element.textContent,
    ...element.children.map(child => child.textContent)
  ]).filter(Boolean);
  assert.ok(renderedText.includes(hostileText));
  assert.ok(renderedText.includes(`Author: ${hostileText}`));
  assert.equal(container.children[0].tagName, 'article');
});

test('book page client smoke flow keeps shared options, selections, empty state, and recoverable errors', async t => {
  const { initializeBooksPage } = require('../public/books');
  const previousDocument = global.document;
  const previousFetch = global.fetch;
  const filters = new FakeElement('div');
  const results = new FakeElement('div');
  const status = new FakeElement('p');
  const genreButtons = ['fiction', 'non-fiction'].map(genre => {
    const button = new FakeElement('button');
    button.dataset.genre = genre;
    return button;
  });
  const elements = {
    'book-filters': filters,
    'book-results': results,
    'books-status': status
  };
  const requests = [];
  let responseMode = 'books';
  global.document = {
    createElement: tagName => new FakeElement(tagName),
    getElementById: id => elements[id],
    querySelectorAll: selector => selector === '.genre-button' ? genreButtons : []
  };
  global.fetch = async url => {
    if (url === '/book-filter-options.json') {
      return { ok: true, json: async () => filterDefinition };
    }
    requests.push(url);
    if (responseMode === 'error') return { ok: false };
    return {
      ok: true,
      json: async () => responseMode === 'empty' ? [] : [book()]
    };
  };
  t.after(() => {
    if (previousDocument === undefined) delete global.document;
    else global.document = previousDocument;
    if (previousFetch === undefined) delete global.fetch;
    else global.fetch = previousFetch;
  });

  await initializeBooksPage();
  assert.match(requests[0], /genre=non-fiction/);
  assert.equal(genreButtons[1].attributes['aria-pressed'], 'true');
  const controls = new Map(filters.children.map(label => [label.children[0].name, label.children[0]]));
  assert.deepEqual([...controls.keys()], ['format', 'language', 'publishedWithin', 'minRating']);
  assert.deepEqual(controls.get('format').children.map(option => [option.value, option.textContent]), [
    ['', 'All'],
    ...filterDefinition.categories[0].options.map(option => [option.value, option.label])
  ]);

  controls.get('format').value = 'ebook';
  await controls.get('format').trigger('change');
  controls.get('language').value = 'en';
  await controls.get('language').trigger('change');
  assert.match(requests.at(-1), /format=ebook/);
  assert.match(requests.at(-1), /language=en/);
  controls.get('format').value = '';
  await controls.get('format').trigger('change');
  assert.doesNotMatch(requests.at(-1), /format=/);
  assert.match(requests.at(-1), /language=en/);

  responseMode = 'empty';
  await controls.get('language').trigger('change');
  assert.equal(status.textContent, 'No books match these filters.');
  responseMode = 'error';
  await controls.get('language').trigger('change');
  assert.match(status.textContent, /could not be loaded/i);
  assert.equal(status.dataset.state, 'error');
  assert.equal(controls.get('language').value, 'en');

  responseMode = 'books';
  await genreButtons[0].trigger('click');
  assert.match(requests.at(-1), /genre=fiction/);
  assert.match(requests.at(-1), /language=en/);
  assert.equal(genreButtons[0].attributes['aria-pressed'], 'true');
  assert.equal(controls.get('format').children[1].textContent, 'hardcover');
});
