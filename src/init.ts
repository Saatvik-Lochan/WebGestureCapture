import * as THREE from "three";
import { XRHandModelFactory } from "three/examples/jsm/webxr/XRHandModelFactory.js";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { getNextTrial } from "./http_handler";
import { performTrial } from "./trial_manager";

// main resources
/**
 * The main renderer for the scene
 */
let renderer: THREE.WebGLRenderer;

/**
 * The main camera for the scene
 */
let camera: THREE.PerspectiveCamera;

/**
 * The main scene
 */
let scene: THREE.Scene;

/**
 * The audio source for the scene
 */
let audio: THREE.Audio;

/**
 * A list of hands for the display of the hand models
 * 
 * @remarks This does not include the demonstration ghost hands
 * @remarks This is not used in the capture of hand data
 */
let hands: THREE.XRHandSpace[]; 

/**
 * An object used to record information on functions to be run regularly in 
 * a loop.
 */
export type frameListener = { 
    /**
     * The function to be called in the loop
     * @returns The return of this function is discarded when called in the loop
     */
    fcn: () => any, 

    /**
     * The time period between each call of `fcn`
     * 
     * @example
     * A `t` of 1 would run every cycle of the loop (i.e. every frame)
     * A `t` of 2 would run every alternate frame, etc.
     */
    t: number, 

    /**
     * The offset of when this function is called. This must be less than
     * `t`. 
     * 
     * @remarks If left unassigned, defaults to `0`
     * @remarks Use this so that two `frameListener`s can be interleaved.
     * i.e. if they both run on alternate frames, you can use `offset` so that
     * one runs on every odd frame, while the other runs on every even frame. 
     */
    offset?: number 
};

/**
 * A record of {@link frameListener} which need to be run regularly in the 
 * animation loop. This is the recommended way to do so, without changing 
 * the animation loop itself.
 * 
 * @remarks frameListener's must be deleted when they are no longer in use
 * @example
 * ```ts
 *  frameListeners["Hello World"] = {
 *      fcn: () => console.log("Hello World"),
 *      t: 2,
 *      offset: 1          
 *  }
 * 
 *  setTimeout(() => delete frameListeners["Hello World"], 5000)
 * // Expected result is for the console to log "Hello World" every alternate
 * // frame, starting at the second frame (see offset), for 5 seconds
 * ```
 */
let frameListeners: Record<string, frameListener> = {};

/**
 * Instantiates the scene. This must be run to use {@link scene}, {@link renderer},
 * {@link camera}, {@link audio}, {@link hands}.
 * 
 * @remarks This does not set up the VR Button, or bind to 
 * the vr `startsession`. However, it does enable vr.
 * 
 * @example
 * ```ts
 *  async function main() {
 *      await initScene();
 *      await initOwn();
 *      animate();
 *  }
 * 
 * async function initOwn() {
 *      // do route specific init here
 * }
 * ```
 */
async function initScene() {
    initRenderer();
    initCameraAndScene();
    initAudio();
    initHands();


    function initRenderer() {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;

        document.body.appendChild(renderer.domElement);
    }

    function initCameraAndScene() {
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 50);
        scene = new THREE.Scene();
        scene.add(new THREE.HemisphereLight(0xbcbcbc, 0xa5a5a5, 3));
    }

    function initAudio() {
        const listener = new THREE.AudioListener();
        camera.add(listener);
        audio = new THREE.Audio(listener);
    }

    function initHands() {
        const handModelFactory = new XRHandModelFactory();

        function initHand(index: number, type: "spheres" | "boxes" | "mesh") {
            const outHand = renderer.xr.getHand(index);
            scene.add(outHand);

            const handModel = handModelFactory.createHandModel(outHand, type);
            outHand.add(handModel);
            return outHand;
        }

        hands = [0, 1].map((ele) => initHand(ele, "spheres"));
    }
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

/**
 * Sets up the main animate loop. Add functions to the loop with the use of 
 * {@link frameListeners}.
 */
function animate() {

    let frameNumber = 0;
    renderer.setAnimationLoop(() => {
        frameNumber = (frameNumber + 1) % 1000000000;
        Object.values(frameListeners).forEach((frameListener) => {
            if (frameNumber % frameListener.t == (frameListener.offset ?? 0)) frameListener.fcn();
        });
        renderer.render(scene, camera);
    });
}

export { frameListeners, audio, hands };
export { initScene, initProject, animate, renderer, scene };
