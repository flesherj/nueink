const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const packages = ['core', 'aws', 'ui'];

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
    ...packages.map((pkg) => path.join(monorepoRoot, 'packages', pkg)),
    monorepoRoot,
];

config.resolver.nodeModulesPaths = [
    path.join(projectRoot, 'node_modules'),
    path.join(monorepoRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = true;

module.exports = config;
