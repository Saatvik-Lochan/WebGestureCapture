import { Group, Matrix4, Object3D, XRHandSpace, XRJointSpace } from "three";
import { frameListeners, scene } from "../init";
import { handSequence, indexToJointName } from "../hand_capture";
import { XRHandMeshModel } from "three/examples/jsm/webxr/XRHandMeshModel";

/**
 * Supposed to mimic {@link XRHandModel}, while relaxing the constraints 
 * imposed by {@link XRHandModelFactory}.
 */
class GhostHandModel extends Object3D {

    /**
     * The {@link GhostHandSpace} whose {@link XRJointSpace | joint} positions
     * dictate the positions taken by the mesh in {@link motionController}
     */
    controller: GhostHandSpace;

    /**
     * The mesh of the hand that is visible on screen
     */
    motionController: XRHandMeshModel;

    constructor(controller: GhostHandSpace) {

        super();

        this.controller = controller;
        this.motionController = null;

    }

    updateMatrixWorld(force: boolean) {

        super.updateMatrixWorld(force);

        if (this.motionController) {

            this.motionController.updateMesh();

        }

    }

}

/**
 * An {@link XRHandSpace} which is not connected to the users input controller,
 * i.e. it does not automatically follow the users hands
 */
type GhostHandSpace = XRHandSpace;

/**
 * Represents a space in which you can load {@link handSequence} data to 
 * display hand demonstrations
 */
export class GestureDemonstration {

    /**
     * The name of the {@link GestureDemonstration}. Is used to attach to
     * {@link frameListeners}, so should be unique amongst objects.
     */
    #name: string

    /**
     * The data to be displayed.
     */
    #data: handSequence

    /**
     * The number of frames detected in the input data
     */
    #frames: number

    /**
     * The current frame the playback is displaying
     */
    #currentFrame: number

    /**
     * Timestamp when playback started
     */
    #playbackStartTime: number | null = null;
    
    /**
     * Timestamp of the first frame in the recording
     */
    #recordingStartTime: number | null = null;

    /**
     * A translation applied to the demonstration to place them in the world
     */
    translation = new Matrix4().makeTranslation(0, 0, -1);

    /**
     * The hands displaying the demonstration
     */
    hands: { leftHand: GhostHandSpace, rightHand: GhostHandSpace };

    constructor(name: string) {
        this.#name = name;
        this.hands = addBothGhostHands();
        Object.values(this.hands).forEach(hand => hand.applyMatrix4(this.translation));
    }

    /**
     * This will load a {@link handSequence} into the {@link GestureDemonstration}
     * and replace any previously loaded sequence. 
     * 
     * @param data A {@link handSequence} of data to display
     * @remarks This will stop playback when called
     */
    load(data: handSequence) {
        this.stopPlayback();

        this.#data = data;
        this.#frames = getFrames(data);
        this.#currentFrame = 0;
    }

    /**
     * Start the playback of the demonstration
     */
    startPlaybackLoop() {
        Object.values(this.hands).forEach(hand => hand.visible = true);
        
        // Initialize timing
        this.#playbackStartTime = performance.now() / 1000; // Convert to seconds
        this.#recordingStartTime = this.#getFrameStartTime(0);
        this.#currentFrame = 0;
        
        frameListeners[this.#name] = {
            fcn: () => this._playWithTiming(),
            t: 1,
        }
    }

    /**
     * Stop the playback of the demonstration
     */
    stopPlayback() {
        Object.values(this.hands).forEach(hand => hand.visible = false);
        delete frameListeners[this.#name];
        this.#playbackStartTime = null;
        this.#recordingStartTime = null;
    }

    /**
     * Play the demonstration respecting the original timing
     */
    _playWithTiming() {
        if (this.#playbackStartTime === null || this.#recordingStartTime === null) return;
        
        // Calculate how much time has elapsed since playback started
        const currentTime = performance.now() / 1000; // seconds
        const elapsedPlaybackTime = currentTime - this.#playbackStartTime;
        
        // Find the frame that corresponds to this elapsed time
        let targetFrame = this.#currentFrame;
        
        // Search forward to find the right frame
        while (targetFrame < this.#frames - 1) {
            const frameTime = this.#getFrameStartTime(targetFrame) - this.#recordingStartTime;
            
            if (frameTime > elapsedPlaybackTime) {
                break;
            }
            
            targetFrame++;
        }
        
        // Update to the target frame
        if (targetFrame !== this.#currentFrame) {
            this._updateToFrame(targetFrame);
        }
        
        // Loop back to start if we've reached the end
        if (targetFrame >= this.#frames - 1) {
            const lastFrameTime = this.#getFrameStartTime(this.#frames - 1) - this.#recordingStartTime;
            
            if (elapsedPlaybackTime > lastFrameTime + 0.1) { // Small buffer
                this.#playbackStartTime = performance.now() / 1000;
                this.#currentFrame = 0;
                this._updateToFrame(0);
            }
        }
    }

    /**
     * Get the start time (in seconds) for a specific frame
     */
    #getFrameStartTime(frameIndex: number): number {
        // startTime is at position 357 of each 359-value frame
        return this.#data[frameIndex * 359 + 357];
    }

    /**
     * Find the next frame and update to it.
     * 
     * @remarks Will loop back to the start if on the last frame
     */
    _nextFrame() {
        const nextFrame = (this.#currentFrame + 1) % this.#frames;
        this._updateToFrame(nextFrame);
    }

    /**
     * Updates the demonstration to the specified frame
     * @param frame The index of the frame to go to. If the frame is outside 
     * the range of the data, it will do nothing
     */
    _updateToFrame(frame: number) {
        if (frame < 0 || this.#frames <= frame) return;

        this.#currentFrame = frame;
        setHandsToFrame(this.#currentFrame, this.#data, this.hands.leftHand, this.hands.rightHand);
    }
}

/**
 * Create a new {@link GhostHandSpace} 
 * 
 * @remarks the handedness is ambiguous at this stage and not relevant
 * @returns A {@link GhostHandSpace} with all joint positions unassigned
 */
function getNewHand(): GhostHandSpace {
    const hand = new Group() as GhostHandSpace;
    hand.visible = false;
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

        hand.joints[jointName] = joint;
        hand.add(joint);
    }
}

/**
 * Sets the positions of the {@link GhostHandSpace | hands} to that described by a {@link handSequence}
 * @param frame The index of the where the `handFrame` starts in the {@link handSequence}
 * @param data A {@link handSequence} describing a gesture
 * @param leftHand A {@link GhostHandSpace} for the left hand
 * @param rightHand A {@link GhostHandSpace} for the right hand
 */
function setHandsToFrame(frame: number, data: handSequence, leftHand: GhostHandSpace, rightHand: GhostHandSpace) {
    populateHandFromIndex(leftHand, data, frame * 359);
    populateHandFromIndex(rightHand, data, frame * 359 + 175);
}

/**
 * Get the number of frames in a {@link handSequence}
 * @param data A {@link handSequence}
 * @returns A number which describes the number of frames in the specified {@link handSequence}
 */
function getFrames(data: handSequence) {
    return Math.floor(data.length / 361);
}

/**
 * Adds two ghost hands (hands not connected to the users input controllers) to the {@link scene}
 * @returns An object with 
 *      - leftHand: A {@link GhostHandSpace} representing the left hand
 *      - rightHand: A {@link GhostHandSpace} representing the right hand
 */
export function addBothGhostHands() {
    return { leftHand: addGhostHand("left"), rightHand: addGhostHand("right") }
}

/**
 * Adds a ghost hand to the {@link scene}
 * @param handedness Whether the created hand should be left or right handed
 * @returns A {@link GhostHandSpace} representing a hand
 */
function addGhostHand(handedness: XRHandedness) {
    const hand = getNewHand();
    const handModel = new GhostHandModel(hand);
    const primitiveModel = new XRHandMeshModel(handModel, hand, null, handedness);
    handModel.motionController = primitiveModel;

    hand.add(handModel);
    scene.add(hand);

    return hand
}

/**
 * Sets the positions of the joints of a {@link GhostHandSpace | hand} from a {@link handSequence}
 * @param hand A {@link GhostHandSpace} whose position must be updated
 * @param data A {@link handSequence} in which to find the required position data
 * @param handStartIndex The first index of the `175` long stretch required to populate the hand
 */
function populateHandFromIndex(hand: GhostHandSpace, data: handSequence, handStartIndex: number) {
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