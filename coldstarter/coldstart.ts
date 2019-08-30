import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import Lambda from "aws-sdk/clients/lambda";

const crypto = require("crypto");

const lambdaClient = new Lambda();

const functionsToRestart: string[] = Object.entries(process.env)
    .filter(([key, _]) => key.startsWith("RESTART_"))
    .map(([_, value]) => value!);

export async function restartFunctions(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const randomId = crypto.randomBytes(32).toString("base64");
    const request = JSON.parse(event.body!);
    const updates = functionsToRestart.map(funArn => updateCurrentRun(funArn, randomId, request.current_run));

    await Promise.all(updates);

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"status": "OK"})
    }
}

async function updateCurrentRun(funArn: string, randomId: string, currentRun: string) {
    const config = await lambdaClient.getFunctionConfiguration({FunctionName: funArn}).promise();
    const variables = config.Environment ? config.Environment.Variables : {};
    await lambdaClient.updateFunctionConfiguration({
        FunctionName: funArn,
        Environment: {
            Variables: {
                ...variables,
                "RANDOM_ID": randomId,
                "CURRENT_RUN": currentRun || "NA"
            }
        }
    }).promise()
}