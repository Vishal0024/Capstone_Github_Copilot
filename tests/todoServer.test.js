const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { after, test } = require('node:test');
const request = require('supertest');

const dataFiles = {
  todos: path.join(__dirname, 'todos.test-data.json'),
  users: path.join(__dirname, 'users.test-data.json'),
  sessions: path.join(__dirname, 'sessions.test-data.json'),
};

process.env.TODOS_FILE = dataFiles.todos;
process.env.USERS_FILE = dataFiles.users;
process.env.SESSIONS_FILE = dataFiles.sessions;

const app = require('../todoServer');

function resetDataFiles() {
  fs.writeFileSync(dataFiles.todos, '[]');
  fs.writeFileSync(dataFiles.users, '[]');
  fs.writeFileSync(dataFiles.sessions, '{}');
}

function removeDataFiles() {
  for (const file of Object.values(dataFiles)) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

after(removeDataFiles);

test('signup and login, protect todo routes, and support authenticated CRUD', async () => {
  resetDataFiles();

  const signup = await request(app)
    .post('/signup')
    .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });
  assert.equal(signup.status, 201);

  const invalidLogin = await request(app)
    .post('/login')
    .send({ email: 'test@example.com', password: 'incorrect' });
  assert.equal(invalidLogin.status, 401);

  const login = await request(app)
    .post('/login')
    .send({ email: 'test@example.com', password: 'password123' });
  assert.equal(login.status, 200);
  assert.equal(login.body.email, 'test@example.com');
  assert.ok(login.body.token);
  const token = login.body.token;

  const protectedRequests = [
    request(app).get('/todos'),
    request(app).get('/todos/1'),
    request(app).post('/todos').send({ title: 'Blocked', description: 'No token' }),
    request(app).put('/todos/1').send({ title: 'Blocked', description: 'No token', completed: false }),
    request(app).patch('/todos/1/toggle'),
    request(app).delete('/todos/1'),
  ];
  for (const response of await Promise.all(protectedRequests)) {
    assert.equal(response.status, 401);
  }

  const initialTodos = await request(app).get('/todos').set('Authorization', token);
  assert.equal(initialTodos.status, 200);
  assert.equal(initialTodos.body.length, 1);
  assert.equal(initialTodos.body[0].title, 'Welcome to your To-Do List!');

  const created = await request(app)
    .post('/todos')
    .set('Authorization', token)
    .send({ title: 'Buy milk', description: 'Two cartons', completed: false });
  assert.equal(created.status, 201);
  assert.equal(created.body.title, 'Buy milk');

  const fetched = await request(app)
    .get(`/todos/${created.body.id}`)
    .set('Authorization', token);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.body.description, 'Two cartons');

  const updated = await request(app)
    .put(`/todos/${created.body.id}`)
    .set('Authorization', token)
    .send({ title: 'Buy oat milk', description: 'One carton', completed: true });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.title, 'Buy oat milk');
  assert.equal(updated.body.completed, true);

  const deleted = await request(app)
    .delete(`/todos/${created.body.id}`)
    .set('Authorization', token);
  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.id, created.body.id);

  const missing = await request(app)
    .get(`/todos/${created.body.id}`)
    .set('Authorization', token);
  assert.equal(missing.status, 404);
});
