import { VRButton } from "three/examples/jsm/webxr/VRButton";
import { animate, initScene, renderer } from "./init";
import { font, loadFont } from "./text_display";
import { createInteractBox } from "./interact_box";
import { createProgressBar } from "./progress_bar";

export async function test() {
    await initScene();
    minimalSetup();
    animate();
}

function minimalSetup() {
    document.body.appendChild(VRButton.createButton(renderer));
    renderer.xr.addEventListener('sessionstart', onStart);
}

async function onStart() {
    await loadFont();
    
    await createProgressBar("progress", 10).completion;
}