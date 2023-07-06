const backend_url = "https://b3a6414c15608f.lhr.life";

// formatters
function formatHandData(handData: any, title: string) {
    return {
        title: title,
        data: handData
    }
}


// handles sending the data with a POST request
async function sendData(data: object, route = "") {
    await fetch(`${backend_url}/${route}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
}

export { sendData }