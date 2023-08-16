import { VRButton } from "three/examples/jsm/webxr/VRButton";
import { GestureClassLocator, getDemonstration, shortCodeExists, startDemonstrationTransfer } from "../http_handler";
import { initScene, animate, renderer, scene, updateBackendUrl } from "../init";
import { displaySkipableInstruction } from "../trial_manager";
import { streamHandDataDemonstration } from "../hand_capture";
import { displayString, displayStringIndefinitely, loadFont } from "../text_display";
import { GestureDemonstration } from "./demonstrate_gesture";

main();

async function main() {
    updateBackendUrl();
    await initScene();
    await initDemonstration();
    animate();
}

function setMainText(text: string) {
    document.getElementById("instruction-text").innerText = text;
}

async function initDemonstration(): Promise<any> {
    const urlParams = new URLSearchParams(window.location.search);
    const shortCode = urlParams.get('code');
    const durationMs = parseFloat(urlParams.get('durationMs'));

    await loadFont();

    if (!shortCode || !durationMs || durationMs < 0 || 10000 < durationMs) {
        setMainText("Both code and durationMs (between 0 and 10000) must be provided")
        return;
    }

    const { status: shortCodeValid, locator } = await shortCodeExists(shortCode);
    console.log('%cmain.ts line:48 locator', 'color: #007acc;', locator);

    if (!shortCodeValid)
        return document.getElementById("instruction-text").innerText = "Invalid code";

    setMainText("Press 'Enter VR' to start");
    document.body.appendChild(VRButton.createButton(renderer));

    renderer.xr.addEventListener('sessionstart', async () => await startDemonstrationRecording(shortCode, durationMs, locator));
    renderer.xr.addEventListener('sessionend', () => location.reload());
}

async function startDemonstrationRecording(shortCode: string, durationMs: number, locator: GestureClassLocator) {
    await startDemonstrationTransfer(shortCode);

    await displaySkipableInstruction(
        `About to record gesture with id ${locator.gesture_id} for ${locator.project_name}.
Put your hands in the box and follow the instructions`,
        "Place your whole hands in the box",
        "Remove your hands to start recording",
        scene);

    await Promise.all([
        streamHandDataDemonstration(durationMs, renderer, shortCode),
        displayString(`recording gesture demonstration for ${durationMs / 1000}s`,
            durationMs,
            scene)
    ]);

    displayStringIndefinitely(
        `This is the recorded geture for gesture id: ${locator.gesture_id}
Refresh the page to redo.
Close the tab to accept`, scene);

    const data = await getDemonstration(locator.project_name, locator.gesture_id);
    const demonstration = new GestureDemonstration("preview");
    demonstration.load(data);
    demonstration.startPlaybackLoop();
}
