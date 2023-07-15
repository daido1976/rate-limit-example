use aws_sdk_dynamodb::{
    operation::create_table::CreateTableError,
    types::{
        error::ResourceInUseException, AttributeDefinition, KeySchemaElement, KeyType,
        ProvisionedThroughput, ScalarAttributeType,
    },
    Client,
};
use std::fs;

/// Lists your DynamoDB tables in the default Region or us-east-1 if a default Region isn't set.
#[tokio::main]
async fn main() {
    let config = aws_config::from_env()
        .profile_name("local")
        .endpoint_url("http://localhost:8000")
        .load()
        .await;

    let client = Client::new(&config);

    let json = fs::read_to_string("./data/rate-limit-table.json").expect("Unable to read file");
    let table_def: serde_json::Value = serde_json::from_str(&json).expect("Unable to parse JSON");

    let table_name = table_def["TableName"].as_str().unwrap().to_string();

    // AttributeDefinitions を読み込む
    let attribute_definitions: Vec<AttributeDefinition> = table_def["AttributeDefinitions"]
        .as_array()
        .unwrap()
        .iter()
        .map(|ad| {
            AttributeDefinition::builder()
                .attribute_name(ad["AttributeName"].as_str().unwrap())
                .attribute_type(ScalarAttributeType::from(
                    ad["AttributeType"].as_str().unwrap(),
                ))
                .build()
        })
        .collect();

    // KeySchema を読み込む
    let key_schema: Vec<KeySchemaElement> = table_def["KeySchema"]
        .as_array()
        .unwrap()
        .iter()
        .map(|ks| {
            KeySchemaElement::builder()
                .attribute_name(ks["AttributeName"].as_str().unwrap())
                .key_type(KeyType::from(ks["KeyType"].as_str().unwrap()))
                .build()
        })
        .collect();

    let provisioned_throughput = ProvisionedThroughput::builder()
        .read_capacity_units(
            table_def["ProvisionedThroughput"]["ReadCapacityUnits"]
                .as_i64()
                .unwrap(),
        )
        .write_capacity_units(
            table_def["ProvisionedThroughput"]["WriteCapacityUnits"]
                .as_i64()
                .unwrap(),
        )
        .build();

    let create_table_response = client
        .create_table()
        .table_name(table_name.clone())
        .set_key_schema(Some(key_schema))
        .set_attribute_definitions(Some(attribute_definitions))
        .provisioned_throughput(provisioned_throughput)
        .send()
        .await;

    match create_table_response {
        Ok(_out) => {
            println!("Added table {}", table_name);
        }
        Err(e) => match e.into_service_error() {
            CreateTableError::ResourceInUseException(ResourceInUseException {
                message: _, ..
            }) => {
                println!("already exists table {}", table_name);
            }
            CreateTableError::InternalServerError(e) => {
                eprintln!("Got an internal server error: {}", e);
            }
            CreateTableError::InvalidEndpointException(e) => {
                eprintln!("Got an invalid endpoint exception: {}", e);
            }
            CreateTableError::LimitExceededException(e) => {
                eprintln!("Got a limit exceeded exception: {}", e);
            }
            CreateTableError::Unhandled(e) => {
                eprintln!("Got an unhandled error: {}", e);
            }
            _ => {
                eprintln!("Got an unknown error adding table: {}", table_name);
            }
        },
    }
}
