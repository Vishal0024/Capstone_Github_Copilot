const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

class TestElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.className = '';
    this._textContent = '';
    this._innerHTML = '';
  }

  set textContent(value) {
    this._textContent = String(value);
    this.children = [];
  }

  get textContent() {
    return this._textContent + this.children.map(child => child.textContent).join('');
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  append(...children) {
    children.forEach(child => this.appendChild(child));
  }

  after() {}
}

function createRenderer() {
  const output = new TestElement('div');
  const topBar = new TestElement('div');
  const sortSelect = new TestElement('select');
  sortSelect.selectedOptions = [{ text: 'Created' }];
  const document = {
    addEventListener() {},
    createElement(tagName) {
      return new TestElement(tagName);
    },
    getElementById(id) {
      return id === 'sort-select' ? sortSelect : null;
    },
    querySelector(selector) {
      if (selector === '.outputData') return output;
      if (selector === '.top-bar') return topBar;
      return null;
    }
  };
  const context = {
    document,
    localStorage: { getItem() { return null; } },
    window: { location: { origin: 'http://localhost' }, addEventListener() {} }
  };
  const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'script.js'), 'utf8');
  vm.runInNewContext(source, context);

  return {
    output,
    render(todos) {
      context.renderTodos(todos);
    }
  };
}

function findByTestId(element, testId) {
  if (element.getAttribute('data-testid') === testId) return element;
  for (const child of element.children) {
    const match = findByTestId(child, testId);
    if (match) return match;
  }
  return null;
}

function localDate(timestamp) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(timestamp));
}

function todo(createdAt, updatedAt) {
  return { title: 'Task', description: 'Details', createdAt, updatedAt };
}

test('renders valid dates as DD Mon YYYY in the runtime local timezone', () => {
  const renderer = createRenderer();
  const timestamp = '2026-10-05T00:30:00.000Z';
  renderer.render([todo(timestamp)]);

  const created = findByTestId(renderer.output, 'todo-created-at');
  assert.ok(created);
  assert.equal(created.textContent, `Created ${localDate(timestamp)}`);
  assert.match(created.textContent, /^Created \d{2} [A-Z][a-z]{2} \d{4}$/);
});

test('renders Edited only when the valid update time is strictly later', () => {
  for (const [createdAt, updatedAt, expected] of [
    ['2026-10-05T00:30:00Z', '2026-10-06T00:30:00Z', true],
    ['2026-10-05T00:30:00Z', '2026-10-05T00:30:00Z', false],
    ['2026-10-06T00:30:00Z', '2026-10-05T00:30:00Z', false]
  ]) {
    const renderer = createRenderer();
    renderer.render([todo(createdAt, updatedAt)]);

    const edited = findByTestId(renderer.output, 'todo-edited-at');
    assert.equal(Boolean(edited), expected);
    if (expected) assert.equal(edited.textContent, `Edited ${localDate(updatedAt)}`);
  }
});

test('invalid creation values show the fallback and never render Edited', () => {
  const invalidValues = [
    ['missing', undefined],
    ['null', null],
    ['empty', ''],
    ['whitespace-only', ' \t\n '],
    ['non-string number', 123],
    ['non-string object', { value: '2026-10-05' }],
    ['unparsable', 'not a date']
  ];

  for (const [label, createdAt] of invalidValues) {
    const renderer = createRenderer();
    const item = todo(createdAt, '2026-10-06T00:30:00Z');
    if (label === 'missing') delete item.createdAt;
    renderer.render([item]);

    assert.equal(findByTestId(renderer.output, 'todo-created-at').textContent, 'Created: Not available', label);
    assert.equal(findByTestId(renderer.output, 'todo-edited-at'), null, label);
  }
});

test('missing, invalid, and non-string update values omit Edited', () => {
  const invalidValues = [
    ['missing', undefined],
    ['null', null],
    ['empty', ''],
    ['whitespace-only', '  '],
    ['non-string', 456],
    ['unparsable', 'not a date']
  ];

  for (const [label, updatedAt] of invalidValues) {
    const renderer = createRenderer();
    const item = todo('2026-10-05T00:30:00Z', updatedAt);
    if (label === 'missing') delete item.updatedAt;
    renderer.render([item]);

    assert.equal(findByTestId(renderer.output, 'todo-edited-at'), null, label);
  }

  const renderer = createRenderer();
  renderer.render([todo('invalid creation', '2026-10-06T00:30:00Z')]);
  assert.equal(findByTestId(renderer.output, 'todo-edited-at'), null);
});

test('malformed timestamp text cannot inject markup or stop later cards rendering', () => {
  const renderer = createRenderer();
  renderer.render([
    todo('<img src=x onerror=alert(1)>', '2026-10-06T00:30:00Z'),
    todo('2026-10-05T00:30:00Z', '2026-10-06T00:30:00Z')
  ]);

  assert.equal(renderer.output.children.length, 2);
  assert.equal(findByTestId(renderer.output.children[0], 'todo-created-at').textContent, 'Created: Not available');
  assert.equal(renderer.output.children[0].children[3].children.length, 1);
  assert.equal(findByTestId(renderer.output.children[1], 'todo-created-at').textContent, `Created ${localDate('2026-10-05T00:30:00Z')}`);
  assert.equal(findByTestId(renderer.output.children[1], 'todo-edited-at').textContent, `Edited ${localDate('2026-10-06T00:30:00Z')}`);
});
