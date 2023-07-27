import * as THREE from "three";
import { XRHandModelFactory } from "three/examples/jsm/webxr/XRHandModelFactory.js";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { getNextTrial, sendData } from "./http_handler";
import { performTrial } from "./trial_manager";

// main resources
let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let audio: THREE.Audio;
let hands: THREE.XRHandSpace[]; // hands for handmodels only
let frameListeners: { [key: string]: () => any } = {};
let project: string;
let participant: string;

test();
// main();

async function test() {
    await init();
    animate();
    renderer.xr.addEventListener('sessionstart', async () => {
        const trial: Trial = {
            "trial_id": "1",
            "trial_name": "test",
            "instructions": "Place your hands in the box then remove\nthem to go to the next instruction",
            "gestures": [
                {
                    "gesture_id": "1",
                    "gesture_name": "Clap",
                    "duration": 2,
                    "instruction": "Clap your hands",
                },
                {
                    "gesture_id": "1",
                    "gesture_name": "Thumbs up",
                    "duration": 2,
                    "instruction": "Do a thumbs up with both hands",
                }
            ]
        }
        console.log("trial performance started");
        await performTrial(trial, scene, renderer, project, participant, false);
    });
}

async function main() {
    await init();
    animate();
    renderer.xr.addEventListener('sessionstart', vrSequence);
}

async function init() {
    initRenderer();
    initCameraAndScene();
    initAudio();
    initHands();
    initProject();

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

    async function initProject() {
        const urlParams = new URLSearchParams(window.location.search);
        project = urlParams.get('project');
        participant = urlParams.get('participant');

        let message = "Unknown error";

        try {
            if (project && participant) {
                const trial = await getNextTrial(project, participant) as Trial;

                if (trial) {
                    document.body.appendChild(VRButton.createButton(renderer));
                    message = "You have a pending trial, press Enter VR";
                } else {
                    message = "You have no pending trials"
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
}

function animate() {
    renderer.setAnimationLoop(() => {
        Object.values(frameListeners).forEach((fcn: () => any) => (fcn()));
        renderer.render(scene, camera);
    });
}

async function vrSequence() {
    const trial = await getNextTrial(project, participant) as Trial

    if (trial == null)
        window.alert("No pending trials")
    else
        await performTrial(trial, scene, renderer, project, participant);
}

export { frameListeners, project, participant, audio, hands };
