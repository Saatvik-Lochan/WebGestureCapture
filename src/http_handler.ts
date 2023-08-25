import { handArrayBuffer, handSequence } from "./hand_capture";

/**
 * The url of to the backend {@link https://github.com/Saatvik-Lochan/WebGestureCaptureBackend | server}. Must be set with {@link setBackendUrl}.
 */
export let backend_url = "https://gesturelogger.com:8000";

/**
 * A helper function to set the url that the server communicates with
 * @param newUrl The new backend url
 */
export function setBackendUrl(newUrl: string) {
    backend_url = newUrl;
}

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

/**
 * Sends hand gesture data to the server specified by {@link backend_url}
 * 
 * @remarks {@link startHandGestureTransfer} must be called before this can be called
 * @remarks This function can be called multiple times to append more data
 * @param data An {@link handArrayBuffer} of data to send
 * @param gestureLocator A {@link GestureClassLocator | locator} which uniquely
 * identifies a gesture instance on the server
 * @returns A `Promise<Response>` with the return value
 * 
 * @remarks route: /gesture-data/append-data
 */
export async function sendHandGestureBatch(data: handArrayBuffer, gestureLocator: GestureLocator) {
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

/**
 * Sends arbitraty data to a route on {@link backend_url}
 * @param data An arbitrary object to send.
 * @param route The route to send the data on {@link backend_url}. Defaults to `POST`
 * @param method The HTTP method to use
 * @returns A `Promise<Response>` returned by the {@link backend_url | server}
 */
export async function sendData(data: object, route = "", method: "POST" | "GET" | "PUT" = "POST") {
    return await fetch(`${backend_url}/${route}`, {
        method,
        body: JSON.stringify(data),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
}

/**
 * Fetches the a response with the next trial for a specified participant.
 * 
 * @remarks route: /trial/next-trial/{project_name}/{participant_id}
 * @param project_name The name of the project
 * @param participant_id The id of the participant whose trial is needed
 * @returns A `Promise<Response>` with the trial data if successful
 */
export async function getNextTrial(project_name: string, participant_id: string) {
    const response = await fetch(
        `${backend_url}/trial/next-trial/${project_name}/${participant_id}`, {
        method: 'GET',
    }
    );

    return response
}

/**
 * Marks a trial as complete on the {@link backend_url | server}
 * @param trial_id The id of the trial to mark complete
 * @param project_name The name of the project
 * @param participant_id The id of the participant
 * @returns A `Promise<Response>` from the {@link backend_url | server}
 * 
 * @remarks route: /trial/complete-trial/{project_name}/{participant_id}/{trial_id}
 */
export async function completeTrial(trial_id: string, project_name: string, participant_id: string, redos: number[]) {
    console.log('%chttp_handler.ts line:146 redos', 'color: #007acc;', redos);
    return await fetch(
        `${backend_url}/trial/complete-trial/${project_name}/${participant_id}/${trial_id}`, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(redos)
    });
}

// http requests for demonstration
/**
 * Starts a demonstration. This must be called before {@link sendDemonstrationBatch}.
 * @param shortCode A code which identifies a gesture class on the {@link backend_url | server}
 * @returns An object with two fields: 
 *      - status: a {@link boolean} which indicates the success of the request
 *      - locator: a {@link GestureClassLocator} which points to the gesture of the demonstration that has been started
 * 
 * @remarks route: /demonstration/start-transfer/{shortCode}
 * @see {@link startHandGestureTransfer}
 */
export async function startDemonstrationTransfer(shortCode: string): Promise<{status: boolean, locator: GestureClassLocator}> {
    const result = await fetch(`${backend_url}/demonstration/start-transfer/${shortCode}`, {
        method: "POST",
    })

    return { status: result.status == 201, locator: await result.json() };
}

/**
 * Sends gesture demonstration data to the server specified by {@link backend_url}.
 * 
 * @remarks {@link startDemonstrationTransfer} must be called before this can be called
 * @remarks This function can be called multiple times to append more data
 * @param data An {@link handArrayBuffer} of data to send
 * @param shortcode A code which identifies a gesture class on the {@link backend_url | server}
 * @returns A `Promise<Response>` with the response from the server
 */
export async function sendDemonstrationBatch(data: handArrayBuffer, shortcode: string) {
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

/**
 * Checks if a shortCode exists. Also returns a {@link GestureClassLocator} for the that {@link shortCode}
 * @param shortCode A code which identifies a gesture class on the {@link backend_url | server}
 * @returns An object with two fields: 
 *      - status: a {@link boolean} which indicates the success of the request
 *      - locator: a {@link GestureClassLocator} which points to the gesture of the demonstration that has been started
 * 
 * @remarks route: /demonstration/shortcode-exists/{shortCode}
 */
export async function shortCodeExists(shortCode: string): Promise<{status: boolean, locator: GestureClassLocator}> {
    const result = await fetch(
        `${backend_url}/demonstration/shortcode-exists/${shortCode}`, {
        method: 'GET',
    });

    return { status: result.status == 200, locator: await result.json() };
}

/**
 * Gets a demonstration from the server and formats it as a data array
 * @param project_name The name of the project
 * @param gesture_id The id of the gesture class to get the demonstration for
 * @returns A {@link Promise} with a {@link handSequence} describing the 
 * demonstration
 */
export async function getDemonstration(project_name: string, gesture_id: string): Promise<handSequence> {
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