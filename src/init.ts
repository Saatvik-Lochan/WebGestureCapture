import * as THREE from "three";
import { XRHandModelFactory } from "three/examples/jsm/webxr/XRHandModelFactory.js";
import { setBackendUrl } from "./http_handler";

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
let hands: Record<XRHandedness, THREE.XRHandSpace>; 

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
 * s
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
    await Promise.all([
        initRenderer(),
        initCameraAndScene(),
        initAudio(),
    ]);

    async function initRenderer() {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;

        document.body.appendChild(renderer.domElement);
    }

    async function initCameraAndScene() {
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 50);
        scene = new THREE.Scene();

        // scene.add(new THREE.AmbientLight())
        scene.add(new THREE.DirectionalLight());
        scene.add(new THREE.HemisphereLight(0xbcbcbc, 0xa5a5a5, 2.5));
    }

    async function initAudio() {
        const listener = new THREE.AudioListener();
        camera.add(listener);
        audio = new THREE.Audio(listener);
    }
}

async function initHands() {
    const handModelFactory = new XRHandModelFactory();

    async function initHand(index: number, type: "spheres" | "boxes" | "mesh") {
        const outHand = renderer.xr.getHand(index);

        scene.add(outHand);

        const handModel = handModelFactory.createHandModel(outHand, type);
        outHand.add(handModel);

        const handedness: XRHandedness = 
            await new Promise(resolve => outHand.addEventListener('connected', event => {
                const xrInputSource = event.data;
                resolve(xrInputSource.handedness);
        }));

        return [handedness, outHand];
    }

    hands = Object.fromEntries(await Promise.all([0, 1].map(ele => initHand(ele, "mesh"))));
}

/**
 * Checks if there is a URL query param of `url`. If there is,
 * communicates with the server specified by decoding the value of the 
 * query param.
 */
export function updateBackendUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedUrl = urlParams.get('url');

    if (encodedUrl) {
        const url = decodeURIComponent(encodedUrl);
        setBackendUrl(url);
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

export { frameListeners, audio, hands, camera };
export { initScene };
export { initHands };
export { animate, renderer, scene };
