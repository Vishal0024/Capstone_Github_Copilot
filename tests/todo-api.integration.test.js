const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const request = require('supertest');

const app = require('../todoServer');
const usersFile = path.join(__dirname, '..', 'users.json');
const todosFile = path.join(__dirname, '..', 'todos.json');
const sessionsFile = path.join(__dirname, '..', 'sessions.json');

function snapshot(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function restore(file, content) {
  if (content === null) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } else {
    fs.writeFileSync(file, content);
  }
}

test('API auth and Not Found behavior', async t => {
  const before = [usersFile, todosFile, sessionsFile].map(snapshot);
  t.after(() => {
    [usersFile, todosFile, sessionsFile].forEach((file, index) => restore(file, before[index]));
  });

  fs.writeFileSync(usersFile, '[]');
  fs.writeFileSync(todosFile, '[]');
  fs.writeFileSync(sessionsFile, '{}');

  const email = `api-${Date.now()}@example.test`;
  await request(app).post('/signup').send({
    name: 'API Test',
    email,
    password: 'test-password'
  }).expect(201);

  const login = await request(app).post('/login').send({
    email,
    password: 'test-password'
  }).expect(200);

  await request(app).get('/todos')
    .set('Authorization', login.body.token)
    .expect(200);

  await request(app).get('/todos/999999')
    .set('Authorization', login.body.token)
    .expect(404);

  await request(app).post('/todos')
    .set('Authorization', login.body.token)
    .send({ title: '   ', description: 'Invalid', completed: false })
    .expect(400);

  await request(app).get('/todos')
    .expect(401);

  assert.equal(login.body.token.length > 0, true);
});

test('todo CRUD and filter endpoints cover success and missing cases', async t => {
  const before = [usersFile, todosFile, sessionsFile].map(snapshot);
  t.after(() => {
    [usersFile, todosFile, sessionsFile].forEach((file, index) => restore(file, before[index]));
  });

  fs.writeFileSync(usersFile, '[]');
  fs.writeFileSync(todosFile, '[]');
  fs.writeFileSync(sessionsFile, '{}');

  await request(app).post('/signup').send({
    name: 'CRUD Test',
    email: 'crud@example.test',
    password: 'password'
  }).expect(201);
  const login = await request(app).post('/login').send({
    email: 'crud@example.test',
    password: 'password'
  }).expect(200);
  const auth = login.body.token;
  const headers = { Authorization: auth };

  const created = await request(app).post('/todos')
    .set(headers)
    .send({ title: 'Test todo', description: 'Details', completed: false })
    .expect(201);

  const todos = JSON.parse(fs.readFileSync(todosFile, 'utf8'));
  todos.push(
    {
      id: 100,
      userId: 1,
      title: 'Alpha completed task',
      description: 'needle match',
      completed: true,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-02T00:00:00.000Z'
    },
    {
      id: 101,
      userId: 999,
      title: 'Alpha private task',
      description: 'needle match',
      completed: true,
      createdAt: '2030-01-01T00:00:00.000Z',
      updatedAt: '2030-01-02T00:00:00.000Z'
    }
  );
  fs.writeFileSync(todosFile, JSON.stringify(todos, null, 2));
  const scopedTodos = await request(app).get('/todos').set(headers).expect(200);
  assert.ok(Array.isArray(scopedTodos.body));
  assert.ok(scopedTodos.body.every(todo => todo.userId === 1));
  assert.equal(scopedTodos.body.some(todo => todo.id === 101), false);
  const searchedTodos = await request(app).get('/todos?search=needle&filter=completed')
    .set(headers).expect(200);
  assert.deepEqual(searchedTodos.body.map(todo => todo.id), [100]);
  const titleSorted = await request(app).get('/todos?sort=title').set(headers).expect(200);
  assert.deepEqual(titleSorted.body.map(todo => todo.title), [...titleSorted.body.map(todo => todo.title)].sort());
  const createdSorted = await request(app).get('/todos?sort=createdAt').set(headers).expect(200);
  assert.ok(new Date(createdSorted.body[0].createdAt) >= new Date(createdSorted.body.at(-1).createdAt));
  const updatedSorted = await request(app).get('/todos?sort=updatedAt').set(headers).expect(200);
  assert.ok(new Date(updatedSorted.body[0].updatedAt) >= new Date(updatedSorted.body.at(-1).updatedAt));

  await request(app).get(`/todos/${created.body.id}`).set(headers).expect(200);
  await request(app).get('/todos').query({ search: 'test' }).set(headers).expect(200);
  await request(app).get('/todos').query({ filter: 'active' }).set(headers).expect(200);
  await request(app).get('/todos').query({ filter: 'completed' }).set(headers).expect(200);
  await request(app).get('/todos').query({ sort: 'title' }).set(headers).expect(200);
  await request(app).get('/todos').query({ sort: 'createdAt' }).set(headers).expect(200);
  await request(app).get('/todos').query({ sort: 'updatedAt' }).set(headers).expect(200);

  await request(app).put(`/todos/${created.body.id}`)
    .set(headers)
    .send({ title: 'Updated todo', description: 'Updated details', completed: true })
    .expect(200);
  await request(app).patch(`/todos/${created.body.id}/toggle`).set(headers).expect(200);
  await request(app).delete(`/todos/${created.body.id}`).set(headers).expect(200);

  await request(app).put('/todos/999999')
    .set(headers)
    .send({ title: 'Missing', description: 'Missing', completed: false })
    .expect(404);
  await request(app).patch('/todos/999999/toggle').set(headers).expect(404);
  await request(app).delete('/todos/999999').set(headers).expect(404);
});
