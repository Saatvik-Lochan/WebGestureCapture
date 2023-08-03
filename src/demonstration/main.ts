import { VRButton } from "three/examples/jsm/webxr/VRButton";
import { getDemonstration, startDemonstrationTransfer } from "../http_handler";
import { initScene, animate, renderer, scene } from "../init";
import { displaySkipableInstruction } from "../trial_manager";
import { streamHandDataDemonstration } from "../hand_capture";
import { displayString, displayStringIndefinitely, loadFont } from "../text_display";

// main();
test();

async function test() {
    getDemonstration("project", "test");
}

async function main() {
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

    if (!shortCode || !durationMs) {
        setMainText("Both code and durationMs must be provided")
        return;
    }

    const shortCodeValid = await startDemonstrationTransfer(shortCode);

    if (!shortCodeValid)
        return document.getElementById("instruction-text").innerText = "Invalid code";

    setMainText("Press 'Enter VR' to start");
    document.body.appendChild(VRButton.createButton(renderer));

    renderer.xr.addEventListener('sessionstart', async () => await startDemonstrationRecording(shortCode, durationMs));
    renderer.xr.addEventListener('sessionend', () => location.reload());
}

async function startDemonstrationRecording(shortCode: string, durationMs: number) {
    await displaySkipableInstruction(
        "You are about to record a gesture demonstration.\nPut your hands in the box and follow the instructions",
        "Place your whole hands in the box",
        "Remove your hands to start recording",
        scene);

    await Promise.all([
        streamHandDataDemonstration(durationMs, renderer, shortCode),
        displayString(`recording gesture demonstration for ${durationMs/1000}s`, 
            durationMs, 
            scene)
    ]);

    displayStringIndefinitely("Finished", scene);
}
