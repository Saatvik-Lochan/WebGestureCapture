import { WebGLRenderer } from "three";
import { loadBeep, playBeep } from "./audio";
import { streamHandData } from "./hand_capture";
import { Style, countDown, displayForReadableTime, displayString, loadFont } from "./text_display";
import { audio } from "./main";

async function performTrial(
    trialToPerform: Trial, 
    scene: THREE.Scene, 
    renderer: WebGLRenderer, 
    project_name: string, 
    participant_id: string) 
    {
    await Promise.all([loadFont(), loadBeep()]);
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
}

async function performGesture(gesture: Gesture, gestureLocator: GestureLocator, scene: THREE.Scene, renderer: WebGLRenderer) {
    await displayForReadableTime(gesture.instruction, scene);

    const countDownTime = 3;
    await Promise.all([
        countDown(countDownTime, scene, new Style(0.75, 0, 0)), 
        displayString(gesture.instruction, countDownTime * 1000 - 100, scene, new Style(1, 0, 1)),
    ]);

    const duration = gesture.duration;
    await Promise.all([
        streamHandData(duration, renderer, gestureLocator),
        displayString("Perform gesture", duration, scene, new Style(0.5, 0, 0))
    ]);

    playBeep(audio);
    await new Promise(resolve => setTimeout(resolve, 1000));
}

export { performTrial }