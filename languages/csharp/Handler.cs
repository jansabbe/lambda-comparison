using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Newtonsoft.Json;
using Amazon.DynamoDBv2;
using System.Threading.Tasks;
using System.Collections.Generic;
using Amazon.DynamoDBv2.Model;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]
namespace AwsDotnetCsharp
{
    public class Handler
    {
        private AmazonDynamoDBClient client = new AmazonDynamoDBClient();
        private string currentRun = System.Environment.GetEnvironmentVariable("CURRENT_RUN");
        private string tableName = System.Environment.GetEnvironmentVariable("TABLE_NAME");
        
        public async Task<APIGatewayProxyResponse> Handle(APIGatewayProxyRequest request, ILambdaContext context)
        {
            var customer = JsonConvert.DeserializeObject<Customer>(request.Body);
            customer.Id = context.AwsRequestId;
            customer.Note = $"This customer was saved during run {currentRun}";

            await client.PutItemAsync(tableName, new Dictionary<string, AttributeValue> {
              { "id", new AttributeValue { S = customer.Id }},
              { "name", new AttributeValue { S = customer.Name }},
              { "note", new AttributeValue { S = customer.Note }},
              { "address", new AttributeValue { M = new Dictionary<string, AttributeValue> {
                  { "street", new AttributeValue { S = customer.Address.Street }},
                  { "postalCode", new AttributeValue { S = customer.Address.PostalCode }},
                  { "city", new AttributeValue { S = customer.Address.City }},
                }
              }}
            });

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonConvert.SerializeObject(customer)
            };
        }
    }

    public class Customer
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Note { get; set; }
        public Address Address { get; set; }
    }

    public class Address
    {
        public string Street { get; set; }
        public string PostalCode { get; set; }
        public string City { get; set; }
    }
}
