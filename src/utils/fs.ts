import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { exit } from 'process';
import { isWriteable } from './is-writeable';

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
    const parentDir = dirname(dirPath);

    if (isWriteable(parentDir)) {
      mkdirSync(dirPath);
    } else {
      console.error(`${parentDir} is not writeable`);
      exit(0);
    }
  }
}

export function checkFolderIsEmpty(dirPath: string): boolean {
  if (existsSync(dirPath)) {
    const files = readdirSync(dirPath);

    return files.length === 0;
  }

  return true;
}

export function checkPathType(
  path: string,
): 'file' | 'folder' | 'unknown' {
  const result = statSync(path);

  if (result.isFile()) {
    return 'file';
  }
  if (result.isDirectory()) {
    return 'folder';
  }
  return 'unknown';
}
