import { startAndStreamHandDataToMain } from "./hand_capture";
import { clearDisplayIndefinitely, countDown, displayString, displayStringIndefinitely, font, loadFont } from "./text_display";
import { completeTrial, getDemonstration } from "./http_handler";
import { InteractObject, createInteractBox } from "./interact_box";
import { GestureDemonstration } from "./demonstration/demonstrate_gesture";
import { createUndoButton, triChoiceButtons } from "./clickable";
import { renderer, scene } from "./init";
import { createProgressBar } from "./progress_bar";

export function displaySkipableInstruction(
    instruction: string,
    enterText: string,
    removeText: string,
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
    project_name: string,
    participant_id: string) {

    await loadFont();
    console.log("trial started");
    await displaySkipableInstruction(
        trialToPerform.instructions,
        "Place your hands inside the box when ready",
        "Remove your hands to continue").completion;

    const demonstration = new GestureDemonstration(trialToPerform.trial_name);

    // So the first gesture does not present a 'redo' option
    let askGestureIndex: number, offerRedo: boolean;
    let gestureRedos: number[];

    const startTrialLoop = async () => {
        await displayString("Starting trial", 1500, scene);
        gestureRedos = Array(trialToPerform.gestures.length).fill(0);

        offerRedo = false;
        askGestureIndex = 0;
    }

    const redoPrevious = async () => {
        await displayString("Undoing previous gesture", 1500, scene);
        
        offerRedo = false;
        askGestureIndex--;
        gestureRedos[askGestureIndex]++;
    }

    const nextGesture = () => {
        offerRedo = true;
        askGestureIndex++;
    }

    await startTrialLoop();

    while (askGestureIndex <= trialToPerform.gestures.length) {
        // included here so we can redo the last gesture if requested
        if (askGestureIndex == trialToPerform.gestures.length) {
            const redoTrialText = "REDO\nTRIAL";
            const saveText = "SAVE";
            const redoGestureText = "   REDO\nGESTURE";

            const result = await triChoiceButtons(redoTrialText, redoGestureText, saveText).completion;

            switch (result) {
                case redoTrialText:
                    await startTrialLoop();
                    continue;
                case redoGestureText:
                    await redoPrevious();
                    continue;
                default:
                case saveText:
                    await completeTrial(trialToPerform.trial_id, project_name, participant_id, gestureRedos);
                    await renderer.xr.getSession().end();
                    return;
            }
        }

        const gestureToPerform = trialToPerform.gestures[askGestureIndex];

        const record = await displayGestureInstructions(
            gestureToPerform,
            getGestureLocator(askGestureIndex),
            demonstration,
            offerRedo
        );

        if (record) {
            await performGesture(
                gestureToPerform,
                getGestureLocator(askGestureIndex)
            );

            nextGesture();
        } else {
            await redoPrevious();
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
    demonstration: GestureDemonstration,
    offerRedo = false) {
    startDemonstrationIfExists(gestureLocator.project_name, gesture.gesture_id, demonstration);

    const instructions = displaySkipableInstruction(
        gesture.instruction,
        "Place your hands in the box when ready",
        "Remove your hands to start recording",
        "next");

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

async function performGesture(gesture: Gesture, gestureLocator: GestureLocator) {
    const durationS = gesture.duration;
    const durationMs = durationS * 1000;

    await Promise.all([
        startAndStreamHandDataToMain(durationMs, gestureLocator),
        createProgressBar("progess", durationS).completion,
        displayString(`Recording ${gesture.gesture_name} for ${gesture.duration} seconds`, durationMs, scene)
    ]);
}