import chalk from "chalk";
import { promises } from 'fs';
import { basename, dirname, join, isAbsolute } from "path";
import { exit } from "process";
import prompts from "prompts";
import sharp from "sharp";
import { checkPathType, createFolderIfNotExist, getFilenamesInDir } from "./utils/fs";
import { wait } from "./utils/wait";

type ResizeOption = {
  width?: number;
  height?: number;
  prefix?: string;
  outDir?: string;
}

export async function resize(_path: string, {
  width,
  height,
  outDir: _outDir,
  prefix = '',
}: ResizeOption) {
  const sizeInfoText = (width || height)
    ? `${chalk.blueBright(width ? `width: ${width}px` : '')}${chalk.yellow(height ? ` height: ${height}px` : '')} 사이즈로 `
    : '';
  let absolutePathParam = isAbsolute(_path)
    ? _path
    : join(process.cwd(), _path);
  let absoluteOutDirParam: string | undefined = _outDir
    ? isAbsolute(_outDir)
      ? _outDir
      : join(process.cwd(), _outDir)
    : undefined;

  let absoluteInputDir: string;
  let absoluteOutDir: string;
  let filenames: Array<string> = []; 
  let inputInfoText: string;

  /**
   * Initialize base on path type
   */
  switch (checkPathType(absolutePathParam)) {
    case 'file':
      absoluteInputDir = dirname(absolutePathParam);
      filenames = [basename(absolutePathParam)];
      inputInfoText = `${chalk.green(absolutePathParam)} 파일의`;
      break;
    case 'folder':
      absoluteInputDir = absolutePathParam;
      filenames = getFilenamesInDir(absolutePathParam);
      inputInfoText = `${chalk.green(absolutePathParam)} 폴더 내부 이미지 파일의`;
      break;
    case 'unknown':
    default:
      console.error(`Cannot resolve ${absolutePathParam} correctly. Please check the path is image file or folder.`);
      exit(0);
  }
  console.log(`
❕ ${inputInfoText} 사이즈를 ${sizeInfoText}수정하겠습니다.\n
  `);

  await wait(1000);

  /**
   * Check Output Directory
   */
  absoluteOutDir = absoluteOutDirParam ?? join(absoluteInputDir, 'min');

  createFolderIfNotExist(absoluteOutDir);

  console.log();

  /**
   * Iterate resize jobs
   */
  let successfulJobCount = 0;
  let count = 0;
  await Promise.all(filenames.map(async (filename) => {
    const currentOutPath = join(absoluteOutDir, `${prefix}${filename}`);
    let skip = false;
    let isSuccess = true;
    let error;

    /**
     * Check overwrite
     */
    try {
      await promises.readFile(currentOutPath);
  
      const { goAhead } = await prompts({
        type: 'confirm',
        message: `${chalk.redBright(`${prefix}${filename}`)} already exists. Would you like to overwrite?`,
        initial: false,
        name: 'goAhead',
      });

      if (!goAhead) skip = true;
    } catch (e) {
      // path through
    }

    if (!skip) {
      /**
       * resize
       */
      try {
        const buffer = await promises.readFile(join(absoluteInputDir, filename));
        sharp(buffer)
          .resize(width, height)
          .toFile(currentOutPath)
      } catch (e) {
        isSuccess = false;
        error = e;
      } finally {
        count++;
        console.log(isSuccess ? '✅' : '🛑', chalk.bold(`${count}th`), chalk.grey(filename));
        
        if (!isSuccess) {
          console.log();
          console.log(`Could not resize ${filename}. Check the error message below.`);
          console.log(error);
        } else {
          successfulJobCount++;
        }
      }
    }
  }));

  console.log();
  console.log(
    chalk.green(`${successfulJobCount}`),
    'images are created.',
    'Check below\n',
    `-> ${chalk.greenBright(absoluteOutDir)}`,
  );
}
