import { WebGLRenderer } from "three";
import { loadBeep } from "./audio";
import { startAndStreamHandDataToMain } from "./hand_capture";
import { clearDisplayIndefinitely, displayString, displayStringIndefinitely, font, loadFont } from "./text_display";
import { completeTrial, getDemonstration } from "./http_handler";
import { createInteractBox } from "./interact";
import { GestureDemonstration } from "./demonstration/demonstrate_gesture";

export async function displaySkipableInstruction(
    instruction: string, 
    enterText: string, 
    removeText: string, 
    scene: THREE.Scene) 
    {
    const textObj = displayStringIndefinitely(instruction, scene);
    await createInteractBox(scene, 
        {"enterText": enterText,
         "removeText": removeText,
         font});
    clearDisplayIndefinitely(textObj, scene);
}

export async function performTrial(
    trialToPerform: Trial, 
    scene: THREE.Scene, 
    renderer: WebGLRenderer, 
    project_name: string, 
    participant_id: string) 
    {
    await loadFont();
    console.log("trial started");
    await displaySkipableInstruction(
        trialToPerform.instructions, 
        "Place your hands inside the box when ready",
        "Remove your hands to continue",
        scene);

    const demonstration = new GestureDemonstration(trialToPerform.trial_name);

    for (let i = 0; i < trialToPerform.gestures.length; i++) {
        const gestureToPerform = trialToPerform.gestures[i];
        await performGesture(
            gestureToPerform,
            getGestureLocator(i),
            scene,
            renderer,
            demonstration
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
    await displayString("The trial is over, you may take off the headset", 5000, scene);
    await renderer.xr.getSession().end();
}

async function startDemonstrationIfExists(project_name: string, gesture_name: string, demonstration: GestureDemonstration) {
    const demonstrationData = await getDemonstration(project_name, gesture_name);

    console.log('%ctrial_manager.ts line:68 gesture_name', 'color: #007acc;', gesture_name);
    console.log('%ctrial_manager.ts line:69 project_name', 'color: #007acc;', project_name);

    if (demonstrationData) {
        demonstration.load(demonstrationData)
        demonstration.startPlaybackLoop();
        console.log("demonstration started");
    }
}

async function performGesture(gesture: Gesture, gestureLocator: GestureLocator, scene: THREE.Scene, renderer: WebGLRenderer,        demonstration: GestureDemonstration) {

    startDemonstrationIfExists(gestureLocator.project_name, gesture.gesture_name, demonstration);

    await displaySkipableInstruction(
        gesture.instruction, 
        "Place your hands in the box when ready",
        "Remove your hands to start recording",
        scene);

    demonstration.stopPlayback();

    const durationMs = gesture.duration * 1000;
    await Promise.all([
        startAndStreamHandDataToMain(durationMs, renderer, gestureLocator),
        displayString(`recording gesture for ${gesture.duration}s`, durationMs, scene)
    ]);

    // playBeep(audio);
    await new Promise(resolve => setTimeout(resolve, 500));
}