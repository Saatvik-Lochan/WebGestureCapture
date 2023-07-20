import { project, participant, trial, gesture } from "./main";
const backend_url = "http://185.164.136.22:3000/";

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

async function sendHandGestureBatch(data: ArrayBuffer, batchNumber: number) {
    return await fetch(
        `${backend_url}/data/append/${project}/${participant}/${trial}/${gesture}?batchNumber=${batchNumber}`, {
            method: "POST",
            body: data,
    });
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