import { Camera, WebGLRenderer } from "three";
import { loadBeep, playBeep } from "./audio";
import { streamHandData } from "./hand_capture";
import { Style, clearDisplayIndefinitely, countDown, displayForReadableTime, displayIndefinitely, displayString, displayStringIndefinitely, loadFont } from "./text_display";
import { audio } from "./main";
import { completeTrial } from "./http_handler";
import { createInteractBox } from "./interact";

async function performTrial(
    trialToPerform: Trial, 
    scene: THREE.Scene, 
    renderer: WebGLRenderer, 
    project_name: string, 
    participant_id: string) 
    {
    await Promise.all([loadFont(), loadBeep()]);
    await displayForReadableTime(trialToPerform.instructions, scene,
        new Style(0.5, 0, 0));

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

    console.log(trialToPerform.trial_id);
    await completeTrial(trialToPerform.trial_id, project_name, participant_id);
    await displayString("The trial is over, you may take off the headset", 100000, scene);
}

async function performGesture(gesture: Gesture, gestureLocator: GestureLocator, scene: THREE.Scene, renderer: WebGLRenderer) {
    const textObj = displayStringIndefinitely(gesture.instruction, scene, new Style(0.5, 0, 1));
    await createInteractBox(scene)
    clearDisplayIndefinitely(textObj, scene);

    const durationMs = gesture.duration * 1000;
    await Promise.all([
        streamHandData(durationMs, renderer, gestureLocator),
        displayString("recording gesture...", durationMs, scene, new Style(0.5, 0, 0))
    ]);

    playBeep(audio);
    await new Promise(resolve => setTimeout(resolve, 500));
}

export { performTrial }