// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/tsdocs
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as fs from 'fs-extra';
import * as path from 'path';

const Project = require('@lerna/project');

/**
 * TypeScript definition for
 * {@link https://github.com/lerna/lerna/blob/master/core/package/index.js | Lerna Package)
 */
export interface LernaPackage {
  /**
   * Package name
   */
  name: string;
  /**
   * Location of the package
   */
  location: string;
  /**
   * Root directory of the monorepo
   */
  rootPath: string;
  /**
   * Location of `package.json`
   */
  manifestLocation: string;
  /**
   * Is it a private package?
   */
  private: boolean;
}

/**
 * Get un-scoped package name
 *
 * @example
 * - '@loopback/context' => 'context'
 * - 'express' => 'express'
 *
 * @param name Name of the npm package
 */
export function getUnscopedPackageName(name: string) {
  if (name.startsWith('@')) {
    return name.split('/')[1];
  }
  return name;
}

/**
 * Get lerna packages and sorted them by location
 *
 * @param rootDir Root directory to find lerna.json
 */
export async function getPackages(
  rootDir = process.cwd(),
): Promise<LernaPackage[]> {
  const project = new Project(rootDir);
  const packages: LernaPackage[] = await project.getPackages();
  packages.sort((p1, p2) => p1.location.localeCompare(p2.location));
  return packages;
}

/**
 * Check if a package should be processed for tsdocs
 *
 * @param pkg Lerna package
 */
export function shouldGenerateTsDocs(pkg: LernaPackage) {
  // We generate tsdocs for `@loopback/tsdocs` even it's private at this moment
  if (pkg.name === '@loopback/tsdocs') return true;

  if (pkg.private && pkg.name !== '@loopback/tsdocs') return false;

  /* istanbul ignore if  */
  if (pkg.name.startsWith('@loopback/example-')) return false;

  if (
    !fs.existsSync(path.join(pkg.location, 'tsconfig.build.json')) &&
    !fs.existsSync(path.join(pkg.location, 'tsconfig.json'))
  ) {
    return false;
  }

  /* istanbul ignore if  */
  if (!fs.existsSync(path.join(pkg.location, 'dist/index.d.ts'))) return false;

  return true;
}

/**
 * Get an array of lerna-managed TypeScript packages to generate tsdocs
 *
 * @param rootDir Root directory to find the monorepo
 */
export async function getPackagesWithTsDocs(
  rootDir = process.cwd(),
): Promise<LernaPackage[]> {
  const packages = await getPackages(rootDir);
  return packages.filter(shouldGenerateTsDocs);
}

/**
 * Options for api docs
 */
export interface ApiDocsOptions {
  /**
   * To have a dry-run without generating api reports/doc models
   */
  dryRun?: boolean;
  /**
   * If `true`, do not print messages to console
   */
  silent?: boolean;
  /**
   * Root directory for the lerna-managed monorepo, default to current dir
   */
  rootDir?: string;
  /**
   * Path to apidocs
   */
  apiDocsPath?: string;
  /**
   * Configuration for api-extractor
   */
}

/**
 * Export the TypeScript path from `@loopback/build`
 */
export const typeScriptPath = require('@loopback/build').typeScriptPath;
