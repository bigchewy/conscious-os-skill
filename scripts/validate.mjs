import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export function parseJson(text, label) {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`)
  }
}

export function getMcpServerUrl(mcpConfigObj) {
  const url = mcpConfigObj?.mcpServers?.['conscious-os']?.url
  if (!url) {
    throw new Error('mcpServers["conscious-os"].url is missing')
  }
  return url
}

export function checkUrlsMatch(claudePluginJsonObj, mcpJsonObj) {
  const claudeUrl = getMcpServerUrl(claudePluginJsonObj)
  const agentPluginsUrl = getMcpServerUrl(mcpJsonObj)
  if (claudeUrl !== agentPluginsUrl) {
    throw new Error(
      `server URL mismatch: .claude-plugin/plugin.json has "${claudeUrl}", mcp.json has "${agentPluginsUrl}"`,
    )
  }
  return claudeUrl
}

export function parseSkillFrontmatter(skillMdText) {
  const match = skillMdText.match(/^---\n([\s\S]*?)\n---/)
  if (!match) {
    throw new Error('SKILL.md has no --- delimited frontmatter block')
  }
  const block = match[1]
  const nameMatch = block.match(/^name:\s*(.+)$/m)
  const licenseMatch = block.match(/^license:\s*(.+)$/m)
  const descMatch = block.match(/(?:^|\n)description:\s*>?\s*\n([\s\S]*?)(?:\n\w+:|$)/)
  const description = descMatch
    ? descMatch[1]
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' ')
    : ''
  return {
    name: nameMatch ? nameMatch[1].trim() : '',
    license: licenseMatch ? licenseMatch[1].trim() : '',
    description,
  }
}

export function checkSkillFrontmatter(skillMdText, expectedName) {
  const fm = parseSkillFrontmatter(skillMdText)
  if (fm.name !== expectedName) {
    throw new Error(`SKILL.md name "${fm.name}" does not match directory "${expectedName}"`)
  }
  if (!fm.license) {
    throw new Error('SKILL.md is missing a license field')
  }
  if (!fm.description) {
    throw new Error('SKILL.md is missing a description')
  }
  if (fm.description.length > 1024) {
    throw new Error(`SKILL.md description is ${fm.description.length} characters, over the 1024 limit`)
  }
}

export function checkDirectoryFields(claudePluginJsonObj) {
  for (const field of ['homepage', 'repository', 'license', 'keywords']) {
    if (!claudePluginJsonObj?.[field]) {
      throw new Error(`.claude-plugin/plugin.json is missing "${field}", which the plugin directory lists`)
    }
  }
}

export function main(rootDir) {
  try {
    const claudePlugin = parseJson(
      readFileSync(join(rootDir, '.claude-plugin/plugin.json'), 'utf8'),
      '.claude-plugin/plugin.json',
    )
    const mcpJson = parseJson(readFileSync(join(rootDir, 'mcp.json'), 'utf8'), 'mcp.json')
    const url = checkUrlsMatch(claudePlugin, mcpJson)
    console.log(`ok: server url matches everywhere (${url})`)

    const skillMd = readFileSync(join(rootDir, 'skills/conscious-os/SKILL.md'), 'utf8')
    checkSkillFrontmatter(skillMd, 'conscious-os')
    console.log('ok: SKILL.md frontmatter is valid')

    checkDirectoryFields(claudePlugin)
    console.log('ok: plugin directory fields present')
  } catch (error) {
    console.error(`FAIL: ${error.message}`)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.cwd())
}
