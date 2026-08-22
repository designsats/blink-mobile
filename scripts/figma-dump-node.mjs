/**
 * Dumps a Figma node's full JSON tree to .figma-cache/ so an agent can resolve
 * a screen against figma-mappings.json and the .figma.ts templates under app/
 * entirely locally — no Figma desktop app, no MCP, no Dev Mode seat.
 *
 * Requires a personal access token with read access to the file (any free
 * Figma account works on a link-shared file).
 *
 * Usage:
 *   FIGMA_ACCESS_TOKEN=... node scripts/figma-dump-node.mjs <figma-url-or-node-id>
 *
 * Examples:
 *   node scripts/figma-dump-node.mjs "https://www.figma.com/design/9MQuQi8ZhXVvDibWSI3C4c/Blink?node-id=37-4625"
 *   node scripts/figma-dump-node.mjs 37:4625        # defaults to the Blink file
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(SCRIPT_DIR, "..")
const CACHE_DIR = path.join(REPO_ROOT, ".figma-cache")
const DEFAULT_FILE_KEY = "9MQuQi8ZhXVvDibWSI3C4c" // Blink design file
const API_BASE_URL = "https://api.figma.com/v1/files"

const fail = (message) => {
  console.error(`Error: ${message}`)
  process.exit(1)
}

const parseInput = (input) => {
  // Full Figma URL: /design/:key/... or /file/:key/... with ?node-id=1-2
  const urlMatch = input.match(/figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)(?:\/branch\/([a-zA-Z0-9]+))?/)
  if (urlMatch) {
    const nodeMatch = input.match(/[?&]node-id=([0-9]+[:-][0-9]+)/)
    if (!nodeMatch) fail("URL has no node-id query parameter")
    // Branch URLs: the branch key addresses the branch like its own file
    return { fileKey: urlMatch[2] ?? urlMatch[1], nodeId: nodeMatch[1].replace("-", ":") }
  }
  // Bare node id in the default Blink file
  const bareMatch = input.match(/^([0-9]+[:-][0-9]+)$/)
  if (bareMatch) {
    return { fileKey: DEFAULT_FILE_KEY, nodeId: bareMatch[1].replace("-", ":") }
  }
  fail(`could not parse "${input}" — pass a Figma URL or a node id like 37:4625`)
}

const main = async () => {
  const input = process.argv[2]
  if (!input) fail("usage: node scripts/figma-dump-node.mjs <figma-url-or-node-id>")

  const { fileKey, nodeId } = parseInput(input)

  const token = process.env.FIGMA_ACCESS_TOKEN
  if (!token) {
    fail(
      "FIGMA_ACCESS_TOKEN is not set. Create a read-only personal access token at " +
        "https://www.figma.com/settings (Security → Personal access tokens).",
    )
  }
  const url = `${API_BASE_URL}/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`

  const response = await fetch(url, { headers: { "X-Figma-Token": token } })
  if (response.status === 403) {
    fail("403 Forbidden — the token's account cannot view this file. Share the file with link access or with that account.")
  }
  if (!response.ok) fail(`HTTP ${response.status} from Figma API for ${url}`)

  const data = await response.json()
  const node = data.nodes?.[nodeId]?.document
  if (!node) fail(`node ${nodeId} not found in file ${fileKey}`)

  fs.mkdirSync(CACHE_DIR, { recursive: true })
  const outPath = path.join(CACHE_DIR, `${fileKey}-${nodeId.replace(":", "-")}.json`)
  fs.writeFileSync(outPath, JSON.stringify(node, null, 2))

  const childCount = node.children?.length ?? 0
  console.log(`Saved "${node.name}" (${node.type}, ${childCount} direct children)`)
  console.log(outPath)
  console.log("Next: resolve componentIds against figma-mappings.json and the .figma.ts templates")
}

main()
