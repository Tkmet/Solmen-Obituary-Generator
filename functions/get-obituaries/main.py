import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb_resource = boto3.resource("dynamodb")
table = dynamodb_resource.Table("obituary-30152819")

def lambda_handler(event, context):
    response = table.scan()

    try:
        return {
            "statusCode": 200,
            "body" : json.dumps(response["Items"])
        }
    except Exception as exp:
        print(exp)
        return {
            "statusCode": 500,
            "body" : str(exp)
        }