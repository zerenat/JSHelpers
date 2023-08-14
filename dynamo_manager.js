const { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand, ScanCommand  } = require("@aws-sdk/client-dynamodb");
const { error } = require("console");
const crypto = require("crypto");
const creds = require("./credentials.json")
const objectTemplate = require("./input_template.json")


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
			data: allResults,
			error: null
        };
 	} catch (error) {
      	if (error.name === 'ResourceNotFoundException') {
          	return {
				message: "Table not found.",
				data: null,
				error: error,
          	};
      } else if (error.name === 'RequestLimitExceeded') {
            return {
				message: "Request limit exceeded.",
				data: null,
				error: error,
            };
      } else {
          	return {
				message: "Failed to retrieve data.",
				data: null,
				error: error,
            };
        }
  	}
}

async function putItems(tableName, items) {
	if (!Array.isArray(items)) {
		items = [items]
	}
	let resultSet = [];
	let error = False;

	items.forEach(async (item) => {
		try {
			let result = await dynamoDbClient.send(new PutItemCommand());
			resultSet.push({
				item: item,
				message: "Insertion successful",
				result: result,
				error: null
			})
		} catch (error) {
			error = True;
			if (error.name === 'ResourceNotFoundException') {
				resultSet.push({
					item: item,
					message: "Table not found",
					statusCode: 404,
					result: result,
					error: error
				})
			} else if (error.name === 'RequestLimitExceeded') {
				resultSet.push({
					item: item,
					message: "Request limit exceeded",
					statusCode: 429,
					result: result,
					error: error
				})
			} else {
				resultSet.push({
					item: item,
					message: "Failed to insert data",
					statusCode: 500,
					result: result,
					error: error
				})
			}
		} finally {
			let message = "Data entry completed successfully.";
			if (error) {
				message = "Data entry completed with errors."
			}
			return {
				message: message,
				results: resultSet
			}
		}
    });
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
	console.log(creds);
})();