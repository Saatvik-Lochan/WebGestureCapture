import { frameListeners, hands, scene } from "./init";
import { TextGeometryParameters } from "three/examples/jsm/geometries/TextGeometry";
import { Font } from "three/examples/jsm/loaders/FontLoader";
import { getCenteredText } from "./text_display";
import { ClickableButton } from "./clickable";
import { Box3, BoxGeometry, EdgesGeometry, LineSegments, Matrix4, Mesh, MeshBasicMaterial, Sphere, Vector3 } from "three";

const greenMaterial = new MeshBasicMaterial({ color: 0x00ff00, opacity: 0.4, transparent: true });
const redMaterial = new MeshBasicMaterial({ color: 0xff0000, opacity: 0.4, transparent: true });
const blueMaterial = new MeshBasicMaterial({ color: 0x0000ff, opacity: 0.1, transparent: true });

let height = 0.4;

/**
 * A representation of an interactable object which has a single `activation`
 */
export type InteractObject = {
    /**
     * A function which when called, clears this `InteractObject`
     */
    delete: () => any,

    /**
     * A `Promise` that resolves with a `string` that can be used to identify
     * the object. It resolves when the `InteractObject` is activated
     */
    completion: Promise<string>
}

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
 * @param name The name of the button
 * @param text The {@link interactText} which describes the text on this box 
 * @returns An object with a `delete` function and a `completion` 
 * {@link Promise} that resolves with the name of the box once the box has 
 * been actived, i.e. once the user has placed their hands inside the box, 
 * waited for it to turn green, then removed their hands. 
 * 
 * It resolves with `null` if the box is cancelled, by calling the `delete` 
 * function,
 */
function createInteractBox(name: string, text: interactText): InteractObject{
    const textProperties: TextGeometryParameters = {
        font: text.font,
        size: 0.05,
        height: 0.01,
        bevelEnabled: false,
        bevelThickness: 0.02,
        bevelSize: 0.05,
        bevelSegments: 3
    }

    let textMesh: THREE.Object3D<THREE.Event>;

    const cubeGeom = new BoxGeometry(0.7, 0.4, 1);
    const cube = new Mesh(cubeGeom, blueMaterial);

    // add a wireframe to the cube to better see the depth
    const _wireframe = new EdgesGeometry(cubeGeom);
    const wireframe = new LineSegments(_wireframe);

    let box = new Box3();

    const setCubeHeight = (height: number) => {
        cube.position.set(0, height, -0.1);
        wireframe.position.set(0, height, -0.1);
        box.setFromObject(cube);

        updateText(text.enterText);
    }

    const clearText = () => {
        if (textMesh) scene.remove(textMesh);
    }

    const updateText = (str: string) => {
        clearText();
        setText(str);

        function setText(str: string) {
            textMesh = getCenteredText(str, textProperties);
            textMesh.position.add(new Vector3(0, box.max.y, box.min.z));

            const offset = new Vector3(0, 0, -0.1);
            textMesh.position.add(offset);
            textMesh.rotateX(-0.75);
            scene.add(textMesh);
        }
    }

    setCubeHeight(height);

    // add to scene
    scene.add(cube)
    scene.add(wireframe);

    let resolveFunc: (value: string) => void;

    const incButtonTransform = new Matrix4();
    incButtonTransform.makeTranslation(-0.5, 0.75, -0.35)
    incButtonTransform.multiply(new Matrix4().makeRotationY(0.9));

    const decButtonTransform = incButtonTransform.clone();
    decButtonTransform.makeTranslation(-0.5, 0.75, -0.20)
    decButtonTransform.multiply(new Matrix4().makeRotationY(0.9));

    const incButton = new ClickableButton(
        "increase height",
        { font: text.font, buttonText: "up" },
        incButtonTransform, 
        () => {
            height += 0.1;
            setCubeHeight(height);
        }
    )

    const decButton = new ClickableButton(
        "decrease height",
        { font: text.font, buttonText: "down" },
        decButtonTransform, 
        () => {
            height -= 0.1;
            setCubeHeight(height);
        }
    )

    const deleteBox = () => {
        scene.remove(cube);
        scene.remove(wireframe)
        incButton.deleteButton();
        decButton.deleteButton();
        clearText();
        delete frameListeners["button"];
    }


    const promise: Promise<string> = new Promise(resolve => {
        resolveFunc = resolve;
        
        // Create the cube itself
        if (text) {
            updateText(text.enterText);
        }

        const timeThreshold = 250;
        let handsInside = false;
        let handsInsideLastFrame = false;
        let startTime: number;
        let primed = false;

        frameListeners[name] = {
            fcn: () => {
                handsInsideLastFrame = handsInside;
                handsInside = handsInBox(Object.values(hands), box);

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
            t: 3
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
            deleteBox();
            resolve(name);
        }
    });

    return { 
        completion: promise,
        delete: () => {
            deleteBox();
            resolveFunc(null);
        },
    };
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

        const jointSphere = new Sphere(centre, radius);
        const sphereBoundingBox = new Box3();
        jointSphere.getBoundingBox(sphereBoundingBox);

        return box.containsBox(sphereBoundingBox);
    }
}

export { createInteractBox }