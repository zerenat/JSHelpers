const { DynamoDBClient, BatchWriteItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand, ScanCommand  } = require("@aws-sdk/client-dynamodb");
const { error, table } = require("console");
const crypto = require("crypto");
const creds = require("./credentials.json")


const dynamoDbClient = new DynamoDBClient({
  region: "eu-west-1",
  credentials: {
    accessKeyId: creds.accessKeyId,
    secretAccessKey: creds.secretAccessKey,
  }
});

async function getItems(tableName, key = null) {
	let allResults = [];
	let lastEvaluatedKey = null;
	let params = null;
	try {
		if (key) {
			params = {
				TableName: tableName,
				Key: key,
			};
		} else {
			params = {
				TableName: tableName,
			};
		}

		do {
			if (lastEvaluatedKey) {
				params.ExclusiveStartKey = lastEvaluatedKey;
			}
			const result = await dynamoDbClient.send(new ScanCommand(params));
			allResults.push(...result.Items);
			lastEvaluatedKey = result.LastEvaluatedKey;
			await new Promise((resolve) => {setTimeout(resolve, 1000)});
		} while (lastEvaluatedKey);

		return {
			message: "Data retrieval successful",
			result: allResults,
			error: null
        };
 	} catch (error) {
      	if (error.name === 'ResourceNotFoundException') {
          	return {
				message: "Table not found.",
				result: null,
				error: error,
          	};
      } else if (error.name === 'RequestLimitExceeded') {
            return {
				message: "Request limit exceeded.",
				result: null,
				error: error,
            };
      } else {
          	return {
				message: "Failed to retrieve data.",
				result: null,
				error: error,
            };
        }
  	}
}

async function putItems(tableName, items) {
	if (!Array.isArray(items)) {
		items = [items]
	}
	let tableItems = [];
	if (items.length > 0) {
		items.forEach(async (element) => {
			tableItems.push({"PutRequest": {
				"Item": element
			}})
		});
	} else {
		return {
			message: "No items to insert.",
			result: null,
			statusCode: 400,
			error: null
        };
	}
	try {
		const command = new BatchWriteItemCommand({"RequestItems": {[tableName]: tableItems}});
		result = await dynamoDbClient.send(command);
		return {
			message: "Data insertion complete",
			result: result,
			statusCode: 200
		}
	} catch (error) {
		if (error.name === 'ResourceNotFoundException') {
			return {
				message: "Table not found",
				result: result,
				statusCode: 404,
				error: error
			}
		} else if (error.name === 'RequestLimitExceeded') {
			return {
				message: "Request limit exceeded",
				result: result,
				statusCode: 429,
				error: error
			}
		} else {
			return {
				message: "Failed to insert data",
				result: result,
				statusCode: 500,
				error: error
			}
		}
	}
}

async function deleteItems(tableName, keys) {
	const params = {
    	TableName: tableName,
    	Key: keys,
  	};

	try {
		await dynamoDbClient.send(new DeleteItemCommand(params));
	} catch (error) {
		throw error;
	}
}

function createUuid () {
	return crypto.randomUUID();
}

(async () => {
	return putItems("COBIA_Manual_Changes", input);
})().then((result)=>{console.log(result);});