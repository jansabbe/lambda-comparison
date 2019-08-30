import cdk = require('@aws-cdk/core');
import {Code, Function, Runtime} from "@aws-cdk/aws-lambda";
import {LambdaIntegration, RestApi} from "@aws-cdk/aws-apigateway";
import * as path from "path";
import {Duration, RemovalPolicy} from "@aws-cdk/core";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {PolicyStatement} from '@aws-cdk/aws-iam';
import {AttributeType, BillingMode, Table} from "@aws-cdk/aws-dynamodb";

interface Language {
    lang: string,
    handler: string,
    runtime: Runtime,
    code: Code
}

const root = path.join(__dirname, "..", "..");
const languageRoot = path.join(root, "languages");
const languages: Language[] = [
    {
        lang: "nodejs",
        handler: "handler.handle",
        runtime: Runtime.NODEJS_10_X,
        code: Code.fromAsset(path.join(languageRoot, "nodejs", "bin"))
    },
    {
        lang: "csharp",
        handler: "CsharpHandlers::AwsDotnetCsharp.Handler::Handle",
        runtime: Runtime.DOTNET_CORE_2_1,
        code: Code.fromAsset(path.join(languageRoot, "csharp", "bin", "Release", "netcoreapp2.1", "csharp.zip"))
    },
    {
        lang: "go",
        handler: "handler",
        runtime: Runtime.GO_1_X,
        code: Code.fromAsset(path.join(languageRoot, "go", "bin"))
    },
    {
        lang: "java",
        handler: "handler.Handler",
        runtime: Runtime.JAVA_8,
        code: Code.fromAsset(path.join(languageRoot, "java", "build", "distributions", "handler.zip"))
    },
    {
        lang: "python",
        handler: "handler.handle",
        runtime: Runtime.PYTHON_3_7,
        code: Code.fromAsset(path.join(languageRoot, "python", "bin"))
    }
];

export class LambdaComparisonStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const api = new RestApi(this, "default-api");

        let functionArns: { [key: string]: string } = {};

        for (const {lang, code, handler, runtime} of languages) {
            const table = new Table(this, `${lang}-customer`, {
                partitionKey: {name: 'id', type: AttributeType.STRING},
                removalPolicy: RemovalPolicy.DESTROY,
                billingMode: BillingMode.PAY_PER_REQUEST
            });

            const functionHandler = new Function(this, `${lang}-handler`, {
                code,
                handler,
                runtime,
                environment: {
                    "CURRENT_RUN": "NA",
                    "TABLE_NAME": table.tableName
                },
                timeout: Duration.seconds(30),
                logRetention: RetentionDays.THREE_DAYS,
                memorySize: 192
            });

            table.grantReadWriteData(functionHandler);
            functionArns[`RESTART_${lang.toUpperCase()}`] = functionHandler.functionArn;

            api.root
                .addResource(lang)
                .addMethod("POST", new LambdaIntegration(functionHandler));
        }


        const coldStartForcer = new Function(this, 'cold-start-handler', {
            code: Code.fromAsset(path.join(root, "coldstarter", "bin")),
            runtime: Runtime.NODEJS_10_X,
            handler: "coldstart.restartFunctions",
            environment: functionArns
        });
        coldStartForcer.addToRolePolicy(new PolicyStatement({
            resources: Object.values(functionArns),
            actions: ["lambda:*"]
        }));

        api.root
            .addResource("restart")
            .addMethod("POST", new LambdaIntegration(coldStartForcer));
    }
}
