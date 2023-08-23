import { BoxGeometry, Matrix4, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import { OculusHandModel } from 'three/examples/jsm/webxr/OculusHandModel.js';
import { frameListeners, hands, scene } from "./init";
import { font, getCenteredText } from "./text_display";
import { Font } from "three/examples/jsm/loaders/FontLoader";
import { InteractObject } from "./interact_box";

type BoxDimensions = { width: number, height: number, depth: number }

const baseMaterial = new MeshBasicMaterial({ color: 0x4f4f4f });
const buttonMaterial = new MeshBasicMaterial({ color: 0x4f8aff });

const baseDimensions: BoxDimensions = {
    width: 0.1,
    height: 0.05,
    depth: 0.1
}
const buttonDimensions: BoxDimensions = {
    width: 0.05,
    height: 0.03,
    depth: 0.05
}

function getCube(
    material: MeshBasicMaterial,
    dim: BoxDimensions) {
    const cubeGeom = new BoxGeometry(dim.width, dim.height, dim.depth);
    const cube = new Mesh(cubeGeom, material);

    cube.position.set(0, 0, 0);

    scene.add(cube);
    return cube;
}

function getButtonText(buttonText: ButtonTextProperties, baseDimensions: BoxDimensions) {
    const textMesh = getCenteredText(buttonText.buttonText, {
        font: buttonText.font,
        size: 0.05,
        height: 0.01,
        bevelEnabled: false,
        bevelThickness: 0.02,
        bevelSize: 0.05,
        bevelSegments: 3
    });

    // const offset = new Vector3(0, 0.1, 0);
    textMesh.position
        .add(new Vector3(0, baseDimensions.height / 2 + 0.05, - baseDimensions.depth / 2));

    scene.add(textMesh)
    return textMesh;
}

type ButtonTextProperties = {
    buttonText: string,
    font: Font
}

export class ClickableButton {
    name: string;

    #buttonHeight: number = buttonDimensions.height;
    #pressDistance: number = buttonDimensions.height * 0.8;

    #base: Object3D = getCube(baseMaterial, baseDimensions);
    #button: Object3D = getCube(buttonMaterial, buttonDimensions);

    #onPress: () => any;

    #restingYValues = {
        unpressed: baseDimensions.height / 2 + this.#buttonHeight / 2,
        pressed: baseDimensions.height / 2 + this.#buttonHeight / 2 - this.#pressDistance
    }

    #hands: OculusHandModel[];
    #deleted = false;
    #primed = true;

    constructor(
        name: string,
        buttonText: ButtonTextProperties,
        transformMatrix: Matrix4,
        onPress: () => any) {

        this.name = name;
        this.#hands = Object.values(hands).map(hand => new OculusHandModel(hand));
        const text = getButtonText(buttonText, baseDimensions);

        this.#base.add(this.#button);
        this.#base.add(text);

        this.#base.applyMatrix4(transformMatrix);

        this.#onPress = onPress;
        this.startUpdate();
    }

    startUpdate() {
        frameListeners[this.name] = {
            fcn: () => this.update(),
            t: 2,
            offset: 1
        }
    }

    deleteButton() {
        if (this.#deleted) return;

        this.#deleted = true;
        scene.remove(this.#base);
        delete frameListeners[this.name];
    }

    isDeleted() {
        return this.#deleted;
    }

    loadOnPressed(func: () => any) {
        this.#onPress = func;
    }

    update() {
        if (this.#deleted) return;

        const allIntersectingFingers = this.#hands
            .filter((hand: OculusHandModel) => hand.intersectBoxObject(this.#button))
            .map((hand: OculusHandModel) => hand.getPointerPosition())
            .map(worldCoord => this.#base.worldToLocal(worldCoord).y)

        if (allIntersectingFingers.length > 0) {
            const furthestY = Math.min(...allIntersectingFingers) - this.#buttonHeight / 2;

            if (furthestY <= this.#restingYValues.pressed) {
                this.#button.position.y = this.#restingYValues.pressed;

                if (this.#primed) {
                    this.#primed = false;
                    this.#onPress();
                }
            } else if (furthestY >= this.#restingYValues.unpressed) {
                this.#button.position.y = this.#restingYValues.unpressed;
                this.#primed = true;
            } else {
                this.#button.position.y = furthestY;
            }
        } else {
            this.#button.position.y = this.#restingYValues.unpressed;
        }

    }
}

type ButtonParams = {
    name?: string
    text: string,
    transform: Matrix4
}

function getNameFrom(buttonParam: ButtonParams) {
    return buttonParam.name ?? buttonParam.text;
}

export function multiChoiceButtons(buttonsParams: ButtonParams[]): InteractObject {
    const buttons = Object.fromEntries(
        buttonsParams.map(button => [getNameFrom(button), createButton(button)]));

    return {
        delete: () => Object.values(buttons).forEach(button => button.delete()),
        completion: buttonPressed(buttons)
    }

    async function buttonPressed(buttons: Record<string, InteractObject>) {
        const first = await Promise.any(Object.values(buttons).map(button => button.completion));
        Object.keys(buttons).forEach(name => { if (name != first) buttons[name].delete() });

        return first;
    }
}

export function createButton(buttonParams: ButtonParams): InteractObject {
    let resolveFunc: (value: string) => void;
    let deleteButtonFunc: () => void;

    return {
        delete: () => {
            resolveFunc(null);
            deleteButtonFunc();
        },
        completion: new Promise(resolve => {
            resolveFunc = resolve;

            const name = getNameFrom(buttonParams);

            const button = new ClickableButton(
                name,
                { buttonText: buttonParams.text, font },
                buttonParams.transform,
                () => { }
            );

            const onPress = () => {
                button.deleteButton();
                resolve(name);
            }

            button.loadOnPressed(onPress);
            deleteButtonFunc = () => button.deleteButton();
        })
    };
}

export function triChoiceButtons(text1: string, text2: string, text3: string): InteractObject {
    const leftbuttonTransform = new Matrix4();
    leftbuttonTransform.makeTranslation(-0.3, 0.75, -0.45)
    leftbuttonTransform.multiply(new Matrix4().makeRotationY(0.3));

    const rightButtonTransform = new Matrix4();
    rightButtonTransform.makeTranslation(0.3, 0.75, -0.45)
    rightButtonTransform.multiply(new Matrix4().makeRotationY(-0.3));

    const centerButtonTransform = new Matrix4();
    centerButtonTransform.makeTranslation(0, 0.75, -0.55)

    const button1 = {
        text: text1,
        transform: leftbuttonTransform
    };

    const button2 = {
        text: text2,
        transform: centerButtonTransform
    }

    const button3 = {
        text: text3,
        transform: rightButtonTransform
    };

    return multiChoiceButtons([button1, button2, button3]);
}

export function createUndoButton(name: string, text = "REDO"): InteractObject {
    const transform = new Matrix4();
    transform.makeTranslation(0.45, 0.75, -0.4)
    transform.multiply(new Matrix4().makeRotationY(-0.8));

    return createButton({ name, text, transform });
}