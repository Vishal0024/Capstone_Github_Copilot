const fs = require('node:fs');
const path = require('node:path');

const storyId = process.argv[2];
if (!storyId) {
  console.error('Usage: npm run docs:check -- <STORY-ID>');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const storyDir = path.join(root, 'docs', 'sdlc', storyId);
const required = [
  'requirements.md', 'architecture.md', 'design-review.md',
  'impl-plan.md', 'implementation-notes.md', 'code-review.md', 'verification.md'
];
let failed = false;

if (!/^[A-Z][A-Z0-9]+-[0-9]+$/.test(storyId)) {
  console.error(`Invalid story ID: ${storyId}`);
  failed = true;
}

for (const file of required) {
  const filePath = path.join(storyDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing required artifact: docs/sdlc/${storyId}/${file}`);
    failed = true;
  } else {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes(storyId)) {
      console.error(`Artifact does not reference story ID: ${file}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(`Documentation checks passed for ${storyId}.`);
