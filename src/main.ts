import * as THREE from "three";
import { XRHandModelFactory } from "three/examples/jsm/webxr/XRHandModelFactory.js";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { getHandDataAsString } from './hand_capture';

// main resources
let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let audio: THREE.Audio;
let clock: THREE.Clock;

let hands: THREE.XRHandSpace[]; 

// state variables
let capturingHandData = false;

// container variables
let allHandData = [];

function init() {
    initRenderer();
    initCameraAndScene();
    initAudio();
    initHands();

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

        hands = [0, 1].map((ele) => initHand(ele, "mesh"));
    }   
}

function animate() {
    renderer.setAnimationLoop(function () {
      if (capturingHandData) 
        allHandData.push(getHandDataAsString(renderer, clock));

      renderer.render(scene, camera);
    });
}