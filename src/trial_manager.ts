import { Camera, WebGLRenderer } from "three";
import { loadBeep, playBeep } from "./audio";
import { streamHandData } from "./hand_capture";
import { Style, clearDisplayIndefinitely, countDown, displayForReadableTime, displayIndefinitely, displayString, displayStringIndefinitely, font, loadFont } from "./text_display";
import { audio } from "./main";
import { completeTrial } from "./http_handler";
import { createInteractBox } from "./interact";
import { send } from "vite";

async function displaySkipableInstruction(
    instruction: string, 
    enterText: string, 
    removeText: string, 
    scene: THREE.Scene) 
    {
    const textObj = displayStringIndefinitely(instruction, scene, new Style(0.5, 0, 0));
    await createInteractBox(scene, 
        {"enterText": enterText,
         "removeText": removeText,
         font});
    clearDisplayIndefinitely(textObj, scene);
}

async function performTrial(
    trialToPerform: Trial, 
    scene: THREE.Scene, 
    renderer: WebGLRenderer, 
    project_name: string, 
    participant_id: string) 
    {
    await Promise.all([loadFont(), loadBeep()]);
    console.log("trial started");
    await displaySkipableInstruction(
        trialToPerform.instructions, 
        "Place your hands inside the box when ready",
        "Remove your hands to continue",
        scene);

    for (let i = 0; i < trialToPerform.gestures.length; i++) {
        const gestureToPerform = trialToPerform.gestures[i];
        await performGesture(
            gestureToPerform,
            getGestureLocator(i),
            scene,
            renderer
        )
    }

    function getGestureLocator(gesture_index: number): GestureLocator {
        return {
            project_name,
            participant_id,
            trial_id: trialToPerform.trial_id,
            gesture_index: gesture_index.toFixed(0)
        }
    }

    await completeTrial(trialToPerform.trial_id, project_name, participant_id);
    await displayString("The trial is over, you may take off the headset", 5000, scene, new Style(0.5, 0, 0));
    await renderer.xr.getSession().end();
}

async function performGesture(gesture: Gesture, gestureLocator: GestureLocator, scene: THREE.Scene, renderer: WebGLRenderer) {
    await displaySkipableInstruction(
        gesture.instruction, 
        "Place your hands in the box when ready",
        "Remove your hands to start recording",
        scene);

    const durationMs = gesture.duration * 1000;
    await Promise.all([
        streamHandData(durationMs, renderer, gestureLocator),
        displayString(`recording gesture for ${gesture.duration}s`, durationMs, scene, new Style(0.5, 0, 0))
    ]);

    // playBeep(audio);
    await new Promise(resolve => setTimeout(resolve, 500));
}

export { performTrial }