import {getAmplifyDataClientConfig} from '@aws-amplify/backend/function/runtime';
import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';

import { env } from "$amplify/env/nueink-api";

import AccountRouter from './routers/AccountRouter';
import {NueInkAmplifyBuilder} from "../../../index";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

NueInkAmplifyBuilder.builder().withResourceConfig(resourceConfig).withLibraryOptions(libraryOptions).build();

const app = express();
app.use(express.json());
app.use(cors());
app.use(AccountRouter);

const handleRequest = serverless(app);

export const handler = async (event: any, context: any) => {
    return await handleRequest(event, context);
};
