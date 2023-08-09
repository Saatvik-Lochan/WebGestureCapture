export const backend_url = "https://gesturelogger.com:8000";

export interface GestureClassLocator {
    project_name: string;
    gesture_id: string;
}

function addBufferToFormData(buffer: ArrayBuffer, formData: FormData) {
    formData.append('data', new Blob([buffer]));
    return formData
}

function getFormDataFrom(gestureLocator: GestureLocator) {
    const formData = new FormData();
    formData.append('project_name', gestureLocator.project_name);
    formData.append('participant_id', gestureLocator.participant_id);
    formData.append('trial_id', gestureLocator.trial_id);
    formData.append('gesture_index', gestureLocator.gesture_index);
    return formData
}

export async function startHandGestureTransfer(gestureLocator: GestureLocator) {
    const formData = getFormDataFrom(gestureLocator);

    return await fetch(
        `${backend_url}/gesture-data/start-transfer`, {
        method: 'POST',
        body: formData
    }
    );
}

export async function sendHandGestureBatch(data: ArrayBuffer, gestureLocator: GestureLocator) {
    const formData = addBufferToFormData(data, getFormDataFrom(gestureLocator));

    const response = await fetch(
        `${backend_url}/gesture-data/append-data`, {
        method: 'POST',
        body: formData
    }
    );

    if (response.status == 201)
        console.log(`sent ${data.byteLength} bytes of gesture data successfully`);

    return response;
}

// handles sending the data with a POST request
export async function sendData(data: object, route = "", method = "POST") {
    return await fetch(`${backend_url}/${route}`, {
        method,
        body: JSON.stringify(data),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
}

export async function getNextTrial(project_name: string, participant_id: string) {
    const response = await fetch(
        `${backend_url}/trial/next-trial/${project_name}/${participant_id}`, {
        method: 'GET',
    }
    );

    return response
}

export async function completeTrial(trial_id: string, project_name: string, participant_id: string) {
    return await fetch(
        `${backend_url}/trial/complete-trial/${project_name}/${participant_id}/${trial_id}`, {
        method: 'POST',
    }
    );
}

// http requests for demonstration
export async function startDemonstrationTransfer(shortCode: string) {
    const result = await fetch(`${backend_url}/demonstration/start-transfer/${shortCode}`, {
        method: "POST",
    })

    return { status: result.status == 201, locator: await result.json() };
}

export async function sendDemonstrationBatch(data: ArrayBuffer, shortcode: string) {
    const formData = addBufferToFormData(data, new FormData());

    const response = await fetch(
        `${backend_url}/demonstration/append-data/${shortcode}`, {
        method: 'POST',
        body: formData
    }
    );

    if (response.status == 201)
        console.log(`sent ${data.byteLength} bytes of gesture data successfully`);

    return response;
}

export async function shortCodeExists(shortCode: string) {
    const result = await fetch(
        `${backend_url}/demonstration/shortcode-exists/${shortCode}`, {
        method: 'GET',
    }
    );

    return { status: result.status == 200, locator: await result.json() };
}

export async function getDemonstration(project_name: string, gesture_id: string) {
    const response = await fetch(
        `${backend_url}/demonstration/get-demonstration/${project_name}/${gesture_id}`, {
        method: 'GET',
    }
    );

    if (response.status != 200) return null;

    const textDecoder = new TextDecoder('utf8');
    const reader = response.body.getReader();
    let allText = "";

    for (; ;) {
        const { value: chunk, done: readerDone } = await reader.read();

        if (readerDone) break;

        allText = allText + textDecoder.decode(chunk);
    }

    return allText.split("\n").map(line => line.split(",").map(parseFloat)).flat();
}