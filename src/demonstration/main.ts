import { VRButton } from "three/examples/jsm/webxr/VRButton";
import { GestureClassLocator, getDemonstration, shortCodeExists, startDemonstrationTransfer } from "../http_handler";
import { initScene, animate, renderer, scene, initHands, updateBackendUrl } from "../init";
import { displaySkipableInstruction } from "../trial_manager";
import { streamHandDataDemonstration } from "../hand_capture";
import { clearDisplayIndefinitely, displayString, displayStringIndefinitely, loadFont } from "../text_display";
import { GestureDemonstration } from "./demonstrate_gesture";
import { dualChoiceButtons } from "../clickable";

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
    const name = decodeURIComponent(urlParams.get('name'));
    const shortCode = urlParams.get('code');
    const durationMs = parseFloat(urlParams.get('durationMs')) * 1.03;

    await loadFont();

    if (!shortCode || !durationMs || durationMs < 0 || 30900 < durationMs) {
        setMainText("Both code and durationMs (between 0 and 30900) must be provided")
        return;
    }

    const { status: shortCodeValid, locator } = await shortCodeExists(shortCode);
    console.log('%cmain.ts line:48 locator', 'color: #007acc;', locator);

    if (!shortCodeValid)
        return document.getElementById("instruction-text").innerText = "Invalid code";

    setMainText("Press 'Enter VR' to start");
    document.body.appendChild(VRButton.createButton(renderer));

    const demonstration = new GestureDemonstration("preview");
    renderer.xr.addEventListener('sessionstart', async () => { await initHands(), startDemonstrationRecording(shortCode, demonstration, name, durationMs, locator) });
    renderer.xr.addEventListener('sessionend', () => location.reload());
}

async function startDemonstrationRecording(shortCode: string, demonstration: GestureDemonstration, name: string, durationMs: number, locator: GestureClassLocator) {
    await startDemonstrationTransfer(shortCode);

    await displaySkipableInstruction(
        `Record gesture ${name ?? "unknown"} for ${durationMs / 1000}s`,
        "Place your whole hands in the box",
        "Remove your hands to start recording").completion;

    await Promise.all([
        streamHandDataDemonstration(durationMs, shortCode),
        displayString(`recording gesture demonstration for ${durationMs / 1000}s`,
            durationMs,
            scene)
    ]);

    const string = displayStringIndefinitely(
        `This is the gesture you recorded for ${name ?? "unknown"}`, scene);

    const data = await getDemonstration(locator.project_name, locator.gesture_id);
    demonstration.load(data);
    demonstration.startPlaybackLoop();

    const buttons = dualChoiceButtons("SAVE", "REDO");

    const result = await buttons.completion;

    switch (result) {
        default:
        case "SAVE":
            renderer.xr.getSession().end();
            return;
        case "REDO":
            demonstration.stopPlayback();
            clearDisplayIndefinitely(string, scene);
            startDemonstrationRecording(shortCode, demonstration, name, durationMs, locator);
            return;
    }
}