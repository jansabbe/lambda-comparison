import os
from dataclasses import dataclass, field
from dataclasses_json import dataclass_json, config
import boto3

client = boto3.client('dynamodb')
current_run = os.getenv("CURRENT_RUN")
table_name = os.getenv("TABLE_NAME")


@dataclass_json
@dataclass
class Address:
    street: str = field(metadata=config(field_name='Street'))
    postal_code: str = field(metadata=config(field_name='PostalCode'))
    city: str = field(metadata=config(field_name='City'))


@dataclass_json
@dataclass
class Customer:
    name: str = field(metadata=config(field_name='Name'))
    address: Address = field(metadata=config(field_name='Address'))
    id: str = field(metadata=config(field_name='Id'), default='')
    note: str = field(metadata=config(field_name='Note'), default='')


def handle(event, context):
    customer = Customer.from_json(event['body'])
    customer.id = context.aws_request_id
    customer.note = f"This customer was saved during run {current_run}"

    client.put_item(
        TableName=table_name,
        Item={
            'id': {'S': customer.id},
            'name': {'S': customer.name},
            'note': {'S': customer.note},
            'address': {'M': {
                'street': {'S': customer.address.street},
                'postalCode': {'S': customer.address.postal_code},
                'city': {'S': customer.address.city},
            }}
        }
    )
    return {
        "statusCode": 200,
        "body": customer.to_json()
    }
