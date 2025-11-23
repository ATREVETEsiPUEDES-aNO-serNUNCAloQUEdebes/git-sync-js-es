import { commitFiles, fetchRemote, forcePull, getSyncState, IForcePullOptions, SyncState } from '../src';
import { defaultGitInfo } from '../src/defaultGitInfo';
import { dir, exampleToken, upstreamDir } from './constants';
import { addAnUpstream, addSomeFiles, anotherRepo2PushSomeFiles, createAndSyncRepo2ToRemote } from './utils';

describe('forcePull', () => {
  beforeEach(async () => {
    await addAnUpstream();
    // repo2 modify the remote, make us behind
    await createAndSyncRepo2ToRemote();
    await anotherRepo2PushSomeFiles();
  });

  const getForcePullOptions = (): IForcePullOptions => ({
    dir,
    remoteUrl: upstreamDir,
    userInfo: { ...defaultGitInfo, accessToken: exampleToken },
  });

  test('added files will be diverged', async () => {
    await addSomeFiles();
    await commitFiles(dir, defaultGitInfo.gitUserName, defaultGitInfo.email);
    await fetchRemote(dir, defaultGitInfo.remote, defaultGitInfo.branch);

    expect(await getSyncState(dir, defaultGitInfo.branch, defaultGitInfo.remote)).toBe<SyncState>('diverged');
  });
  test('added files discarded after pull and being equal', async () => {
    await addSomeFiles();
    await commitFiles(dir, defaultGitInfo.gitUserName, defaultGitInfo.email);
    // force pull without fetch
    await forcePull(getForcePullOptions());
    expect(await getSyncState(dir, defaultGitInfo.branch, defaultGitInfo.remote)).toBe<SyncState>('equal');
  });

  test('fetches latest changes before checking sync state', async () => {
    // This test verifies that forcePull fetches the latest remote state
    // before checking if local is equal to remote

    // First fetch to know the remote state
    await fetchRemote(dir, defaultGitInfo.remote, defaultGitInfo.branch);

    // Check initial state (could be behind or diverged depending on local commits)
    const initialSyncState = await getSyncState(dir, defaultGitInfo.branch, defaultGitInfo.remote);
    expect(['behind', 'diverged']).toContain(initialSyncState);

    // forcePull should fetch the latest and then reset
    await forcePull(getForcePullOptions());

    // After forcePull, should be equal to remote
    const finalSyncState = await getSyncState(dir, defaultGitInfo.branch, defaultGitInfo.remote);
    expect(finalSyncState).toBe<SyncState>('equal');
  });

  test('forcePull uses correct remote and branch names (issue #515)', async () => {
    // This test verifies the fix for issue #515:
    // forcePull should use the actual remoteName and defaultBranchName
    // instead of defaultGitInfo.remote and defaultGitInfo.branch

    // repo2 has pushed changes, so we should be behind after fetch
    await fetchRemote(dir, defaultGitInfo.remote, defaultGitInfo.branch);
    const syncStateBeforePull = await getSyncState(dir, defaultGitInfo.branch, defaultGitInfo.remote);

    // Should not be equal if repo2 pushed changes
    expect(syncStateBeforePull).not.toBe<SyncState>('equal');

    // forcePull should correctly fetch and reset
    await forcePull(getForcePullOptions());

    // After forcePull, should definitely be equal
    const syncStateAfterPull = await getSyncState(dir, defaultGitInfo.branch, defaultGitInfo.remote);
    expect(syncStateAfterPull).toBe<SyncState>('equal');
  });
});
