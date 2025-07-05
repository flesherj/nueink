import type { APIGatewayProxyHandler } from "aws-lambda";
import {getAmplifyDataClientConfig} from '@aws-amplify/backend/function/runtime';
import { env } from "$amplify/env/nueink-api";
import {NueInkAmplify} from "../../../index";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env
);

const nueInk = new NueInkAmplify(resourceConfig, libraryOptions);

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log("event", event);
    return {
        statusCode: 200,
        // Modify the CORS settings below to match your specific requirements
        headers: {
            "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
            "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
        },
        body: JSON.stringify("Hello from myFunction!"),
    };
};
