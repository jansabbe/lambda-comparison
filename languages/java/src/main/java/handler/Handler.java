
package handler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import static java.lang.System.getenv;

public class Handler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private final DynamoDbClient dynamoDbClient = DynamoDbClient.create();
    private final String currentRun = getenv("CURRENT_RUN");
    private final String tableName = getenv("TABLE_NAME");
    private final ObjectMapper objectMapper = new ObjectMapper().configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            Customer customer = objectMapper.readValue(event.getBody(), Customer.class);
            customer.setId(context.getAwsRequestId());
            customer.setNote(String.format("This customer was saved during run %s", currentRun));

            Map<String, AttributeValue> addressItem = new HashMap<>();
            addressItem.put("street", AttributeValue.builder().s(customer.getAddress().getStreet()).build());
            addressItem.put("postalCode", AttributeValue.builder().s(customer.getAddress().getPostalCode()).build());
            addressItem.put("city", AttributeValue.builder().s(customer.getAddress().getCity()).build());
            Map<String, AttributeValue> customerItem = new HashMap<>();
            customerItem.put("id", AttributeValue.builder().s(customer.getId()).build());
            customerItem.put("name", AttributeValue.builder().s(customer.getName()).build());
            customerItem.put("note", AttributeValue.builder().s(customer.getNote()).build());
            customerItem.put("address", AttributeValue.builder().m(addressItem).build());
            dynamoDbClient.putItem(b -> b
                    .tableName(tableName)
                    .item(customerItem));

            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(200)
                    .withBody(objectMapper.writeValueAsString(customer));
        } catch (IOException e) {
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(500)
                    .withBody(e.getMessage());
        }
    }

}
