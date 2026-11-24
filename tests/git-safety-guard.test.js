const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const guardPath = path.join(__dirname, '..', '.github', 'hooks', 'git-safety-guard.cjs');

function runGuard(command, toolName = 'run_in_terminal') {
  const input = JSON.stringify({
    toolName,
    toolArgs: command === null ? {} : { command }
  });
  const result = spawnSync(process.execPath, [guardPath], {
    input,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('blocks explicit pushes to main and master, including refspec destinations', () => {
  for (const command of [
    'git push origin main',
    'git push origin HEAD:refs/heads/master',
    'git push origin :main',
    'cmd /c git push origin main',
    'powershell -NoProfile -Command "git push origin main"'
  ]) {
    assert.equal(runGuard(command).permissionDecision, 'deny', command);
  }
});

test('blocks broad and force pushes', () => {
  for (const command of [
    'git push --all origin',
    'git push --mirror origin',
    'git push --force origin feature/demo',
    'git push origin +HEAD:feature/demo'
  ]) {
    assert.equal(runGuard(command).permissionDecision, 'deny', command);
  }
});

test('allows an explicit feature branch push', () => {
  assert.deepEqual(runGuard('git push -u origin feature/demo'), {});
});

test('blocks destructive reset, clean, checkout, restore, branch, and stash commands', () => {
  for (const command of [
    'git reset --hard',
    'git clean -fd',
    'git checkout -- .',
    'git checkout .',
    'git restore public/script.js',
    'git branch -D feature/demo',
    'git stash clear',
    'git stash pop'
  ]) {
    assert.equal(runGuard(command).permissionDecision, 'deny', command);
  }
});

test('allows safe Git inspection and clean dry runs', () => {
  for (const command of ['git status --short', 'git diff', 'git clean -nd', 'git clean -nfd', 'echo "git reset --hard"']) {
    assert.deepEqual(runGuard(command), {}, command);
  }
});

test('does not make permission decisions for tools without shell commands', () => {
  assert.deepEqual(runGuard(null, 'read_file'), {});
});
