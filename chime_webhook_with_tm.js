function sendWebhook(targetUrl, payload){
    return new Promise(function(resolve, reject) {
        GM.xmlHttpRequest({
            method: "POST",
            url: targetUrl,
            headers: {"Content-Type": "application/json"},
            data: JSON.stringify({'Content': payload}),
            onload: function(response){
                let status = response.status
                if (status === 200){
                    resolve(status)
                } else {
                    console.log('Request failed with status: ' + status)
                    reject(status)
                }
            }
        })
    });
}