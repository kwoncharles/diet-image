import chalk from "chalk";
import { promises } from 'fs';
import { basename, dirname, join, resolve } from "path";
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
export async function resize(path: string, {
  width,
  height,
  outDir,
  prefix = '',
}: ResizeOption) {
  let inputDir: string;
  let filenames: Array<string> = []; 
  let outputDir: string;
  let helpText: string;

  /**
   * Initialize base on path type
   */
  switch (checkPathType(path)) {
    case 'file':
      inputDir = dirname(path);
      filenames = [basename(path)];
      helpText = `${chalk.green(resolve(path))} 파일의`;
      break;
    case 'folder':
      inputDir = path;
      filenames = getFilenamesInDir(path);
      helpText = `${chalk.green(resolve(path))} 폴더 내부 이미지 파일의`;
      break;
    case 'unknown':
    default:
      console.error(`Cannot resolve ${path} correctly. Please check the path is image file or folder.`);
      exit(0);
  }
  console.log(`
❕ ${helpText} 사이즈를 ${chalk.blueBright(width ? `width: ${width}px` : '')}${chalk.yellow(height ? ` height: ${height}px` : '')}사이즈로 수정하겠습니다.\n
  `);

  await wait(1000);

  /**
   * Check Output Directory
   */
  outputDir = outDir ?? join(process.cwd(), inputDir, 'min');
  createFolderIfNotExist(outputDir);

  console.log();

  /**
   * Iterate resize jobs
   */
  let successfulJobCount = 0;
  let count = 0;
  await Promise.all(filenames.map(async (filename) => {
    const currentOutPath = join(outputDir, `${prefix}${filename}`);
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
        const buffer = await promises.readFile(join(inputDir, filename));
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
    `-> ${chalk.greenBright(resolve(outputDir))}`,
  );
}
