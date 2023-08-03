import { Group, Object3D, XRHandSpace, XRJointSpace } from "three";
import { scene } from "../init";
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

function getNewHand() {
    const hand = new Group() as XRHandSpace;
    hand.visible = true;

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

        hand.joints[ jointName ] = joint;
        hand.add(joint);
    }
}

function getHandsFrameFromData(data: number[], startIndex: number) {
    const hand1 = getNewHand();
    populateHand(hand1, startIndex);
    
    scene.add(hand1);

    
    const handModel = new GhostHandModel(hand1);
    const primitiveModel = new XRHandMeshModel(handModel, hand1, null, "left");
    handModel.motionController = primitiveModel;

    hand1.add(handModel);
    
    console.log('%cdemonstrate_gesture.ts line:46 handModel', 'color: #007acc;', handModel);
    console.log('%cdemonstrate_gesture.ts line:47 hand1', 'color: #007acc;', hand1);

    
    function populateHand(hand: XRHandSpace, handStartIndex: number) {
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
}

export { getHandsFrameFromData };