import fs from 'fs-extra';
import { defaultGitInfo } from '../src/defaultGitInfo';
import { initGitWithBranch } from '../src/init';
import { dir, dir2, setGlobalConstants, upstreamDir } from './constants';

async function delay(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function removeWithRetry(targetPath: string): Promise<void> {
  const attempts = 5;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await fs.remove(targetPath);
      return;
    } catch (error) {
      lastError = error;
      const errorCode = (error as NodeJS.ErrnoException).code;
      if (errorCode !== 'EBUSY' && errorCode !== 'ENOTEMPTY' && errorCode !== 'EPERM') {
        throw error;
      }
      await delay(200 * (attempt + 1));
    }
  }

  throw lastError;
}

beforeEach(async () => {
  setGlobalConstants();
  await resetMockGitRepositories();
  await setUpMockGitRepositories();
}, 120_000);

// afterAll(async () => {
//   return await resetMockGitRepositories();
// });

export async function setUpMockGitRepositories() {
  await Promise.all([
    // simulate situation that local repo is initialized first, and upstream repo (Github) is empty & bare, and is initialized later
    fs.mkdirp(dir).then(() => initGitWithBranch(dir, defaultGitInfo.branch, { initialCommit: true, gitUserName: defaultGitInfo.gitUserName, email: defaultGitInfo.email })),
    fs.mkdirp(upstreamDir).then(() => initGitWithBranch(upstreamDir, defaultGitInfo.branch, { initialCommit: false, bare: true })),
  ]);
}

export async function resetMockGitRepositories() {
  for (const targetPath of [dir, dir2, upstreamDir]) {
    await removeWithRetry(targetPath);
  }
}
