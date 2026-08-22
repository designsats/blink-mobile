/**
 * Publishes Code Connect templates to Figma, but refuses to run on a stale
 * branch: templates must reflect the latest components on main, so the branch
 * must contain origin/main before publishing.
 *
 * Usage:
 *   FIGMA_ACCESS_TOKEN=... node scripts/figma-publish.mjs
 *   FIGMA_ACCESS_TOKEN=... node scripts/figma-publish.mjs --unpublish
 *
 * Escape hatch for experiments: FIGMA_SKIP_SYNC_CHECK=1
 */

import { execSync } from "child_process"

const fail = (message) => {
  console.error(`Error: ${message}`)
  process.exit(1)
}

const run = (cmd) => execSync(cmd, { encoding: "utf8" }).trim()

const checkSyncWithMain = () => {
  try {
    run("git fetch origin main --quiet")
  } catch {
    fail("could not fetch origin/main — check your network and try again")
  }

  const behind = Number(run("git rev-list --count HEAD..origin/main"))
  if (behind > 0) {
    fail(
      `this branch is ${behind} commit(s) behind origin/main.\n` +
        "Sync first, so the published templates match the latest components:\n" +
        "  git merge origin/main   (or: git rebase origin/main)\n" +
        "Then re-run this script. To bypass intentionally: FIGMA_SKIP_SYNC_CHECK=1",
    )
  }
  console.log("Branch is in sync with origin/main.")
}

const main = () => {
  const unpublish = process.argv.includes("--unpublish")

  if (!process.env.FIGMA_ACCESS_TOKEN) {
    fail(
      "FIGMA_ACCESS_TOKEN is not set. It needs File Read + Code Connect Write scopes " +
        "(figma.com/settings → Security → Personal access tokens).",
    )
  }

  if (!process.env.FIGMA_SKIP_SYNC_CHECK) {
    checkSyncWithMain()
  }

  const command = `npx figma connect ${unpublish ? "unpublish" : "publish"}`
  console.log(`Running: ${command}`)
  execSync(command, { stdio: "inherit" })
}

main()
