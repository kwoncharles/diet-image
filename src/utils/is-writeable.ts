import fs from 'fs'

export function isWriteable(directory: string): boolean {
  try {
    // W_OK means "it is writeable"
    fs.accessSync(directory, (fs.constants || fs).W_OK);
    return true;
  } catch (err) {
    return false;
  }
}
