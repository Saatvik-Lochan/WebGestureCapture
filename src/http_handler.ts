import { project, participant, trial, gesture } from "./main";
const backend_url = "http://185.164.136.22:3000/";

// formatters
function formatHandData(handData: any, title: string) {
    return {
        title: title,
        data: handData
    }
}

async function sendHandGestureBatch(data: ArrayBuffer) {
    return await fetch(
        `${backend_url}/append-data/${project}/${participant}/${trial}/${gesture}`, {
            method: "POST",
            body: data,
    });
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

export { sendData, sendHandGestureBatch }