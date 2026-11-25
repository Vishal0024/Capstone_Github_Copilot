const fs = require('node:fs');
const path = require('node:path');

const filterOptions = require('./public/book-filter-options.json');
const CATALOG_FILE = path.join(__dirname, 'data', 'books.json');
const GENRES = new Set(['fiction', 'non-fiction']);
const FILTER_VALUES = new Map(
  filterOptions.categories.map(category => [
    category.key,
    new Set(category.options.map(option => option.value))
  ])
);
const DATE_WINDOWS = {
  'last-30-days': 30,
  'last-6-months': 180,
  'last-year': 365
};
const RATING_THRESHOLDS = {
  '4-plus': 4,
  '3-plus': 3
};

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validateCatalog(books) {
  if (!Array.isArray(books)) {
    throw new Error('Invalid catalog structure.');
  }

  const ids = new Set();
  for (const book of books) {
    if (!book || typeof book !== 'object' || Array.isArray(book)) {
      throw new Error('Invalid catalog record.');
    }
    if (
      typeof book.id !== 'string' || !book.id.trim() ||
      typeof book.title !== 'string' || !book.title.trim() ||
      typeof book.author !== 'string' || !book.author.trim() ||
      !GENRES.has(book.genre)
    ) {
      throw new Error('Invalid required catalog data.');
    }
    if (ids.has(book.id.trim())) {
      throw new Error('Duplicate catalog identifier.');
    }
    ids.add(book.id.trim());
  }
  return books;
}

function readCatalog(filePath = CATALOG_FILE) {
  const data = fs.readFileSync(filePath, 'utf8');
  return validateCatalog(JSON.parse(data));
}

function hasValidOptionalMetadata(book, key) {
  switch (key) {
    case 'format':
    case 'language':
      return FILTER_VALUES.get(key).has(book[key]);
    case 'publishedWithin':
      return isValidDate(book.publicationDate);
    case 'minRating':
      return typeof book.averageRating === 'number' &&
        Number.isFinite(book.averageRating) &&
        book.averageRating >= 0 &&
        book.averageRating <= 5;
    default:
      return false;
  }
}

function matchesPublicationWindow(value, publicationDate, now) {
  const days = DATE_WINDOWS[value];
  if (!days || !isValidDate(publicationDate)) return false;
  const reference = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(reference.getTime())) return false;

  const utcMidnight = Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate()
  );
  const cutoff = new Date(utcMidnight - days * 24 * 60 * 60 * 1000);
  const publicationTime = new Date(`${publicationDate}T00:00:00.000Z`).getTime();
  return publicationTime >= cutoff.getTime() && publicationTime <= utcMidnight;
}

function matchesFilter(book, key, value, now) {
  if (value === undefined) return true;
  if (!hasValidOptionalMetadata(book, key)) return false;

  switch (key) {
    case 'format':
    case 'language':
      return book[key] === value;
    case 'publishedWithin':
      return matchesPublicationWindow(value, book.publicationDate, now);
    case 'minRating':
      return book.averageRating >= RATING_THRESHOLDS[value];
    default:
      return false;
  }
}

function filterBooks(books, { genre, format, language, publishedWithin, minRating }, now = new Date()) {
  validateCatalog(books);
  if (!GENRES.has(genre)) return [];

  const filters = { format, language, publishedWithin, minRating };
  return books.filter(book =>
    book.genre === genre &&
    Object.entries(filters).every(([key, value]) => matchesFilter(book, key, value, now))
  );
}

function queryBooks({ genre, format, language, publishedWithin, minRating }, now = new Date()) {
  return filterBooks(readCatalog(), { genre, format, language, publishedWithin, minRating }, now);
}

function isValidFilterValue(key, value) {
  return FILTER_VALUES.get(key)?.has(value) === true;
}

module.exports = {
  CATALOG_FILE,
  FILTER_VALUES,
  GENRES,
  filterBooks,
  isValidDate,
  isValidFilterValue,
  queryBooks,
  readCatalog,
  validateCatalog
};
