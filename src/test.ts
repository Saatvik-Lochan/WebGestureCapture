import { VRButton } from "three/examples/jsm/webxr/VRButton";
import { createUndoButton } from "./clickable";
import { animate, initScene, renderer } from "./init";
import { loadFont } from "./text_display";

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
    const buttonObj = createUndoButton("name");

    await Promise.any([
        buttonObj.completion,
        new Promise(resolve => setTimeout(resolve, 5000))])
        
    buttonObj.delete();
    console.log("completed");
}