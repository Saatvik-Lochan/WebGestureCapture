import * as THREE from "three";
import { frameListeners, hands } from "./init";
import { TextGeometryParameters } from "three/examples/jsm/geometries/TextGeometry";
import { Font } from "three/examples/jsm/loaders/FontLoader";
import { getCenteredText } from "./text_display";

const greenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.4, transparent: true });
const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.4, transparent: true });
const blueMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, opacity: 0.1, transparent: true });

/**
 * An object which describes the text displayed above an interactBox 
 */
type interactText = {
    /**
     * The initial text displayed by the box
     */
    enterText: string,

    /**
     * The text that appears once the box first turns green
     * after the hands have been inside the box for a certain amount of time
     */
    removeText: string,

    /**
     * The {@link Font} used by the text
     */
    font: Font
}

/**
 * Places a box inside the scene for the user to interact with. The function
 * returns a promise that resolves once the box has been activated
 * @param scene The scene in which to place the interactBox
 * @param text The {@link interactText} which describes the text on this box 
 * @returns A {@link Promise} that resolves in `undefined` once the box has 
 * been actived, i.e. once the user has placed their hands inside the box, 
 * waited for it to turn green, then removed their hands.
 */
function createInteractBox(scene: THREE.Scene, text: interactText = null): Promise<undefined> {
    const textProperties: TextGeometryParameters = {
        font: text.font,
        size: 0.05,
        height: 0.01,
        bevelEnabled: false,
        bevelThickness: 0.02,
        bevelSize: 0.05,
        bevelSegments: 3
    }

    let textMesh;

    return new Promise(resolve => {
        // Create the cube itself
        const cubeGeom = new THREE.BoxGeometry(1, 0.4, 1);
        const cube = new THREE.Mesh(cubeGeom, blueMaterial);

        // Also add a wireframe to the cube to better see the depth
        const _wireframe = new THREE.EdgesGeometry(cubeGeom);
        const wireframe = new THREE.LineSegments(_wireframe);

        // Rotate it a little for a better vantage point
        cube.position.set(0, 0.4, -0.1);
        wireframe.position.set(0, 0.4, -0.1);

        // add to scene
        scene.add(cube)
        scene.add(wireframe);

        const box = new THREE.Box3();
        box.setFromObject(cube);

        if (text) {
            updateText(text.enterText);
        }

        const timeThreshold = 750;
        let handsInside = false;
        let handsInsideLastFrame = false;
        let startTime;
        let primed = false;

        frameListeners["button"] = {
            fcn: () => {
                handsInsideLastFrame = handsInside;
                handsInside = handsInBox(hands, box);

                if (handsInside) {
                    if (handsInsideLastFrame) {
                        if (startTime && !primed && Date.now() - startTime > timeThreshold) {
                            primed = true;
                            onPrime();
                        }
                    } else {
                        startTime = Date.now();
                        onHandsFirstEnter();
                    }
                } else {
                    if (handsInsideLastFrame) {
                        if (primed) {
                            onPress();
                        } else {
                            onCancel();
                        }
                    }
                }
            },
            t: 5
        }

        function onHandsFirstEnter() {
            cube.material = redMaterial;
        }

        function onCancel() {
            cube.material = blueMaterial;
        }

        function onPrime() {
            cube.material = greenMaterial;
            updateText(text.removeText)
        }

        function onPress() {
            clearText();
            deleteBox();
            delete frameListeners["button"];
        }

        function deleteBox() {
            scene.remove(cube);
            scene.remove(wireframe)
            resolve(undefined);
        }

        function updateText(str: string) {
            clearText();
            setText(str);

            function setText(str: string) {
                textMesh = getCenteredText(str, textProperties);
                textMesh.position.add(new THREE.Vector3(0, box.max.y, box.min.z));

                const offset = new THREE.Vector3(0, 0, -0.1);
                textMesh.position.add(offset);
                textMesh.rotateX(-0.75);
                scene.add(textMesh);
            }
        }

        function clearText() {
            if (textMesh) scene.remove(textMesh);
        }
    })
}

/**
 * Checks if the users hands are completely inside a box
 * @param hands An array of {@link THREE.XRHandSpace |XRHandSpace}s 
 * @param box A {@link THREE.Box3 | Box3} in which to check if the hands are
 * @returns A `boolean`, which is `true` if and only if every joint is 
 * inside the {@link box}. A joint is considered inside if a sphere with centre
 * at that joint's position and with the same radius as that joint is 
 * completely within the {@link box}
 */
function handsInBox(hands: THREE.XRHandSpace[], box: THREE.Box3): boolean {
    const jointSpaces = hands.flatMap((hand) => (Object.values(hand.joints)));
    return jointSpaces.every((jointSpace) => jointInBox(jointSpace));


    function jointInBox(joint: THREE.XRJointSpace): boolean {
        const radius = joint.jointRadius;
        const centre = joint.position;

        const jointSphere = new THREE.Sphere(centre, radius);
        const sphereBoundingBox = new THREE.Box3();
        jointSphere.getBoundingBox(sphereBoundingBox);

        return box.containsBox(sphereBoundingBox);
    }
}

export { createInteractBox }