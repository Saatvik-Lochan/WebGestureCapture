import { Group, Object3D, XRHandSpace, XRJointSpace } from "three";
import { frameListeners, scene } from "../init";
import { indexToJointName } from "../hand_capture";
import { XRHandModel } from "three/examples/jsm/webxr/XRHandModelFactory";
import { XRHandMeshModel } from "three/examples/jsm/webxr/XRHandMeshModel";
import { XRHandPrimitiveModel } from "three/examples/jsm/webxr/XRHandPrimitiveModel";

class GhostHandModel extends Object3D {

    controller: XRHandSpace;
    motionController: XRHandMeshModel | XRHandPrimitiveModel;

	constructor( controller ) {

		super();

		this.controller = controller;
		this.motionController = null;

	}

	updateMatrixWorld( force: boolean ) {

		super.updateMatrixWorld( force );

		if ( this.motionController ) {

			this.motionController.updateMesh();

		}

	}

}

export class GestureDemonstration {

    name: string
    data: number[]
    frames: number
    currentFrame: number
    hands: { leftHand: XRHandSpace, rightHand: XRHandSpace };

    constructor( name: string, data: number[] ) {
        this.name = name;
        this.data = data;
        this.frames = getFrames(data);
        this.hands = addBothGhostHands();
        this.currentFrame = 0;
    }

    startPlaybackLoop() {
        frameListeners[this.name] = () => this.nextFrame();
    }

    stopPlayback() {
        delete frameListeners[this.name];
    }

    nextFrame() {
        const nextFrame = (this.currentFrame + 1) % this.frames;
        this.updateToFrame(nextFrame);
    }

    updateToFrame( frame: number ) {
        if (frame < 0 || this.frames <= frame) return;

        this.currentFrame = frame;
        setHandsToFrame(this.currentFrame, this.data, this.hands.leftHand, this.hands.rightHand);
    } 
}

function getNewHand() {
    const hand = new Group() as XRHandSpace;
    hand.visible = true;
    hand.matrixAutoUpdate = false;

    // @ts-ignore
    hand.joints = {};     

    // @ts-ignore
    hand.inputState = { pinching: false };

    for (let i = 0; i <= 24; i++) {
        addJointToHand(i);
    }

    return hand;

    function addJointToHand(jointIndex: number) {

        const jointName = indexToJointName[jointIndex];

        const joint = new Group() as XRJointSpace;
        joint.visible = true;
        joint.matrixAutoUpdate = false;

        hand.joints[ jointName ] = joint;
        hand.add(joint);
    }
}

function setHandsToFrame(frame, data, leftHand, rightHand) {
    populateHandFromIndex(leftHand, data, frame * 352);
    populateHandFromIndex(rightHand, data, frame * 352 + 175);
}

function getFrames(data: number[]) {
    return Math.floor(data.length / 352);
}

export function addBothGhostHands() {
    return { leftHand: addGhostHand("left"), rightHand: addGhostHand("right") }
}

function addGhostHand(handedness: "left" | "right") {
    const hand = getNewHand();
    const handModel = new GhostHandModel(hand);
    const primitiveModel = new XRHandMeshModel(handModel, hand, null, handedness);
    handModel.motionController = primitiveModel;
    
    hand.add(handModel);
    scene.add(hand);
    return hand
}

function populateHandFromIndex(hand: XRHandSpace, data: number[], handStartIndex: number) {
    const joints = Object.values(hand.joints);
    
    for (let jointIndex = 0; jointIndex <= 24; jointIndex++) {
        const jointStartIndex = handStartIndex + jointIndex * 7;
        populateJoint(joints[jointIndex], jointStartIndex);
    }

    function populateJoint(joint: XRJointSpace, jointStartIndex: number) {
        joint.position.fromArray(data, jointStartIndex);
        joint.quaternion.fromArray(data, jointStartIndex + 3);
    }
}