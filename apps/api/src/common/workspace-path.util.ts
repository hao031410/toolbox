import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * 向上查找 monorepo 根目录，保证 JSON 等本地文件始终落到项目根目录。
 * 如果未识别到 workspace，则降级为当前 API 应用目录。
 */
export function resolveWorkspacePath(...segments: string[]) {
  const workspaceRoot =
    findWorkspaceRoot(__dirname) ?? resolve(__dirname, '..', '..');
  return resolve(workspaceRoot, ...segments);
}

function findWorkspaceRoot(startDir: string) {
  let currentDir = startDir;

  while (true) {
    const packageJsonPath = resolve(currentDir, 'package.json');

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          readFileSync(packageJsonPath, 'utf8'),
        ) as {
          workspaces?: string[];
        };

        if (
          Array.isArray(packageJson.workspaces) &&
          packageJson.workspaces.length > 0
        ) {
          return currentDir;
        }
      } catch {
        return null;
      }
    }

    const parentDir = dirname(currentDir);

    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}
