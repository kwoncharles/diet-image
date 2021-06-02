import chalk from 'chalk';
import { promises } from 'fs';
import { join } from 'path';
import { exit } from 'process';
import prompts from 'prompts';
import sharp from 'sharp';
import { checkFolderIsEmpty, createFolderIfNotExist, getFilenamesInDir } from './utils/fs';
import { wait } from './utils/wait';

async function resizeAll(dirname: string, { width, height, prefix = 'min' }: {
  width?: number;
  height?: number;
  prefix?: string;
}) {
  console.log(`${chalk.yellow(dirname)}에 있는 이미지 파일들의 사이즈를 ${chalk.blueBright(width ? `width: ${width}px` : '')}${chalk.yellow(height ? ` height: ${height}px` : '')} 사이즈로 수정하겠습니다. \n\n`);
  await wait(1000);
  const files = getFilenamesInDir(dirname);
  const resultFolderPath = join(process.cwd(), dirname, prefix);
  createFolderIfNotExist(resultFolderPath)

  if (!checkFolderIsEmpty(resultFolderPath)) {
    const { goAhead } = await prompts({
      type: 'confirm',
      message: `${chalk.yellow(resultFolderPath)}\n결과가 저장될 폴더가 비어있지 않습니다. 폴더 경로는 위와 같아요.\n계속 진행하시겠어요?`,
      initial: false,
      name: 'goAhead',
    });

    if (!goAhead) exit(0);
  }

  await Promise.all(files.map(async (filename) => {
    console.log('filename: ', filename, '\n');
    try {
      const buffer = await promises.readFile(join(dirname, filename));
      sharp(buffer)
        .resize(width, height)
        .toFile(join(dirname, prefix, `${prefix}-${filename}`))
    } catch (e) {
      console.log('catched: !!! ', filename, e);
    }
  }));

  console.log(
    '  ✅ 아래 경로에',
    chalk.green(`${files.length}개`),
    '파일이 생성되었습니다.\n',
    `  ${chalk.greenBright(resultFolderPath)}`,
  );
}

const path = process.argv[2]
const size = process.argv[3]
const prefix = process.argv[4]

resizeAll(
  path,
  {
    prefix,
    width: parseInt(size, 10) || 400,
  },
);
