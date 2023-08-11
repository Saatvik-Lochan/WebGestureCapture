/**
 * The url of to the backend {@link https://github.com/Saatvik-Lochan/WebGestureCaptureBackend | server}
 */
export const backend_url = "https://gesturelogger.com:8000";

/**
 * Used to uniquely identify a gesture class
 * 
 * @remarks does not identify a gesture instance
 */
export interface GestureClassLocator {
    project_name: string;
    gesture_id: string;
}

/**
 * Returns a {@link FormData} object with a buffer as a field
 * @param buffer The {@link ArrayBuffer} to add to `formData`
 * @param formData The {@link FormData} on which to add the data
 * @returns A {@link FormData} object which includes the buffer under the field
 * `'data'`, as a {@link Blob}
 */
function addBufferToFormData(buffer: ArrayBuffer, formData: FormData) {
    formData.append('data', new Blob([buffer]));
    return formData
}

/**
 * Gets the {@link FormData} which descibes a {@link GestureLocator}
 * @param gestureLocator The {@link GestureLocator} to turn into a {@link FormData}
 * @returns A {@link FormData} with fields for each of the fields in the `gestureLocator`
 */
function getFormDataFrom(gestureLocator: GestureLocator) {
    const formData = new FormData();
    formData.append('project_name', gestureLocator.project_name);
    formData.append('participant_id', gestureLocator.participant_id);
    formData.append('trial_id', gestureLocator.trial_id);
    formData.append('gesture_index', gestureLocator.gesture_index);
    return formData
}

/**
 * Tells the server specified in {@link backend_url} that it will soon start
 * the transfer of data.
 * 
 * @remarks Normally followed up by {@link sendHandGestureBatch}
 * @param gestureLocator A {@link GestureLocator} which points to the gesture
 * to start the transfer for
 * @returns A `Promise<Response>` with the result of the transfer
 */
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