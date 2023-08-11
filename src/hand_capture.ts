import { Clock, XRHandSpace, WebGLRenderer } from "three";
import { frameListener, frameListeners } from "./init";
import { sendDemonstrationBatch, sendHandGestureBatch, startHandGestureTransfer } from "./http_handler";

/**
 * A list of joint names, which are laid out in the
 * {@link https://www.w3.org/TR/webxr-hand-input-1/#skeleton-joints-section | WebXR standard}.
 * 
 * @remarks The joint names are order dependent.
 */
export const indexToJointName = [
	'wrist',
	'thumb-metacarpal',
	'thumb-phalanx-proximal',
	'thumb-phalanx-distal',
	'thumb-tip',
	'index-finger-metacarpal',
	'index-finger-phalanx-proximal',
	'index-finger-phalanx-intermediate',
	'index-finger-phalanx-distal',
	'index-finger-tip',
	'middle-finger-metacarpal',
	'middle-finger-phalanx-proximal',
	'middle-finger-phalanx-intermediate',
	'middle-finger-phalanx-distal',
	'middle-finger-tip',
	'ring-finger-metacarpal',
	'ring-finger-phalanx-proximal',
	'ring-finger-phalanx-intermediate',
	'ring-finger-phalanx-distal',
	'ring-finger-tip',
	'pinky-finger-metacarpal',
	'pinky-finger-phalanx-proximal',
	'pinky-finger-phalanx-intermediate',
	'pinky-finger-phalanx-distal',
	'pinky-finger-tip'
];

/**
 * A function which grabs the pose of the currently deteceted hands as a string
 * @param renderer The xr-enabled {@link WebGLRenderer} for the scene
 * @param clock A {@link Clock} used to record the start and end times
 * @returns The hand data as a string
 * 
 * @deprecated
 */
function getHandDataAsString(renderer: WebGLRenderer, clock: Clock) {
	const arrayData = getHandDataAsArray(renderer, clock);
	const stringData = arrayData.map(element => element.toFixed(6)).join(",")

	return stringData;
}

/**
 * A function which captures a single frame of hand skeletal data at the time of calling.
 * @param renderer The xr-enabled {@link WebGLRenderer} for the scene. Used
 * to grab the {@link XRHandSpace | hand spaces} of the current user
 * @param clock A {@link Clock} used to record `startTime` and the `endTime`
 * @returns 
 * An array of handData of length `352`. It is composed of `2` hands each of length 
 * `175` - left hand first. Along with `2` values for the `startTime` and the `endTime`. 
 * 
 * Each hand is composed of `25` joints in the order 
 * of {@link indexToJointName}. Each joint is composed of `7` data values. 
 * The first `3` describe the `[x, y, z]` position, the last `4` describe
 * the `[x, y, z, w]` quaternion.
 */
function getHandDataAsArray(renderer: WebGLRenderer, clock: Clock): number[] {
	const hand0 = renderer.xr.getHand(0);
	const hand1 = renderer.xr.getHand(1);

	function getJointAsArr(handObj: XRHandSpace, jointName: string) {
		const poseArray =
			[...handObj.joints[jointName].position.toArray(),
			...handObj.joints[jointName].quaternion.toArray()];

		return poseArray;
	}

	function getHandAsArray(handObj: XRHandSpace) {
		let out_arr = [];
		for (let i = 0; i <= 24; i++) {
			out_arr = [...out_arr, ...getJointAsArr(handObj, indexToJointName[i])];
		}
		return out_arr
	}

	const captureStartTime = clock.getElapsedTime();
	const capturedData = [...getHandAsArray(hand0), ...getHandAsArray(hand1)];
	const captureEndTime = clock.getElapsedTime();

	const finalData = [...capturedData, captureStartTime, captureEndTime];

	return finalData;
}

/**
 * Captures hand skeletal data over a duration of time.
 * 
 * @remarks As hand data can get quite large, only use this for short bursts of capture, 
 * or you risk running out of memory. If you are sending it to a server, instead use 
 * {@link streamHandData} and provide a `sendFcn` for batches of data.
 * 
 * @param durationMs The duration to capture the hand skeletal data 
 * @param renderer The xr-enabled {@link WebGLRenderer} for the scene. Used
 * to grab the {@link XRHandSpace | hand spaces} of the current user
 * @returns An array of arrays. Each sub-array contains a single frame of data as captured
 * by {@link getHandDataAsArray}.
 */
export async function captureHandSequence(durationMs: number, renderer: WebGLRenderer): Promise<number[][]> {
	// setting as 0 for now
	const clock = new Clock(true);
	const capturedData: number[][] = [];

	frameListeners[0] = {
		fcn: () => capturedData.push(getHandDataAsArray(renderer, clock)),
		t: 1
	}

	await new Promise(resolve => setTimeout(resolve, durationMs));
	delete frameListeners[0];

	return capturedData;
}

/**
 * A wrapper on {@link streamHandData} to send data for the hand gesture
 * demonstration
 * 
 * @param durationMs The duration of hand gesture capture
 * @param renderer The xr-enabled {@link WebGLRenderer} for the scene. Used
 * to grab the {@link XRHandSpace | hand spaces} of the current user
 * @param shortCode A short string used to describe which gesture class in 
 * which project to register the demonstration data with.
 */
export async function streamHandDataDemonstration(durationMs: number, renderer: WebGLRenderer, shortCode: string) {
	const sendFcn = (captured: number[][]) => sendDemonstrationBatch(capturedToBuffer(captured), shortCode);
	await streamHandData(durationMs, renderer, sendFcn);
}

/**
 * A wrapper on {@link streamHandData} to send data for a performed gesture of
 * a trial
 * 
 * @param durationMs The duration of hand gesture capture
 * @param renderer The xr-enabled {@link WebGLRenderer} for the scene. Used
 * to grab the {@link XRHandSpace | hand spaces} of the current user
 * @param gestureLocator An instance of {@link GestureLocator} to identify where
 * to send the data for this gesture instance.
 */
export async function startAndStreamHandDataToMain(durationMs: number, renderer: WebGLRenderer, gestureLocator: GestureLocator) {
	const sendFcn = (captured: number[][]) => sendHandGestureBatch(capturedToBuffer(captured), gestureLocator);

	await startHandGestureTransfer(gestureLocator);
	await streamHandData(durationMs, renderer, sendFcn);
}

/**
 * Used to compact a 2D array to a more data efficient form, to send 
 * over https. It flattens the input array before converting it to a 
 * {@link Float32Array}, and grabs the {@link ArrayBuffer} from that.
 * 
 * @remarks initially designed to use with {@link streamHandData}
 * 
 * @param captureData A `number[][]` of data
 * @returns A compact form of the data as an {@link ArrayBuffer}
 */
export function capturedToBuffer(captureData: number[][]): ArrayBuffer {
	const dataAsFloatArr = new Float32Array(captureData.flat());
	return dataAsFloatArr.buffer;
}

/**
 * Captures hand gesture data over a duration of time and periodically calls 
 * `sendFcn` to consume the data. 
 * 
 * @remarks This function is the preferred way to capture hand gesture data
 * while keeping the memory usage low 
 * 
 * @remarks This function can cause lag when running. Consider changing the 
 * recording properties `timePeriod` and `offset`.
 * 
 * @param durationMs The duration to capture the hand data
 * @param renderer The xr-enabled {@link WebGLRenderer} for the scene. Used
 * to grab the {@link XRHandSpace | hand spaces} of the current user
 * @param sendFcn The function which is used to consume the data. The input
 * for this function will be a `number[][]` which consists of 
 * {@link blockSize} number of `number[]`, each array is a captured frame as described 
 * in {@link getHandDataAsArray}.
 * @param blockSize The number of frames captured before `sendFcn` consumes them.
 * @param name The name of the frame listener to attach this function to. 
 * Ensure it is unique.
 * @param timePeriod Determines how often a frame is captured. Increasing
 * this will reduce lag but will record less frames over the same duration, see:
 * {@link frameListener.t}
 * @param offset The offset number of frames before recording starts. This must be 
 * less than `timePeriod`. See {@link frameListener}.
 */
async function streamHandData(durationMs: number, renderer: WebGLRenderer,
	sendFcn: (data: number[][]) => any, blockSize: number = 1000, 
	name: string = "captureHands",
	timePeriod: number = 1,
	offset: number = 0) {

	console.log("stream hand data called");
	const clock = new Clock(true);
	let capturedData: number[][] = [];

	frameListeners[name] = {
		fcn: () => {
			capturedData.push(getHandDataAsArray(renderer, clock));

			if (capturedData.length >= blockSize) {
				sendCaptured();
			}
		},
		t: timePeriod,
		offset
	}

	await new Promise(resolve => setTimeout(resolve, durationMs));
	delete frameListeners[name];
	sendCaptured();

	function sendCaptured() {
		sendFcn(capturedData);
		capturedData = [];
	}
}
