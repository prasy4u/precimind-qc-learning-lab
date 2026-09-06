#!/usr/bin/env node
/* =========================================================================
   v09/tools/hash-build-tree.cjs

   Stage 11C1 — Deterministic Build-Tree Hasher
   Artifact Class: V09_TEST

   Computes a deterministic SHA-256 digest representing an entire production
   build tree, insensitive to filesystem/directory-traversal ordering.

   ALGORITHM (documented for auditability):
     1. Recursively enumerate all regular files under the target directory.
     2. Compute each file's path relative to the target directory, using
        forward-slash separators regardless of OS.
     3. Sort the relative paths lexicographically (byte-wise, via default
        JS string sort on UTF-8 relative paths).
     4. For each file in sorted order, compute SHA-256 of its raw file
        content (bytes, not text-decoded — so encoding is irrelevant).
     5. Build one canonical manifest string of the form:
          "<relative-path>\t<file-sha256>\n"
        for every file, concatenated in the sorted order from step 3.
     6. Compute SHA-256 of the canonical manifest string itself. This is
        the final "tree hash".
     No timestamps, file permissions, or filesystem metadata are included —
     only relative path strings and file byte content participate in the
     hash, so two builds with identical file trees always produce the same
     tree hash regardless of build wall-clock time or traversal order.

   Usage: node tools/hash-build-tree.cjs <directory>
   ========================================================================= */
'use strict';

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const target = process.argv[2];
if (!target) {
  console.error('Usage: node hash-build-tree.cjs <directory>');
  process.exit(1);
}
const targetAbs = path.resolve(target);
if (!fs.existsSync(targetAbs) || !fs.statSync(targetAbs).isDirectory()) {
  console.error(`ERROR: ${targetAbs} does not exist or is not a directory.`);
  process.exit(1);
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function enumerateFiles(dir, baseDir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      enumerateFiles(full, baseDir, out);
    } else if (entry.isFile()) {
      const rel = path.relative(baseDir, full).split(path.sep).join('/');
      out.push(rel);
    }
  }
  return out;
}

const relPaths = enumerateFiles(targetAbs, targetAbs, []).sort();

let manifest = '';
const fileHashes = [];
for (const rel of relPaths) {
  const full = path.join(targetAbs, rel);
  const content = fs.readFileSync(full);
  const fileSha = sha256(content);
  fileHashes.push({ path: rel, sha256: fileSha, bytes: content.length });
  manifest += `${rel}\t${fileSha}\n`;
}

const treeHash = sha256(Buffer.from(manifest, 'utf8'));

console.log(`=== Build-Tree Hash ===`);
console.log(`Target directory: ${targetAbs}`);
console.log(`File count: ${relPaths.length}`);
console.log(`\nFiles (sorted, path\\tSHA-256):`);
fileHashes.forEach(f => console.log(`  ${f.path}\t${f.sha256.substring(0, 16)}...\t(${f.bytes} bytes)`));
console.log(`\nTREE HASH (SHA-256 of canonical manifest): ${treeHash}`);

// Also emit a machine-readable result for tests/tooling
const resultPath = path.join(path.dirname(targetAbs), path.basename(targetAbs) + '.tree-hash.json');
fs.writeFileSync(resultPath, JSON.stringify({
  target: path.relative(process.cwd(), targetAbs),
  file_count: relPaths.length,
  files: fileHashes,
  tree_hash_sha256: treeHash,
}, null, 2));
console.log(`\nResult written to: ${resultPath}`);
