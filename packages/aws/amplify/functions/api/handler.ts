/**
 * NueInk REST API Lambda Handler
 *
 * Express-based REST API for all client-side operations.
 * Replaces direct AppSync access from clients.
 *
 * Architecture:
 * Client → API Gateway → Express → Services → Repositories → AppSync/AWS SDK
 */

import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';

import { env } from '$amplify/env/nueink-api';
import { initializeAmplifyClient } from '../../shared/initializeClient';
import { NueInkRepositoryFactory } from '@nueink/aws';
import { NueInkServiceFactory } from '@nueink/core';
import { AwsServiceFactory } from '@nueink/aws/services';

// Initialize infrastructure
const dataClient = await initializeAmplifyClient(env);
const repositoryFactory = NueInkRepositoryFactory.getInstance(dataClient);
const serviceFactory = NueInkServiceFactory.getInstance(repositoryFactory);
const awsFactory = AwsServiceFactory.getInstance();

// Make factories available to controllers
export { serviceFactory, awsFactory };

// Import routers
import AccountRouter from './routers/AccountRouter';
import IntegrationRouter from './routers/IntegrationRouter';
import FinancialAccountRouter from './routers/FinancialAccountRouter';
import TransactionRouter from './routers/TransactionRouter';

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());

// Mount routers
app.use('/account', AccountRouter);
app.use('/integration', IntegrationRouter);
app.use('/financial-account', FinancialAccountRouter);
app.use('/transaction', TransactionRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Convert Express app to Lambda handler
// serverless-http handles the type conversion for us
export const handler = serverless(app);
