import { VRButton } from "three/examples/jsm/webxr/VRButton";
import { getNextTrial } from "./http_handler";
import { initScene, animate, renderer, scene, updateBackendUrl } from "./init";
import { performTrial } from "./trial_manager";
import { test } from "./test";

// main();
test();

/**
 * The main function which is run when a participant is to perform 
 * a trial
 */
async function main() {
    updateBackendUrl();
    await initScene();
    await initProject();
    animate();
}

/**
 * Used to set up the main route. Where participants perform a trial.
 * Must be run with {@link initScene} and {@link animate}. 
 * 
 * @see {@link initScene} for usage example
 */
async function initProject() {
    const urlParams = new URLSearchParams(window.location.search);
    const project = urlParams.get('project');
    const participant = urlParams.get('participant');

    let message = "Unknown error";

    try {
        if (project && participant) {
            const response = await getNextTrial(project, participant);

            switch (response.status) {
                case 200:
                    document.body.appendChild(VRButton.createButton(renderer));
                    const trial = await response.json();
                    message = "You have pending trials. Click 'Enter VR' to start"

                    renderer.xr.addEventListener('sessionstart', () => {
                        performTrial(trial, scene, renderer, project, participant)
                    });
                    renderer.xr.addEventListener('sessionend', () => {
                        location.reload();
                    });

                    break;
                default:
                    message = await response.text();
            }
        } else {
            message = "Project and participant are not set"
        }
    } catch (err) {
        console.log(err);
        message = "Issue connecting to server, try again later"
    } finally {
        setText(message);
    }

    function setText(message: string) {
        document.getElementById("instruction-text").innerText = message;
    }
}