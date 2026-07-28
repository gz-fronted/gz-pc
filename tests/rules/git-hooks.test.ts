import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

interface PackageManifest {
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
  "lint-staged": Record<string, string[]>;
}

describe("Git hooks", () => {
  it("configures Husky for staged files and commit messages", async () => {
    const [manifestText, preCommit, commitMessage, readme] = await Promise.all([
      readFile(new URL("../../package.json", import.meta.url), "utf8"),
      readFile(new URL("../../.husky/pre-commit", import.meta.url), "utf8"),
      readFile(new URL("../../.husky/commit-msg", import.meta.url), "utf8"),
      readFile(new URL("../../README.md", import.meta.url), "utf8"),
    ]);
    const parsed: unknown = JSON.parse(manifestText);
    const manifest = parsed as PackageManifest;

    expect(manifest.scripts.prepare).toBe("husky");
    expect(manifest.devDependencies).toHaveProperty("lint-staged");
    expect(manifest.devDependencies).toHaveProperty("prettier");
    expect(manifest["lint-staged"]["*.{js,jsx,ts,tsx}"]).toEqual([
      "eslint --fix",
      "prettier --write",
    ]);
    expect(manifest["lint-staged"]["*.{json,md,yml,yaml,css,less}"]).toEqual([
      "prettier --write",
    ]);
    expect(preCommit.trim()).toBe("npx lint-staged");
    expect(commitMessage.trim()).toBe('npx commitlint --edit "$1"');
    expect(readme).toContain("只检查 Git 暂存区中的文件");
    expect(readme).toContain("不替代完整的 `lint`、`typecheck`、`test` 和");
  });
});
