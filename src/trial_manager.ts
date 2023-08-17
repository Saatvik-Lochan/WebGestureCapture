import { Scene, WebGLRenderer } from "three";
import { startAndStreamHandDataToMain } from "./hand_capture";
import { clearDisplayIndefinitely, displayString, displayStringIndefinitely, font, loadFont } from "./text_display";
import { completeTrial, getDemonstration } from "./http_handler";
import { InteractObject, createInteractBox } from "./interact_box";
import { GestureDemonstration } from "./demonstration/demonstrate_gesture";
import { createUndoButton } from "./clickable";

export function displaySkipableInstruction(
    instruction: string,
    enterText: string,
    removeText: string,
    scene: THREE.Scene,
    name: string = "instruction"): InteractObject {

    const textObj = displayStringIndefinitely(instruction, scene);
    const interactBox = createInteractBox(
        name,
        {
            "enterText": enterText,
            "removeText": removeText,
            font
        }
    );
    

    return {
        completion: awaitTrigger(),
        delete: () => {
            interactBox.delete();
            clearDisplayIndefinitely(textObj, scene);
        } 
    }

    async function awaitTrigger() {

        const completedVal = await interactBox.completion;
        clearDisplayIndefinitely(textObj, scene);
        return completedVal;
    }

}

export async function performTrial(
    trialToPerform: Trial,
    scene: THREE.Scene,
    renderer: WebGLRenderer,
    project_name: string,
    participant_id: string) {
    await loadFont();
    console.log("trial started");
    await displaySkipableInstruction(
        trialToPerform.instructions,
        "Place your hands inside the box when ready",
        "Remove your hands to continue",
        scene).completion;

    const demonstration = new GestureDemonstration(trialToPerform.trial_name);

    // So the first gesture does not present a 'redo' option
    let offerRedo = false;

    for (let askGestureIndex = 0; askGestureIndex < trialToPerform.gestures.length;) {
        const gestureToPerform = trialToPerform.gestures[askGestureIndex];
        
        console.log('%ctrial_manager.ts line:64 i', 'color: #007acc;', askGestureIndex);
        console.log('%ctrial_manager.ts line:68 offerRedo', 'color: #007acc;', offerRedo);

        const record = await displayGestureInstructions(
            gestureToPerform,
            getGestureLocator(askGestureIndex),
            scene,
            demonstration,
            offerRedo  
        );

        if (record) {
            await performGesture(
                gestureToPerform,
                getGestureLocator(askGestureIndex),
                scene,
                renderer,
            );

            offerRedo = true;
            askGestureIndex++;
        } else {

            offerRedo = false;
            askGestureIndex--;
        } 
        
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

async function startDemonstrationIfExists(project_name: string, gesture_id: string, demonstration: GestureDemonstration) {
    const demonstrationData = await getDemonstration(project_name, gesture_id);

    if (demonstrationData) {
        demonstration.load(demonstrationData)
        demonstration.startPlaybackLoop();
        console.log("demonstration started");
    }
}

async function displayGestureInstructions(
    gesture: Gesture, 
    gestureLocator: GestureLocator, 
    scene: Scene, 
    demonstration: GestureDemonstration,
    offerRedo = false) {
    startDemonstrationIfExists(gestureLocator.project_name, gesture.gesture_id, demonstration);

    const instructions = displaySkipableInstruction(
        gesture.instruction,
        "Place your hands in the box when ready",
        "Remove your hands to start recording",
        scene, "next");

    let result: string;

    if (offerRedo) {
        const undo = createUndoButton("undo");
    
        result = await Promise.any([
            instructions.completion,
            undo.completion
        ]);
    
        console.log('%ctrial_manager.ts line:143 result', 'color: #007acc;', result);

        switch (result) {
            case "next":
                undo.delete();
                break;
            case "undo":
                instructions.delete();
                break;
        };
    } else {
        result = await instructions.completion;
    }

    demonstration.stopPlayback();
    return result == "next";
}

async function performGesture(gesture: Gesture, gestureLocator: GestureLocator, scene: THREE.Scene, renderer: WebGLRenderer) {
    const durationMs = gesture.duration * 1000;
    await Promise.all([
        startAndStreamHandDataToMain(durationMs, renderer, gestureLocator),
        displayString(`recording ${gesture.gesture_name} for ${gesture.duration} seconds`, durationMs, scene)
    ]);
}