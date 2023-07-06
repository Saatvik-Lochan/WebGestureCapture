const backend_url = "https://3f07f95fd1dda8.lhr.life";

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