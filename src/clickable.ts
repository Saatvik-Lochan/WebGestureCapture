import { BoxGeometry, Matrix4, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import { OculusHandModel } from 'three/examples/jsm/webxr/OculusHandModel.js';
import { frameListeners, hands, scene } from "./init";
import { font, getCenteredText } from "./text_display";
import { Font } from "three/examples/jsm/loaders/FontLoader";
import { InteractObject } from "./interact_box";

type BoxDimensions = { width: number, height: number, depth: number }

const baseMaterial = new MeshBasicMaterial({ color: 0x1cb3ff });
const buttonMaterial = new MeshBasicMaterial({ color: 0xde001a });

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
        .add(new Vector3(0, baseDimensions.height / 2, - baseDimensions.depth / 2));

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

    constructor( 
        name: string, 
        buttonText: ButtonTextProperties,
        transformMatrix: Matrix4, 
        onPress: () => any ) {

        this.name = name;
        this.#hands = hands.map( hand => new OculusHandModel(hand) );
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

    update() {
        if (this.#deleted) return;

        const allIntersectingFingers = this.#hands
            .filter( ( hand: OculusHandModel ) => hand.intersectBoxObject( this.#button ) )
            .map( ( hand: OculusHandModel ) => hand.getPointerPosition() )
            .map( worldCoord => this.#base.worldToLocal(worldCoord).y )

        if (allIntersectingFingers.length > 0) {
            const furthestY = Math.min(...allIntersectingFingers) - this.#buttonHeight / 2;

            if (furthestY <= this.#restingYValues.pressed) {
                this.#onPress();
                this.deleteButton();
            } else {
                this.#button.position.y = Math.min(furthestY, this.#restingYValues.unpressed);
            }
        } else {
            this.#button.position.y = this.#restingYValues.unpressed;
        }
        
    }
}

export function createUndoButton(name: string): InteractObject {
    let resolveFunc: (value: string) => void;
    let deleteButtonFunc: () => void;

    return {
        delete: () => {
            resolveFunc(null);
            deleteButtonFunc();
        },
        completion: new Promise(resolve => {
        resolveFunc = resolve;

        const transformMatrix = new Matrix4();
        transformMatrix.makeTranslation(0.5, 0.75, -0.45)
        transformMatrix.multiply(new Matrix4().makeRotationY(-0.6));

        const button = new ClickableButton(
            name, 
            { buttonText: "REDO", font },
            transformMatrix,
            () => resolve(name));
        deleteButtonFunc = () => button.deleteButton();
    })};
}