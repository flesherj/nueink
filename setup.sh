#!/bin/bash

# Exit on error
set -e

PROJECT_NAME="nueink"
echo "Setting up monorepo in current directory: $PROJECT_NAME"

# Remove package-lock.json if exists (fix npm/yarn lockfile conflict)
if [ -f "package-lock.json" ]; then
  echo "Removing package-lock.json to avoid lockfile conflicts..."
  rm package-lock.json
fi

# Ensure Yarn 1.x
if ! command -v yarn &> /dev/null || ! yarn --version | grep -q "^1\."; then
  npm install -g corepack
  corepack enable
  corepack prepare yarn@1.22.22 --activate
  echo "Set Yarn to version 1.22.22"
else
  echo "Yarn 1.x already installed, version: $(yarn --version)"
fi

# Initialize Yarn workspace
if [ ! -f "package.json" ]; then
  yarn init -y
  # Add private:true and workspaces using jq
  jq '. + { "private": true, "workspaces": ["apps/*", "packages/*"] }' package.json > tmp.json && mv tmp.json package.json
  echo "Initialized Yarn workspace"
else
  # Make sure private:true and correct workspaces exist
  # private:true
  if ! grep -q '"private": true' package.json; then
    echo "Adding private:true to package.json"
    jq '. + {"private":true}' package.json > tmp.json && mv tmp.json package.json
  fi
  # workspaces
  if ! jq -e '.workspaces | index("apps/*") and index("packages/*")' package.json > /dev/null; then
    echo "Setting workspaces to [\"apps/*\", \"packages/*\"]"
    jq '.workspaces = ["apps/*", "packages/*"]' package.json > tmp.json && mv tmp.json package.json
  fi
  echo "package.json already exists, skipping initialization"
fi

# Run yarn install in root to resolve all workspaces dependencies
echo "Running yarn install in root..."
yarn install

# Create directory structure
mkdir -p apps/native apps/web packages/aws packages/core packages/ui
echo "Created directory structure"

# Initialize packages/ui
cd packages/ui
echo "PWD (packages/ui): $(pwd)"
if [ ! -f "package.json" ]; then
  yarn init -y
  jq '. + { "name": "@nueink/ui", "version": "1.0.0", "main": "index.ts", "types": "index.ts" }' package.json > tmp.json && mv tmp.json package.json
  yarn add react react-native react-native-web react-native-paper
  yarn add --dev @storybook/react @storybook/react-native storybook@9.0.13 jest jest-expo @types/jest ts-jest @types/react @types/react-native typescript

  npx storybook@9.0.13 init --type react_native

  mkdir -p src stories
  cat << EOF > src/Button.tsx
import React from 'react';
import { Button as PaperButton } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress }) => (
  <PaperButton mode="contained" onPress={onPress} style={styles.button}>
    {title}
  </PaperButton>
);

const styles = StyleSheet.create({
  button: {
    margin: 10,
  },
});
EOF

  cat << EOF > stories/Button.stories.tsx
import React from 'react';
import { Button } from '../src/Button';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    title: 'Click Me',
    onPress: () => alert('Button pressed'),
  },
};
EOF

  echo "export * from './src/Button';" > index.ts
  echo "Initialized ui package with Storybook and Jest"
else
  echo "UI package already initialized, skipping"
fi
cd ../..

# Initialize apps/native
cd apps/native
echo "PWD (apps/native): $(pwd)"
echo "Listing ../../packages/ui folder:"
ls -la ../../packages/ui || echo "ERROR: ../../packages/ui folder missing!"
if [ ! -f "package.json" ]; then
  npx create-expo-app . --template blank-typescript
  yarn add expo
  yarn add react-native-paper react-native-safe-area-context react-native-vector-icons

  # FIX: Remove quotes around yarn add local file path to avoid empty "" package entry
  yarn add @nueink/ui@file:../../packages/ui

  # Create Metro config for monorepo
  cat << EOF > metro.config.js
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '../../');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
EOF

  echo "Initialized native app with Expo and Metro config"
else
  echo "Native app already initialized, skipping"
fi
cd ../..

# Initialize apps/web
cd apps/web
echo "PWD (apps/web): $(pwd)"
echo "Listing ../../packages/ui folder:"
ls -la ../../packages/ui || echo "ERROR: ../../packages/ui folder missing!"
if [ ! -f "package.json" ]; then
  npx create-expo-app . --template blank-typescript
  yarn add react-native-web react-native-paper react-native-safe-area-context react-native-vector-icons

  # FIX: Remove quotes around yarn add local file path to avoid empty "" package entry
  yarn add @nueink/ui@file:../../packages/ui

  echo "Initialized web app with Expo"
else
  echo "Web app already initialized, skipping"
fi
cd ../..

# Initialize packages/aws
cd packages/aws
if [ ! -f "package.json" ]; then
  yarn init -y
  jq '. + { "name": "@nueink/aws", "version": "1.0.0", "main": "index.ts", "types": "index.ts" }' package.json > tmp.json && mv tmp.json package.json
  echo "export const aws = () => console.log('AWS package')" > index.ts
  echo "Initialized aws package"
else
  echo "AWS package already initialized, skipping"
fi
cd ../..

# Initialize packages/core
cd packages/core
if [ ! -f "package.json" ]; then
  yarn init -y
  jq '. + { "name": "@nueink/core", "version": "1.0.0", "main": "index.ts", "types": "index.ts" }' package.json > tmp.json && mv tmp.json package.json
  echo "export const core = () => console.log('Core package')" > index.ts
  echo "Initialized core package"
else
  echo "Core package already initialized, skipping"
fi
cd ../..

# Configure Jest in root
if [ ! -f "jest.config.js" ]; then
  cat << EOF > jest.config.js
module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
EOF
  echo "Configured Jest in root"
else
  echo "Jest config already exists, skipping"
fi

# Install root dev dependencies
yarn add --dev typescript jest jest-expo ts-jest @types/jest @types/react @types/react-native

# tsconfig
if [ ! -f "tsconfig.json" ]; then
  cat << EOF > tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@nueink/*": ["packages/*/src"]
    },
    "target": "esnext",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
EOF
  echo "Created tsconfig.json"
else
  echo "tsconfig.json already exists, skipping"
fi

# Add expo-yarn-workspaces
yarn add -D expo-yarn-workspaces
if ! grep -q "expo-yarn-workspaces" package.json; then
  jq '.scripts += { "postinstall": "expo-yarn-workspaces postinstall" }' package.json > tmp.json && mv tmp.json package.json
  echo "Added expo-yarn-workspaces postinstall hook"
fi

# README
if [ ! -f "README.md" ]; then
  cat << EOF > README.md
# Nueink Monorepo

A TypeScript monorepo with Expo apps and shared packages.

## Structure
- apps/native — Expo mobile app
- apps/web — Expo web app
- packages/ui — Shared UI components (Storybook + Jest)
- packages/aws — AWS utilities
- packages/core — Core utils

## Setup
1. yarn install
2. cd apps/native && yarn start
3. cd packages/ui && yarn storybook

EOF
  echo "Created README.md"
else
  echo "README already exists"
fi

echo "✅ Monorepo setup complete!"
