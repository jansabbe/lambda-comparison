import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from "aws-lambda";
import DynamoDB = require("aws-sdk/clients/dynamodb");

const currentRun = process.env.CURRENT_RUN!;
const tableName = process.env.TABLE_NAME!;
const client = new DynamoDB();

export async function handle(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const customer: Customer = JSON.parse(event.body!);
    customer.Id = context.awsRequestId;
    customer.Note = `This customer was saved during run ${currentRun}`;

    await client.putItem({
        TableName: tableName,
        Item: {
            "id": {S: customer.Id},
            "name": {S: customer.Name},
            "note": {S: customer.Note},
            "address": {
                M: {
                    "street": {S: customer.Address.Street},
                    "postalCode": {S: customer.Address.PostalCode},
                    "city": {S: customer.Address.City},
                }
            }
        }
    }).promise();

    return {
        statusCode: 200,
        body: JSON.stringify(customer)
    }
}

interface Customer {
    Id: string;
    Name: string;
    Note: string;
    Address: Address;
}

interface Address {
    Street: string;
    PostalCode: string;
    City: string;
}