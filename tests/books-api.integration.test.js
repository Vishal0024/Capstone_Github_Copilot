const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');

const app = require('../todoServer');
const bookCatalog = require('../bookCatalog');

test('books page and API are public and the page starts in the Non-Fiction scope', async () => {
  const page = await request(app).get('/books').expect(200).expect('Content-Type', /html/);
  assert.match(page.text, /data-genre="non-fiction" aria-pressed="true">Non-Fiction/);
  assert.match(page.text, /\/books\.js/);

  const response = await request(app).get('/api/books?genre=non-fiction').expect(200);
  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length > 0);
  assert.ok(response.body.every(book => book.genre === 'non-fiction'));
});

test('books API validates required, unknown, repeated, and multi-value query parameters', async () => {
  await request(app).get('/api/books').expect(400);
  await request(app).get('/api/books?genre=other').expect(400);
  await request(app).get('/api/books?genre=fiction&format=invalid').expect(400);
  await request(app).get('/api/books?genre=fiction&unknown=value').expect(400);
  await request(app).get('/api/books?genre=fiction&format=ebook&format=paperback').expect(400);
  await request(app).get('/api/books?genre=fiction&format=ebook,paperback').expect(400);
  await request(app).get('/api/books?genre=fiction&minRating=4').expect(400);
});

test('books API applies individual and combined filters with AND and omitted filters clear individually', async () => {
  const all = await request(app).get('/api/books?genre=non-fiction').expect(200);
  const paperback = await request(app).get('/api/books?genre=non-fiction&format=paperback').expect(200);
  const english = await request(app).get('/api/books?genre=non-fiction&language=en').expect(200);
  const recent = await request(app).get('/api/books?genre=non-fiction&publishedWithin=last-year').expect(200);
  const highRated = await request(app).get('/api/books?genre=non-fiction&minRating=4-plus').expect(200);
  const narrow = await request(app)
    .get('/api/books?genre=non-fiction&language=en&format=paperback&minRating=4-plus')
    .expect(200);
  const clearedFormat = await request(app).get('/api/books?genre=non-fiction&language=en').expect(200);

  assert.ok(all.body.length > english.body.length);
  assert.deepEqual(clearedFormat.body, english.body);
  assert.ok(paperback.body.every(book => book.format === 'paperback'));
  assert.ok(recent.body.length < all.body.length);
  assert.ok(recent.body.every(book => /^\d{4}-\d{2}-\d{2}$/.test(book.publicationDate)));
  assert.ok(highRated.body.every(book => book.averageRating >= 4));
  assert.deepEqual(narrow.body.map(book => book.id), ['sample-nonfiction-1']);
  assert.ok(narrow.body.every(book =>
    book.language === 'en' && book.format === 'paperback' && book.averageRating >= 4
  ));
});

test('valid book queries return an empty array when no records match', async () => {
  const response = await request(app)
    .get('/api/books?genre=non-fiction&format=hardcover&language=fr')
    .expect(200);
  assert.deepEqual(response.body, []);
});

test('catalog failures return a generic server error without exposing details', async t => {
  const originalQueryBooks = bookCatalog.queryBooks;
  t.after(() => {
    bookCatalog.queryBooks = originalQueryBooks;
  });
  bookCatalog.queryBooks = () => {
    throw new Error('Sensitive catalog path: C:\\private\\books.json');
  };

  const response = await request(app).get('/api/books?genre=fiction').expect(500);
  assert.deepEqual(response.body, { error: 'Unable to retrieve books.' });
  assert.doesNotMatch(JSON.stringify(response.body), /private|books\.json/i);
});

test('root To-Do page remains available without affecting the separate books page', async () => {
  const response = await request(app).get('/').expect(200).expect('Content-Type', /html/);
  assert.match(response.text, /To-Do/i);
  assert.doesNotMatch(response.text, /book-filter-options/);
});
