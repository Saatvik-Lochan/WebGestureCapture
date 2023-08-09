import * as THREE from "three";
import { frameListeners, hands } from "./init";
import { TextGeometryParameters } from "three/examples/jsm/geometries/TextGeometry";
import { Font } from "three/examples/jsm/loaders/FontLoader";
import { getCenteredText } from "./text_display";

const greenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.4, transparent: true });
const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.4, transparent: true });
const blueMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, opacity: 0.1, transparent: true });

type interactText = {
    enterText: string,
    removeText: string,
    font: Font
}

function createInteractBox(scene: THREE.Scene, text: interactText = null) {
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

function handsInBox(hands: THREE.XRHandSpace[], box: THREE.Box3) {
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