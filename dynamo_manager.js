const { DynamoDBClient, 
		BatchWriteItemCommand,  
		ScanCommand,
		GetItemCommand } = require("@aws-sdk/client-dynamodb");


exports.handler = async (event, context) => {
	const action = event.action;
	const table = event.table;
	const payload = event.payload;
	switch (action) {
		case 'get':
			let partitionKey = null;
			let sortKey = null;
			if (payload) {
				partitionKey = payload.partitionKey || null;
				sortKey = payload.sortKey || null;
			}
			return getItems(table, partitionKey, sortKey);
		case 'insert':
			payload = data.payload || null;
			if (payload) {
				return insertItems(table, payload);	
			} else {
				return {
					message: "Insert payload is undefined",
					result: null,
					statusCode: 400,
					error: null
				}
			}
		case 'delete':
			if (payload) {
				return deleteItems(table, payload);	
			} else {
				return {
					message: "Delete payload is undefined",
					result: null,
					statusCode: 400,
					error: null
				}
			}
		default:
			return {
				message: "action is either undefined or does not match any available operations",
				result: null,
				statusCode: 400,
				error: null
			}
	}
}

const dynamoDbClient = new DynamoDBClient({
	region: "eu-west-1",
	credentials: {
	  accessKeyId: process.env.accessKeyId,
	  secretAccessKey: process.env.secretAccessKey,
	}
  });

async function getItems(tableName, partitionKey = null, sortKey = null) {
	let allResults = [];
	let lastEvaluatedKey = null;
	let params = {
		TableName: tableName
	};
	try {
		if (partitionKey) {
			let key = {[partitionKey.name]: {"S": partitionKey.value}}
			if (sortKey) {
				key[sortKey.name] = sortKey.value;
			}
			params.Key = key
			const result = await dynamoDbClient.send(new GetItemCommand(params));
			return {
				message: "Data retrieval successful",
				result: result,
				error: null,
				statusCode: 200
			};
		} else {
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
				error: null,
				statusCode: 200
			};
		}
	} catch (error) {
		if (error.name === 'ResourceNotFoundException') {
			return {
				message: "Table not found.",
				result: null,
				error: error,
				statusCode: 404
			};
	} else if (error.name === 'RequestLimitExceeded') {
			return {
				message: "Request limit exceeded.",
				result: null,
				error: error,
				statusCode: 429
			};
	} else {
			return {
				message: "Failed to retrieve data.",
				result: null,
				error: error,
				statusCode: 500
			};
		}
	}
}

async function insertItems(tableName, items) {
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
			message: "No items to insert",
			result: null,
			statusCode: 400,
			error: null
		};
	}
	let result = null;
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

async function deleteItems(tableName, columnName, values) {
	if (!Array.isArray(values)) {
		values = [values]
	}
	let rowValues = [];
	if (values.length > 0) {
		values.forEach(async (value) => {
			rowValues.push({"DeleteRequest": {
				Key: {
					[columnName]: value
				}
			}})
		});
	} else {
		return {
			message: "No items to delete",
			result: null,
			statusCode: 400,
			error: null
		};
	}
	let result = null;
	try {
		const command = new BatchWriteItemCommand({"RequestItems": {[tableName]: rowValues}});
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
				message: "Failed to delete items",
				result: result,
				statusCode: 500,
				error: error
			}
		}
	}
}
