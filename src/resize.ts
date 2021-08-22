import chalk from "chalk";
import { promises } from 'fs';
import { basename, dirname, join, resolve, isAbsolute } from "path";
import { exit } from "process";
import prompts from "prompts";
import sharp from "sharp";
import { checkFolderIsEmpty, checkPathType, createFolderIfNotExist, getFilenamesInDir } from "./utils/fs";
import { wait } from "./utils/wait";

type ResizeOption = {
  width?: number;
  height?: number;
  prefix?: string;
  outDir?: string;
}
/**
 * output folder
 *  - 올바른 경로인지 체크 ✅
 *  - 존재하지 않으면 생성해줌 ✅
 *
 * path
 *  - 올바른 경로인지 체크 ✅
 *  - 파일일수도 폴더일수도 있음
 *    - 파일인 경우 파일name, 부모 경로 분리 ✅
 *    - 폴더인 경우 폴더경로 알아내기 ✅
 */
export async function resize(_path: string, {
  width,
  height,
  outDir: _outDir,
  prefix = '',
}: ResizeOption) {
  let absolutePath = isAbsolute(_path)
    ? _path
    : join(process.cwd(), _path);
  let absoluteOutDir: string | undefined = _outDir
    ? isAbsolute(_outDir)
      ? _outDir
      : join(process.cwd(), _outDir)
    : undefined;

  let absoluteInputDir: string;
  let absoluteOutputDir: string;
  let filenames: Array<string> = []; 
  let helpText: string;

  /**
   * Initialize base on path type
   */
  switch (checkPathType(absolutePath)) {
    case 'file':
      absoluteInputDir = dirname(absolutePath);
      filenames = [basename(absolutePath)];
      helpText = `${chalk.green(absolutePath)} 파일의`;
      break;
    case 'folder':
      absoluteInputDir = absolutePath;
      filenames = getFilenamesInDir(absolutePath);
      helpText = `${chalk.green(absolutePath)} 폴더 내부 이미지 파일의`;
      break;
    case 'unknown':
    default:
      console.error(`Cannot resolve ${absolutePath} correctly. Please check the path is image file or folder.`);
      exit(0);
  }
  console.log(`
❕ ${helpText} 사이즈를 ${chalk.blueBright(width ? `width: ${width}px` : '')}${chalk.yellow(height ? ` height: ${height}px` : '')}사이즈로 수정하겠습니다.\n
  `);

  await wait(1000);

  /**
   * Check Output Directory
   */
  absoluteOutputDir = absoluteOutDir ?? join(absoluteInputDir, 'min');

  createFolderIfNotExist(absoluteOutputDir);

  console.log();

  /**
   * Iterate resize jobs
   */
  let successfulJobCount = 0;
  let count = 0;
  await Promise.all(filenames.map(async (filename) => {
    const currentOutPath = join(absoluteOutputDir, `${prefix}${filename}`);
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
    `-> ${chalk.greenBright(absoluteOutputDir)}`,
  );
}
