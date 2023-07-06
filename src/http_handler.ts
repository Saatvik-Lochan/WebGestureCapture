const backend_url = "https://b2d66f4534ad75.lhr.life";

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