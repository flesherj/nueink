import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';

import { env } from "$amplify/env/nueink-api";
import { initializeAmplifyClient } from '../../shared/initializeClient';

import AccountRouter from './routers/AccountRouter';
import { NueInkRepositoryFactory } from "@nueink/aws";

// Initialize the data client and repository factory
const dataClient = await initializeAmplifyClient(env);
NueInkRepositoryFactory.getInstance(dataClient);

const app = express();
app.use(express.json());
app.use(cors());
app.use(AccountRouter);
//
const handleRequest = serverless(app);

export const handler = async (event: any, context: any) => {
    return await handleRequest(event, context);
};
