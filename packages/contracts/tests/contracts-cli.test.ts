import { Provider } from '@fuel-ts/providers';
import type { WalletUnlocked } from '@fuel-ts/wallet';
import { generateTestWallet } from '@fuel-ts/wallet/test-utils';
import { existsSync } from 'fs';
import fs, { readFile } from 'fs/promises';
import { join } from 'path';
import rimraf from 'rimraf';

import { run } from '../src/bin/cli';

import { createConfigFile } from './utils/createConfigFile';

describe('Contracts Scripts', () => {
  let wallet: WalletUnlocked;
  const tempPath = join(__dirname, './generated');
  const templatePath = join(__dirname, './template');

  const cleanup = () => {
    rimraf.sync(tempPath);
  };

  beforeEach(async () => {
    await cleanup();
    wallet = await generateTestWallet(new Provider('http://localhost:4000/graphql'), [[1_000_000]]);
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  async function runCommand(command: string) {
    const argv = ['node', 'fuels-contracts', command, '-c', tempPath];
    await run({ argv, programName: 'cli.js:test' });
  }

  test('should run build command', async () => {
    await fs.cp(templatePath, tempPath, {
      recursive: true,
    });
    await createConfigFile(tempPath, {
      workspace: './contracts',
      output: './types',
    });
    await runCommand('build');
    expect(existsSync(join(tempPath, './contracts/bar/out'))).toBeTruthy();
  });

  test('should run types command', async () => {
    await fs.cp(templatePath, tempPath, {
      recursive: true,
    });
    await createConfigFile(tempPath, {
      workspace: './contracts',
      output: './types',
    });
    await runCommand('build');
    await runCommand('types');
    expect(existsSync(join(tempPath, './types/index.ts'))).toBeTruthy();
  });

  test('should run deploy command', async () => {
    await fs.cp(templatePath, tempPath, {
      recursive: true,
    });
    await createConfigFile(tempPath, {
      deployConfig: {
        gasPrice: 1,
      },
      privateKey: wallet.privateKey,
      workspace: './contracts',
      output: './types',
    });
    const stdoutSpy = jest.spyOn(process.stdout, 'write');
    await runCommand('build');
    await runCommand('deploy');
    const output = stdoutSpy.mock.calls.reduce((o, call) => {
      const [message] = call;
      return `${o}${message.toString()}`;
    }, '');
    expect(output.match(/Contract successfully deployed/gi)).toHaveLength(2);
    const contractsFile = await readFile(join(tempPath, './types/contracts.json'));
    const contracts = JSON.parse(contractsFile.toString());
    expect(contracts.fooBar).toBeTruthy();
    expect(contracts.fooBar).toBeTruthy();
  });

  test('should run build, deploy and types on run command', async () => {
    await fs.cp(templatePath, tempPath, {
      recursive: true,
    });
    await createConfigFile(tempPath, {
      deployConfig: {
        gasPrice: 1,
      },
      privateKey: wallet.privateKey,
      workspace: './contracts',
      output: './types',
    });
    const stdoutSpy = jest.spyOn(process.stdout, 'write');
    await runCommand('run');
    const output = stdoutSpy.mock.calls.reduce((o, call) => {
      const [message] = call;
      return `${o}${message.toString()}`;
    }, '');
    expect(existsSync(join(tempPath, './contracts/bar/out'))).toBeTruthy();
    expect(existsSync(join(tempPath, './types/index.ts'))).toBeTruthy();
    expect(output.match(/Contract successfully deployed/gi)).toHaveLength(2);
    const contractsFile = await readFile(join(tempPath, './types/contracts.json'));
    const contracts = JSON.parse(contractsFile.toString());
    expect(contracts.fooBar).toBeTruthy();
    expect(contracts.fooBar).toBeTruthy();
  });
});
