const backend_url = "http://185.164.136.22:3000/";

// formatters
function formatHandData(handData: any, title: string) {
    return {
        title: title,
        data: handData
    }
}

// handles sending the data with a POST request
async function sendData(data: object, route = "") {
    return await fetch(`${backend_url}/${route}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
}

export { sendData }