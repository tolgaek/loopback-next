// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/tsdocs
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  CompilerState,
  ConsoleMessageId,
  Extractor,
  ExtractorConfig,
  ExtractorLogLevel,
  ExtractorMessage,
  ExtractorResult,
  IConfigFile,
} from '@microsoft/api-extractor';
import * as debugFactory from 'debug';
import * as fs from 'fs-extra';
import * as path from 'path';
import {ApiDocsOptions, getPublicTSPackages, typeScriptPath} from './helper';
const debug = debugFactory('loopback:tsdocs');

/**
 * Options to run api-extractor against the lerna repo
 */
export interface ExtractorOptions extends ApiDocsOptions {
  /**
   * Configuration for api-extractor
   */
  config?: IConfigFile;
  /**
   * Custom TypeScript compiler dir
   */
  typescriptCompilerFolder?: string;
}

const DEFAULT_TS_DOCS_PATH = 'docs/apidocs';

/**
 * Run api-extractor for a lerna-managed monrepo
 * @param options Options for running api-extractor
 */
export async function runExtractorForMonorepo(options: ExtractorOptions = {}) {
  debug('Extractor options:', options);

  options = Object.assign(
    {
      rootDir: process.cwd(),
      apiDocsPath: DEFAULT_TS_DOCS_PATH,
      typescriptCompilerFolder: typeScriptPath,
    },
    options,
  );

  const apiDocsPath = options.apiDocsPath;

  const packages = await getPublicTSPackages(options.rootDir);
  if (!packages.length) return;
  const lernaRootDir = packages[0].rootPath;

  if (!options.silent) {
    console.log('Running api-extractor for lerna repo: %s', lernaRootDir);
  }

  fs.ensureDirSync(path.join(lernaRootDir, `${apiDocsPath}/reports`));

  for (const pkg of packages) {
    if (!options.silent) {
      console.log('> %s', pkg.name);
    }

    debug('Package: %s (%s)', pkg.name, pkg.location);

    const entryPoint = path.join(pkg.location, 'dist/index.d.ts');

    process.chdir(pkg.location);

    let configObj: IConfigFile = {
      projectFolder: pkg.location,

      mainEntryPointFilePath: entryPoint,

      apiReport: {
        enabled: true,
        reportFolder: path.join(pkg.rootPath, `${apiDocsPath}/reports`),
        reportTempFolder: path.join(
          pkg.rootPath,
          `${apiDocsPath}/reports-temp`,
        ),
        reportFileName: '<unscopedPackageName>.api.md',
      },

      docModel: {
        enabled: true,
        apiJsonFilePath: path.join(
          pkg.rootPath,
          `${apiDocsPath}/models/<unscopedPackageName>.api.json`,
        ),
      },

      messages: {
        extractorMessageReporting: {
          'ae-missing-release-tag': {
            logLevel: ExtractorLogLevel.None,
            addToApiReportFile: false,
          },
        },
      },

      compiler: {
        tsconfigFilePath: 'tsconfig.build.json',
      },
    };

    if (options.config) {
      configObj = Object.assign(configObj, options.config);
    }
    debug('Extractor config options:', configObj);

    const extractorConfig = ExtractorConfig.prepare({
      configObject: configObj,
      configObjectFullPath: '',
      packageJsonFullPath: pkg.manifestLocation,
    });

    debug('Resolved extractor config:', extractorConfig);

    const compilerState = CompilerState.create(extractorConfig, {
      // typescriptCompilerFolder: options.typescriptCompilerFolder,
    });

    if (!options.dryRun) {
      const extractorResult: ExtractorResult = Extractor.invoke(
        extractorConfig,
        {
          typescriptCompilerFolder: options.typescriptCompilerFolder,
          localBuild: true,
          showVerboseMessages: !options.silent,
          messageCallback: (message: ExtractorMessage) => {
            if (message.messageId === ConsoleMessageId.ApiReportCreated) {
              // This script deletes the outputs for a clean build,
              // so don't issue a warning if the file gets created
              message.logLevel = ExtractorLogLevel.None;
            }
          },
          compilerState,
        },
      );
      debug(extractorResult);
    }
  }
}
