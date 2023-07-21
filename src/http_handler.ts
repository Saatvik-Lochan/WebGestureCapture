import { project, participant, trial, gesture } from "./main";
const backend_url = "https://gesturelogger.com:8000";

// formatters
function formatHandData(handData: any, title: string) {
    return {
        title: title,
        data: handData
    }
}

async function closeHandGestureBatch() {
    return await fetch(
        `${backend_url}/data/close/${project}/${participant}/${trial}/${gesture}`, {
            method: "POST",
            body: null,
    });
}

async function sendHandGestureBatch(data: ArrayBuffer) {
    const formData = new FormData();
    formData.append('project_name', project);
    formData.append('participant_id', participant);
    formData.append('trial_id', trial);
    formData.append('gesture_index', gesture);
    formData.append('data', new Blob([data]));

    const jsonData = {
        "project_name": project,
        "participant_id": participant,
        "trial_id": trial,
        "gesture_index": gesture,
        "data": data
    }

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

export { sendData, sendHandGestureBatch, closeHandGestureBatch, backend_url}