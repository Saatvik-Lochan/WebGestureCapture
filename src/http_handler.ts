const backend_url = "https://gesturelogger.com:8000";

function getFormDataFrom(gestureLocator: GestureLocator) {
    const formData = new FormData();
    formData.append('project_name', gestureLocator.project_name);
    formData.append('participant_id', gestureLocator.participant_id);
    formData.append('trial_id', gestureLocator.trial_id);
    formData.append('gesture_index', gestureLocator.gesture_index);
    return formData
}

async function startHandGestureTransfer(gestureLocator: GestureLocator) {
    const formData = getFormDataFrom(gestureLocator);

    return await fetch(
        `${backend_url}/gesture-data/start-transfer`, {
            method: 'POST',
            body: formData
        }
    );
}

async function sendHandGestureBatch(data: ArrayBuffer, gestureLocator: GestureLocator) {
    const formData = getFormDataFrom(gestureLocator);
    formData.append('data', new Blob([data]));

    console.log("data about to be sent");

    const response = await fetch(
        `${backend_url}/gesture-data/append-data`, {
            method: 'POST',
            body: formData
        }
    );

    console.log("response received")

    return response;
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

async function getNextTrial(project_name: string, participant_id: string) {
    const response = await fetch(
        `${backend_url}/trial/next-trial/${project_name}/${participant_id}`, {
            method: 'GET',
        }
    );

    return response
}

async function completeTrial(trial_id: string, project_name: string, participant_id: string) {
    return await fetch(
        `${backend_url}/trial/complete-trial/${project_name}/${participant_id}/${trial_id}`, {
            method: 'POST',
        }
    );
}

export { sendData, sendHandGestureBatch, backend_url, startHandGestureTransfer, getNextTrial, completeTrial}