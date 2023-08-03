import { Group, XRHandSpace, XRJointSpace } from "three";
import { renderer, scene } from "../init";
import { indexToJointName } from "../hand_capture";
import { XRHandModelFactory } from "three/examples/jsm/webxr/XRHandModelFactory";

function getNewHand() {
    const hand = new Group() as XRHandSpace;
    hand.visible = false;

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
        joint.visible = false;

        hand.joints[ jointName ] = joint;
        hand.add(joint);
    }
}

function getHandsFrameFromData(data: number[], startIndex: number) {
    const handModelFactory = new XRHandModelFactory();

    const hand1 = getNewHand();
    scene.add(hand1);

    const handModel = handModelFactory.createHandModel(hand1, "mesh");
    hand1.add(handModel);
    
    populateHand(hand1, startIndex);

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