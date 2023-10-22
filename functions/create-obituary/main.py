# add your get-obituaries function here
import json
import boto3
import base64
import requests
import time
import hashlib
from requests_toolbelt.multipart import decoder

dynamodb_resource = boto3.resource("dynamodb")
table = dynamodb_resource.Table("obituary-30152819")

#upload to cloundinary
api_key = "488181631272866" 
cloud_name = "dbzq3p0nr"

client = boto3.client('ssm')
response = client.get_parameters_by_path(
    Path='/the-last-show/',
    Recursive=True,
    WithDecryption=True
)
params = {item['Name']: item['Value'] for item in response['Parameters']}
api_key_secret = params['/the-last-show/cloudinary-api-key']
chat_api_key = params['/the-last-show/chatGpt-api-key']
print(params)
print(api_key)
print(chat_api_key)

def lambda_handler(event, context):

    body = event["body"]
    if event["isBase64Encoded"]:
        body = base64.b64decode(body)
    content_type = event["headers"]["content-type"]
    data = decoder.MultipartDecoder(body, content_type)

    binary_data = [part.content for part in data.parts]
    name = binary_data[1].decode()
    born = binary_data[2].decode()
    died = binary_data[3].decode()
    id = binary_data[4].decode()

    keyFile = "/tmp/image.png"
    with open(keyFile, "wb") as f:
        f.write(binary_data[0])
    
    #the cloudinary interaction
    cloudinary_response = upload_to_cloudinary(keyFile, resource_type="image")
    image_url = cloudinary_response["secure_url"]

    #chat gpt interaction
    prompt = f"write an obituary about a fictional character named {name} who was born on {born} and died on {died}."
    obituary = gpt(prompt)

    #aws polly interaction
    voice_prompt = aws_polly(obituary)
    res_mp3 = upload_to_cloudinary(
        voice_prompt, resource_type="raw")
    voice_url = res_mp3["secure_url"]

    content = {
        "id": id,
        "name": name,
        "born": born,
        "died": died,
        "image_url": image_url,
        "obituary": obituary,
        "voice_url": voice_url
    }

    try:
        table.put_item(Item=content)
        return {
            "statusCode": 201, 
            "body": json.dumps(content)
        }
    except Exception as exp:
        print(exp)
        return {
            "statusCode": 500, 
            "body": json.dumps(
                {
                    "message": str(exp)
                }
            )
        }
    

# chat gpt portion

def gpt(prompt):
    url = "https://api.openai.com/v1/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {chat_api_key}"
    }

    body = {
        "model": "text-curie-001",
        "prompt": prompt,
        "max_tokens": 600,
        "temperature": 0.9
    }
    response = requests.post(url, headers=headers, json=body)
    print(response.json())

    return response.json()["choices"][0]["text"]

# upload to cloudinary

def upload_to_cloudinary(filename, resource_type):
    api_key = "488181631272866"
    cloud_name = "dbzq3p0nr"
    body = {
        "api_key": api_key
    }
    files = {
        "file": open(filename, "rb")
    }
    body["signature"] = create_signature(body, api_key_secret)
    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/upload"
    res = requests.post(url, files=files, data=body)
    return res.json()

# creating a signature

def create_signature(body, secret_key):
    exclude = ["api_key", "resource_type", "cloud_name"]
    timestamp = int(time.time())
    body["timestamp"] = timestamp

    sorted_body = sort_dictionary(body, exclude)
    query_string = query_create_string(sorted_body)

    query_string_appended = f"{query_string}{secret_key}"
    hashed = hashlib.sha1(query_string_appended.encode())
    return hashed.hexdigest()

def sort_dictionary(dictionary, exclude):
    return {k: v for k, v in sorted(dictionary.items(), key=lambda item: item[0]) if k not in exclude}

def query_create_string(body):
    query_string = ""
    for idx, (k, v) in enumerate(body.items()):
        if idx == 0:
            query_string = f"{k}={v}"
        else:
            query_string = f"{query_string}&{k}={v}"
    return query_string

# aws polly portion
def aws_polly(obituary):
    client = boto3.client('polly')
    response = client.synthesize_speech(
        Engine='standard',
        LanguageCode='en-US',
        OutputFormat='mp3',
        Text=obituary,
        TextType='text',
        VoiceId="Joanna"
    )

    filename = "/tmp/polly.mp3"
    with open(filename, "wb") as f:
        f.write(response["AudioStream"].read())
    return filename