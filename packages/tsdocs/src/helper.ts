// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/tsdocs
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as fs from 'fs-extra';
import * as path from 'path';

const Project = require('@lerna/project');

/**
 * TypeScript definition for Lerna Package
 */
export interface LernaPackage {
  name: string;
  location: string;
  rootPath: string;
  manifestLocation: string;
  private: boolean;
}

/**
 * Get unscoped package name
 * @param name npm package name, such as `@loopback/context` or `express`
 */
export function getUnscopedPackageName(name: string) {
  if (name.startsWith('@')) {
    return name.split('/')[1];
  }
  return name;
}

/**
 * Get lerna packages
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
 * Check if a package is TypeScript project
 * @param pkg Lerna package
 */
export function isPublicTSPackage(pkg: LernaPackage) {
  if (pkg.private) return false;
  if (pkg.name.startsWith('@loopback/example-')) return false;

  if (!fs.existsSync(path.join(pkg.location, 'tsconfig.build.json')))
    return false;

  if (!fs.existsSync(path.join(pkg.location, 'dist/index.d.ts'))) return false;

  return true;
}

/**
 * Get an array lerna-managed public TypeScript packages
 * @param rootDir
 */
export async function getPublicTSPackages(
  rootDir = process.cwd(),
): Promise<LernaPackage[]> {
  const packages = await getPackages(rootDir);
  return packages.filter(isPublicTSPackage);
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
