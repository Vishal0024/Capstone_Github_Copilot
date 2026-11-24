const { execFileSync } = require('node:child_process');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const VALUE_OPTIONS = new Set([
  '-C',
  '-c',
  '--git-dir',
  '--work-tree',
  '--namespace',
  '--exec-path',
  '--config-env'
]);
const PUSH_VALUE_OPTIONS = new Set([
  '--repo',
  '--receive-pack',
  '--exec',
  '--push-option',
  '-o'
]);

function tokenize(command) {
  const segments = [];
  let segment = [];
  let token = '';
  let quote = null;

  function finishToken() {
    if (token) segment.push(token);
    token = '';
  }

  function finishSegment() {
    finishToken();
    if (segment.length) segments.push(segment);
    segment = [];
  }

  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];

    if (quote) {
      if (character === quote) {
        if (quote === "'" && command[index + 1] === "'") {
          token += "'";
          index += 1;
        } else {
          quote = null;
        }
      } else if (character === '\\' && quote === '"' && index + 1 < command.length) {
        token += command[index + 1];
        index += 1;
      } else {
        token += character;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ';' || character === '\n' || character === '\r' || character === '|' || character === '&') {
      finishSegment();
      while (index + 1 < command.length && [';', '|', '&'].includes(command[index + 1])) {
        index += 1;
      }
    } else if (/\s/.test(character)) {
      finishToken();
    } else {
      token += character;
    }
  }

  finishSegment();
  return segments;
}

function currentBranch() {
  try {
    return execFileSync('git', ['branch', '--show-current'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return null;
  }
}

function isProtectedRef(ref) {
  const normalized = ref.replace(/^\+/, '').replace(/^refs\/heads\//, '');
  return normalized === 'main' || normalized === 'master';
}

function parseGitInvocation(tokens) {
  let index = 0;
  while (index < tokens.length && VALUE_OPTIONS.has(tokens[index])) index += 2;
  while (index < tokens.length && tokens[index].startsWith('-')) index += 1;

  const subcommand = tokens[index];
  if (!subcommand) return null;
  return { subcommand, args: tokens.slice(index + 1) };
}

function checkPush(args) {
  const hasOption = option => args.some(argument => argument === option || argument.startsWith(`${option}=`));

  if (hasOption('--all') || hasOption('--mirror')) {
    return 'Pushes using --all or --mirror can include protected branches.';
  }
  if (
    hasOption('--force') ||
    hasOption('-f') ||
    hasOption('--force-with-lease') ||
    args.some(argument => argument.startsWith('+'))
  ) {
    return 'Force pushes are blocked to prevent overwriting remote history.';
  }

  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--') {
      positional.push(...args.slice(index + 1));
      break;
    }
    if (PUSH_VALUE_OPTIONS.has(argument)) {
      index += 1;
    } else if (argument.startsWith('-')) {
      continue;
    } else {
      positional.push(argument);
    }
  }

  const refs = positional.length > 1 ? positional.slice(1) : [];
  if (refs.some(refspec => isProtectedRef(refspec.includes(':') ? refspec.slice(refspec.lastIndexOf(':') + 1) : refspec))) {
    return 'Direct pushes to main/master are blocked. Push to a feature branch and open a pull request.';
  }

  if (refs.length === 0 || refs.some(refspec => refspec.endsWith(':HEAD') || refspec === 'HEAD')) {
    const branch = currentBranch();
    if (!branch) return 'Cannot verify the current branch; push is blocked for safety.';
    if (branch === 'main' || branch === 'master') {
      return 'Push from main/master is blocked. Push from a feature branch and open a pull request.';
    }
  }

  return null;
}

function checkGitCommand(tokens) {
  const invocation = parseGitInvocation(tokens);
  if (!invocation) return null;

  const { subcommand, args } = invocation;
  if (subcommand === 'push') return checkPush(args);

  if (subcommand === 'reset' && args.some(argument => ['--hard', '--merge', '--keep'].includes(argument))) {
    return 'Destructive git reset is blocked because it can discard local changes.';
  }

  if (subcommand === 'clean') {
    if (args.some(argument => argument === '--dry-run' || /^-[a-z]*n[a-z]*$/i.test(argument))) return null;
    if (args.some(argument => argument === '--force' || /^-[a-z]*f[a-z]*$/i.test(argument))) {
      return 'git clean with force is blocked because it permanently deletes untracked files.';
    }
  }

  if (
    subcommand === 'checkout' &&
    (
      args.includes('--') ||
      args.some(argument => ['.', '..', '-f', '--force'].includes(argument) ||
        argument.startsWith('./') || argument.startsWith('../'))
    )
  ) {
    return 'Destructive git checkout is blocked because it can discard local changes.';
  }

  if (
    subcommand === 'restore' &&
    (!args.includes('--staged') || args.includes('--worktree'))
  ) {
    return 'Working-tree git restore is blocked because it can discard local changes.';
  }

  if (
    subcommand === 'branch' &&
    (args.includes('-D') || args.includes('--delete') && args.includes('--force'))
  ) {
    return 'Forced branch deletion is blocked.';
  }

  if (subcommand === 'stash' && ['drop', 'pop', 'clear'].includes(args[0])) {
    return 'Deleting stashed changes is blocked.';
  }

  return null;
}

function analyzeSegment(tokens) {
  let index = 0;
  while (index < tokens.length) {
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[index]) ||
      ['call', 'sudo', 'env', 'time', 'command', 'nohup', 'exec'].includes(tokens[index].toLowerCase())) {
      index += 1;
      continue;
    }
    break;
  }

  const executable = (tokens[index] || '').split(/[\\/]/).pop().toLowerCase();
  if (/^git(?:\.exe)?$/.test(executable)) {
    return checkGitCommand(tokens.slice(index + 1));
  }

  if (['cmd', 'cmd.exe'].includes(executable)) {
    const commandIndex = tokens.findIndex((token, tokenIndex) =>
      tokenIndex > index && ['/c', '/k'].includes(token.toLowerCase())
    );
    if (commandIndex >= 0) return analyzeCommand(tokens.slice(commandIndex + 1).join(' '));
  }

  if (['powershell', 'powershell.exe', 'pwsh', 'pwsh.exe'].includes(executable)) {
    const commandIndex = tokens.findIndex((token, tokenIndex) =>
      tokenIndex > index && ['-c', '-command'].includes(token.toLowerCase())
    );
    if (commandIndex >= 0) return analyzeCommand(tokens.slice(commandIndex + 1).join(' '));
  }

  return null;
}

function analyzeCommand(command) {
  for (const segment of tokenize(command)) {
    const decision = analyzeSegment(segment);
    if (decision) return decision;
  }
  return null;
}

function findDecision(command) {
  return analyzeCommand(command);
}

function getCommandValues(value, parentKey = '') {
  if (typeof value === 'string') {
    return ['command', 'cmd', 'script'].includes(parentKey.toLowerCase()) ? [value] : [];
  }
  if (Array.isArray(value)) {
    return parentKey.toLowerCase() === 'command' && value.every(item => typeof item === 'string')
      ? [value.join(' ')]
      : value.flatMap(item => getCommandValues(item, parentKey));
  }
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => getCommandValues(child, key));
}

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);

  let event;
  try {
    event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('Copilot preToolUse hook received invalid JSON.');
  }

  const toolArgs = event.toolArgs ?? event.tool_input;
  const decision = getCommandValues(toolArgs)
    .map(findDecision)
    .find(Boolean);

  if (decision) {
    process.stdout.write(`${JSON.stringify({
      permissionDecision: 'deny',
      permissionDecisionReason: decision
    })}\n`);
  } else {
    process.stdout.write('{}\n');
  }
}

main().catch(error => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
