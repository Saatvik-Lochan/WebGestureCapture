import { BoxGeometry, Matrix4, Mesh, MeshBasicMaterial, Object3D, XRHandSpace } from "three";
import { OculusHandModel } from 'three/examples/jsm/webxr/OculusHandModel.js';

type BoxDimensions = { width: number, height: number, depth: number }
type PressState =  "unpressed" | "pressed" | "fully pressed";

const baseMaterial = new MeshBasicMaterial({ color: 0xf0a267 });
const buttonMaterial = new MeshBasicMaterial({ color: 0xfaf1eb });

const baseDimensions: BoxDimensions = {
    width: 0.1,
    height: 0.1,
    depth: 0.1
}

const buttonDimensions: BoxDimensions = {
    width: 0.05,
    height: 0.1,
    depth: 0.05
}

const baseMatrix = new Matrix4().makeTranslation(1, 0.5, 1);
const buttonMatrix = new Matrix4().makeTranslation(1, 0.6, 1);

function getCube( 
    material: MeshBasicMaterial, 
    dim: BoxDimensions,
    matrix: Matrix4) {
    const cubeGeom = new BoxGeometry(dim.width, dim.height, dim.depth);
    const cube = new Mesh(cubeGeom, material);


    cube.applyMatrix4(matrix);

    return cube;
}

class ClickableButton {
    #base: Object3D = getCube(baseMaterial, baseDimensions, baseMatrix);
    #buttonObj: Object3D = getCube(buttonMaterial, buttonDimensions, buttonMatrix);

    #currentState: PressState;
    #buttonText: string;
    
    #restingYValues = { 
        unpressed: 1,
        pressed: 0
    }

    #returnSpeed = 0.4
    #hands: OculusHandModel[];

    constructor( hands: XRHandSpace[], buttonText: string ) {
        this.#hands = hands.map( hand => new OculusHandModel(hand) );
        this.#buttonText = buttonText;
    }

    updateButtonPosition() {
        this.#buttonObj.position.y = getButtonPressPosition();

        function getButtonPressPosition() {
            const allIntersectingFingers = this.#hands
                .filter( ( hand: OculusHandModel ) => hand.intersectBoxObject( this.#buttonObj ) )
                .map( ( hand: OculusHandModel ) => hand.getPointerPosition().y );

            if (allIntersectingFingers) {
                const furthestY = Math.min(...allIntersectingFingers);

                return Math.max(this.#restingYValues.pressed, furthestY);
            } else {
                return this.#restingYValues.unpressed;
            }
        }
    }


}