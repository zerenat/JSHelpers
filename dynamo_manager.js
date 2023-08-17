const { DynamoDBClient, 
		BatchWriteItemCommand,  		
		ScanCommand,
		GetItemCommand } = require("@aws-sdk/client-dynamodb");


exports.handler = async (event, context) => {
	const action = event.action;
	const table = event.table;
	const inputs = event.data;
	switch (action) {
		case 'get':
			if (table) {
				if (inputs) {
					return getItems(table, inputs);
				} else {
					return getItems(table);
				}
			} else {
				return {
					message: "No table presented",
					result: null,
					error: null
				}				
			}
		case 'insert':
			if (inputs) {
				return insertItems(table, inputs);	
			} else {
				return {
					message: "No data presented",
					result: null,
					error: null
				}
			}
		case 'delete':
			if (inputs) {
				return deleteItems(table, inputs);	
			} else {
				return {
					message: "No data presented",
					result: null,
					error: null
				}
			}
		default:
			return {
				message: "action is either undefined or does not match any available operations",
				result: null,
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

async function getItems(tableName, inputs = null) {
	let allResults = [];
	let lastEvaluatedKey = null;
	let params = {
		TableName: tableName
	};
	try {
		if (inputs) {
			if (inputs.hasOwnProperty("keys") && inputs.keys) {
				let key = null
				key = {[inputs.keys.partitionKey]: inputs.keys.partitionKeyValue}
				if (inputs.hasOwnProperty("sortKey")) {
					key[sortKey] = sortKeyValue;
				}
				params.Key = key;
				const result = await dynamoDbClient.send(new GetItemCommand(params));
				return {
					message: "Data retrieval successful",
					result: result,
					error: null,
				}
			}
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
			};
		}
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

async function insertItems(tableName, inputs) {
	let tableItems = [];
	if (inputs.hasOwnProperty("items") && inputs.items) {
		let items = inputs.items;
		if (!Array.isArray(items)) {
			items = [items]
		}
		if (items.length > 0) {
			items.forEach(async (item) => {
				tableItems.push({"PutRequest": {
					"Item": item
				}})
			});
	}
	} else {
		return {
			message: "No items to insert",
			result: null,
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
		}
	} catch (error) {
		if (error.name === 'ResourceNotFoundException') {
			return {
				message: "Table not found",
				result: result,
				error: error
			}
		} else if (error.name === 'RequestLimitExceeded') {
			return {
				message: "Request limit exceeded",
				result: result,
				error: error
			}
		} else {
			return {
				message: "Failed to insert data",
				result: result,
				error: error
			}
		}
	}
}

async function deleteItems(tableName, inputs) {
	let rowValues = [];
	if (inputs.hasOwnProperty("keys") && inputs.keys) {
		let keys = inputs.keys;
		if (!Array.isArray(keys)) {
			keys = [keys]
		}
		if (keys.length > 0) {
			keys.forEach(key => {
				rowValues.push({
					DeleteRequest: {
						Key: {
							[key.partitionKey]: key.partitionKeyValue
						}
					}
				});
			});
		}
 	} else {
        return {
            message: "No items to delete",
            result: null,
            error: null
        };
    }
    let result = null;
    try {
        const command = new BatchWriteItemCommand({"RequestItems": { [tableName]: rowValues }});
		result = await dynamoDbClient.send(command);
		return {
			message: "Data deletion complete",
			result: result,
		}
	} catch (error) {
		if (error.name === 'ResourceNotFoundException') {
			return {
				message: "Table not found",
				result: result,
				error: error
			}
		} else if (error.name === 'RequestLimitExceeded') {
			return {
				message: "Request limit exceeded",
				result: result,
				error: error
			} 
		} else if (error.name === TypeError) {
			return {
				message: "Invalid request data",
				result: result,
				error: error
			}
		} else {
			return {
				message: "Failed to delete items",
				result: result,
				error: error
			}
		}
	}
}


