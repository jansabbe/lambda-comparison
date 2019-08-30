package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-lambda-go/lambdacontext"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"os"
)

var currentRun, _ = os.LookupEnv("CURRENT_RUN")
var tableName, _ = os.LookupEnv("TABLE_NAME")
var dynamoDbClient = dynamodb.New(session.Must(session.NewSession()))

func Handle(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	lambdaContext, _ := lambdacontext.FromContext(ctx)

	customer := Customer{}
	e := json.Unmarshal([]byte(event.Body), &customer)
	if e != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: e.Error()}, nil
	}
	customer.Id = lambdaContext.AwsRequestID
	customer.Note = fmt.Sprintf("This customer was saved during run %s", currentRun)

	_, e = dynamoDbClient.PutItemWithContext(ctx, &dynamodb.PutItemInput{
		TableName: &tableName,
		Item:      map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(customer.Id)},
			"name": {S: aws.String(customer.Name)},
			"note": {S: aws.String(customer.Note)},
			"address": {M: map[string]*dynamodb.AttributeValue{
				"street": {S: aws.String(customer.Address.Street)},
				"postalCode": {S: aws.String(customer.Address.PostalCode)},
				"city":{S: aws.String(customer.Address.City)},
			}},
		},
	})
	if e != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: e.Error()}, nil
	}

	jsonBytes, _ := json.Marshal(customer)
	return events.APIGatewayProxyResponse{
		Body:       string(jsonBytes),
		StatusCode: 200,
	}, nil
}

func main() {
	lambda.Start(Handle)
}

type Customer struct {
	Id      string
	Name    string
	Note    string
	Address Address
}

type Address struct {
	Street     string
	PostalCode string
	City       string
}
