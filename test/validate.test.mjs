import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  parseJson,
  getMcpServerUrl,
  checkUrlsMatch,
  parseSkillFrontmatter,
  checkSkillFrontmatter,
  checkDirectoryFields,
} from '../scripts/validate.mjs'

test('parseJson parses valid JSON', () => {
  const result = parseJson('{"a": 1}', 'test.json')
  assert.deepEqual(result, { a: 1 })
})

test('parseJson throws with the label on invalid JSON', () => {
  assert.throws(
    () => parseJson('{not json', 'mcp.json'),
    /mcp\.json is not valid JSON/,
  )
})

test('getMcpServerUrl reads the conscious-os server url', () => {
  const url = getMcpServerUrl({
    mcpServers: { 'conscious-os': { type: 'http', url: 'https://theconsciousos.com/api/mcp' } },
  })
  assert.equal(url, 'https://theconsciousos.com/api/mcp')
})

test('getMcpServerUrl throws when the conscious-os server is missing', () => {
  assert.throws(() => getMcpServerUrl({ mcpServers: {} }), /conscious-os/)
})

test('checkUrlsMatch returns the shared url when both manifests agree', () => {
  const claudePlugin = { mcpServers: { 'conscious-os': { url: 'https://theconsciousos.com/api/mcp' } } }
  const agentPlugins = { mcpServers: { 'conscious-os': { url: 'https://theconsciousos.com/api/mcp' } } }
  assert.equal(checkUrlsMatch(claudePlugin, agentPlugins), 'https://theconsciousos.com/api/mcp')
})

test('checkUrlsMatch throws naming both values when the manifests disagree', () => {
  const claudePlugin = { mcpServers: { 'conscious-os': { url: 'https://theconsciousos.com/api/mcp' } } }
  const agentPlugins = { mcpServers: { 'conscious-os': { url: 'https://theconsciousos.com/api/mcp-old' } } }
  assert.throws(
    () => checkUrlsMatch(claudePlugin, agentPlugins),
    /https:\/\/theconsciousos\.com\/api\/mcp.*https:\/\/theconsciousos\.com\/api\/mcp-old/,
  )
})

test('parseSkillFrontmatter extracts name, license, and description', () => {
  const md = [
    '---',
    'name: conscious-os',
    'description: >',
    '  Runs a guided exercise.',
    '  Use when the person asks for one.',
    'license: MIT',
    '---',
    '',
    '# Body',
  ].join('\n')
  const fm = parseSkillFrontmatter(md)
  assert.equal(fm.name, 'conscious-os')
  assert.equal(fm.license, 'MIT')
  assert.match(fm.description, /Runs a guided exercise\. Use when the person asks for one\./)
})

test('parseSkillFrontmatter throws when there is no frontmatter block', () => {
  assert.throws(() => parseSkillFrontmatter('# Just a heading'), /frontmatter/)
})

test('checkSkillFrontmatter passes for a well-formed skill file', () => {
  const md = [
    '---',
    'name: conscious-os',
    'description: >',
    '  A short description.',
    'license: MIT',
    '---',
  ].join('\n')
  assert.doesNotThrow(() => checkSkillFrontmatter(md, 'conscious-os'))
})

test('checkSkillFrontmatter throws when name does not match the directory', () => {
  const md = ['---', 'name: wrong-name', 'description: >', '  x', 'license: MIT', '---'].join('\n')
  assert.throws(() => checkSkillFrontmatter(md, 'conscious-os'), /name/)
})

test('checkSkillFrontmatter throws when license is missing', () => {
  const md = ['---', 'name: conscious-os', 'description: >', '  x', '---'].join('\n')
  assert.throws(() => checkSkillFrontmatter(md, 'conscious-os'), /license/)
})

test('checkSkillFrontmatter throws when description exceeds 1024 characters', () => {
  const longLine = '  ' + 'x'.repeat(1100)
  const md = ['---', 'name: conscious-os', 'description: >', longLine, 'license: MIT', '---'].join('\n')
  assert.throws(() => checkSkillFrontmatter(md, 'conscious-os'), /1024/)
})

test('checkDirectoryFields throws when homepage is missing', () => {
  const manifest = {
    repository: 'https://github.com/bigchewy/conscious-os-skill',
    license: 'MIT',
    keywords: ['coaching'],
  }
  assert.throws(() => checkDirectoryFields(manifest), /homepage/)
})

test('checkDirectoryFields throws when repository is missing', () => {
  const manifest = {
    homepage: 'https://theconsciousos.com/connect',
    license: 'MIT',
    keywords: ['coaching'],
  }
  assert.throws(() => checkDirectoryFields(manifest), /repository/)
})

test('checkDirectoryFields throws when license is missing', () => {
  const manifest = {
    homepage: 'https://theconsciousos.com/connect',
    repository: 'https://github.com/bigchewy/conscious-os-skill',
    keywords: ['coaching'],
  }
  assert.throws(() => checkDirectoryFields(manifest), /license/)
})

test('checkDirectoryFields throws when keywords is missing', () => {
  const manifest = {
    homepage: 'https://theconsciousos.com/connect',
    repository: 'https://github.com/bigchewy/conscious-os-skill',
    license: 'MIT',
  }
  assert.throws(() => checkDirectoryFields(manifest), /keywords/)
})

test('checkDirectoryFields passes for the real plugin manifest', () => {
  const claudePlugin = parseJson(
    readFileSync(join(import.meta.dirname, '../.claude-plugin/plugin.json'), 'utf8'),
    '.claude-plugin/plugin.json',
  )
  assert.doesNotThrow(() => checkDirectoryFields(claudePlugin))
})
