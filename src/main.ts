import * as THREE from "three";
import { XRHandModelFactory } from "three/examples/jsm/webxr/XRHandModelFactory.js";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { loadFont, countDown, Style, displayString } from "./text_display";
import { captureHandSequence } from "./hand_capture";
import { sendData } from "./http_handler";
import { loadBeep, playBeep } from "./audio";

// main resources
let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let audio: THREE.Audio;
let hands: THREE.XRHandSpace[]; // hands for handmodels only
let frameListeners: { [key: string]: () => any } = {};
let project: string;
let participant: string;

// state variables
let capturingHandData = false;

// container variables
let allHandData = [];

main();

function main() {
    init();
    animate();
    renderer.xr.addEventListener('sessionstart', vrSequence);
}

function init() {
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
        document.body.appendChild(VRButton.createButton(renderer));
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

    function initProject() {
        const urlParams = new URLSearchParams(window.location.search);
        project = urlParams.get('project');
        participant = urlParams.get('participant');

        if (!(project && participant)) 
            window.alert("Your data is not being recorded. Project and participant not set")
    }
}

function animate() {
    renderer.setAnimationLoop(() => {
        Object.values(frameListeners).forEach((fcn: () => any) => (fcn()));
        renderer.render(scene, camera);
    });
}

function vrSequence() {
    Promise.all([loadFont(), loadBeep()]) // load font and beep
        .then((_) => countDown(3, scene, new Style())) // countdown
        .then((_) =>
            Promise.all(
                [displayString("Perform your gesture", 3000, scene),
                 captureHandSequence(3000, renderer),
                 playBeep(audio)])) // play beep and start recording
        .then((promiseResults) =>
            Promise.all(
                [sendData({ "result": promiseResults[1] }, "gestures"),
                playBeep(audio)])); // play beep and send data
}

export { frameListeners, project, participant };
