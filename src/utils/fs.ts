import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export function getFilenamesInDir(dirname: string, option: {
  excludeHiddenFile: boolean;
} = {
  excludeHiddenFile: true,
}): Array<string> {
  return readdirSync(
    join(process.cwd(), dirname)
  ).filter((name) => {
    if (option.excludeHiddenFile && name[0] === '.') {
      return false;
    }

    return statSync(join(dirname, name)).isFile()
  });
}

export function createFolderIfNotExist(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath);
  }
}

export function checkFolderIsEmpty(dirPath: string): boolean {
  if (existsSync(dirPath)) {
    const files = readdirSync(dirPath);

    return files.length === 0;
  }

  return true;
}
