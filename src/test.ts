import { VRButton } from "three/examples/jsm/webxr/VRButton";
import { ClickableButton, triChoiceButtons } from "./clickable";
import { animate, initScene, renderer, scene } from "./init";
import { clearDisplayIndefinitely, displayStringIndefinitely, font, loadFont } from "./text_display";
import { Event, Matrix4, Object3D } from "three";
import { createInteractBox } from "./interact_box";

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
    
    await createInteractBox("test", {
        "enterText": "put your hands in the box",
        "removeText": "remove your hands from the box",
        font
    }).completion
}