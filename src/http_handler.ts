const backend_url = "https://gesturelogger.com:8000";

async function sendHandGestureBatch(data: ArrayBuffer, gestureLocator: GestureLocator) {
    const formData = new FormData();
    formData.append('project_name', gestureLocator.project_name);
    formData.append('participant_id', gestureLocator.participant_id);
    formData.append('trial_id', gestureLocator.trial_id);
    formData.append('gesture_index', gestureLocator.gesture_index.toFixed(0));
    formData.append('data', new Blob([data]));

    console.log(formData);

    return await fetch(
        `${backend_url}/gesture-data/append-data`, {
            method: 'POST',
            body: formData
        }
    );
}

// handles sending the data with a POST request
async function sendData(data: object, route = "", method="POST") {
    return await fetch(`${backend_url}/${route}`, {
        method,
        body: JSON.stringify(data),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
}

export { sendData, sendHandGestureBatch, backend_url}