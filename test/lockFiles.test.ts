import fs from 'fs-extra';
import path from 'path';
import { checkGitLockFiles, removeGitLockFiles } from '../src/inspect';
import { dir, gitDirectory } from './constants';

describe('Git lock files', () => {
  describe('checkGitLockFiles', () => {
    test('returns empty array when no lock files exist', async () => {
      const lockFiles = await checkGitLockFiles(dir);
      expect(lockFiles).toEqual([]);
    });

    test('detects index.lock file', async () => {
      const lockFilePath = path.join(gitDirectory, 'index.lock');
      await fs.writeFile(lockFilePath, 'test lock file');

      const lockFiles = await checkGitLockFiles(dir);
      expect(lockFiles).toContain(lockFilePath);

      // Clean up
      await fs.remove(lockFilePath);
    });

    test('detects HEAD.lock file', async () => {
      const lockFilePath = path.join(gitDirectory, 'HEAD.lock');
      await fs.writeFile(lockFilePath, 'test lock file');

      const lockFiles = await checkGitLockFiles(dir);
      expect(lockFiles).toContain(lockFilePath);

      // Clean up
      await fs.remove(lockFilePath);
    });

    test('detects lock files in refs/heads', async () => {
      const refsHeadsDir = path.join(gitDirectory, 'refs', 'heads');
      await fs.mkdirp(refsHeadsDir);
      const lockFilePath = path.join(refsHeadsDir, 'master.lock');
      await fs.writeFile(lockFilePath, 'test lock file');

      const lockFiles = await checkGitLockFiles(dir);
      expect(lockFiles).toContain(lockFilePath);

      // Clean up
      await fs.remove(lockFilePath);
    });
  });

  describe('removeGitLockFiles', () => {
    test('removes index.lock file', async () => {
      const lockFilePath = path.join(gitDirectory, 'index.lock');
      await fs.writeFile(lockFilePath, 'test lock file');

      const removedCount = await removeGitLockFiles(dir);
      expect(removedCount).toBe(1);
      expect(await fs.pathExists(lockFilePath)).toBe(false);
    });

    test('removes multiple lock files', async () => {
      const indexLockPath = path.join(gitDirectory, 'index.lock');
      const headLockPath = path.join(gitDirectory, 'HEAD.lock');
      await fs.writeFile(indexLockPath, 'test lock file');
      await fs.writeFile(headLockPath, 'test lock file');

      const removedCount = await removeGitLockFiles(dir);
      expect(removedCount).toBe(2);
      expect(await fs.pathExists(indexLockPath)).toBe(false);
      expect(await fs.pathExists(headLockPath)).toBe(false);
    });

    test('returns 0 when no lock files exist', async () => {
      const removedCount = await removeGitLockFiles(dir);
      expect(removedCount).toBe(0);
    });

    test('handles missing refs directories gracefully', async () => {
      // This should not throw an error even if refs/heads doesn't exist
      const removedCount = await removeGitLockFiles(dir);
      expect(removedCount).toBeGreaterThanOrEqual(0);
    });
  });
});
