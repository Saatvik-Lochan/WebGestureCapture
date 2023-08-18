import { VRButton } from "three/examples/jsm/webxr/VRButton";
import { triChoiceButtons } from "./clickable";
import { animate, initScene, renderer, scene } from "./init";
import { clearDisplayIndefinitely, displayStringIndefinitely, loadFont } from "./text_display";

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

    let displayString = displayStringIndefinitely("Start", scene);

    for (;;) {
        const buttonObj = triChoiceButtons("1", "2", "3");
        
        const result = await Promise.any([
            buttonObj.completion,
        ]);
        
        console.log(result)
        clearDisplayIndefinitely(displayString, scene);
        displayString = displayStringIndefinitely(result, scene)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}