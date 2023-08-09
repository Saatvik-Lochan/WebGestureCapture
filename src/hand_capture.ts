import { Clock, XRHandSpace, WebGLRenderer } from "three";
import { frameListeners } from "./init";
import { sendDemonstrationBatch, sendHandGestureBatch, startHandGestureTransfer } from "./http_handler";

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

function getHandDataAsString(renderer: WebGLRenderer, clock: Clock) {
	const arrayData = getHandDataAsArray(renderer, clock);
	const stringData = arrayData.map(element => element.toFixed(6)).join(",")

	return stringData;
}

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

async function captureHandSequence(durationMs: number, renderer: WebGLRenderer) {
	// setting as 0 for now
	const clock = new Clock(true);
	const capturedData: number[][] = [];

	frameListeners[0] = {
		fcn: () => capturedData.push(getHandDataAsArray(renderer, clock)),
		t: 1
	}

	await new Promise(resolve => setTimeout(resolve, durationMs));
	delete frameListeners[0];

	return capturedData.flat();
}

export async function streamHandDataDemonstration(durationMs: number, renderer: WebGLRenderer, shortCode: string) {
	const sendFcn = (buffer: ArrayBuffer) => sendDemonstrationBatch(buffer, shortCode);
	await streamHandData(durationMs, renderer, sendFcn);
}

export async function startAndStreamHandDataToMain(durationMs: number, renderer: WebGLRenderer, gestureLocator: GestureLocator) {
	const sendFcn = (buffer: ArrayBuffer) => sendHandGestureBatch(buffer, gestureLocator);

	await startHandGestureTransfer(gestureLocator);
	await streamHandData(durationMs, renderer, sendFcn);
}

async function streamHandData(durationMs: number, renderer: WebGLRenderer,
	sendFcn: (buffer: ArrayBuffer) => any, blockSize: number = 1000) {

	console.log("stream hand data called");
	const clock = new Clock(true);
	let capturedData: number[][] = [];

	frameListeners[1] = {
		fcn: () => {
			capturedData.push(getHandDataAsArray(renderer, clock));

			if (capturedData.length > blockSize) {
				sendCaptured();
			}
		},
		t: 1
	}


	await new Promise(resolve => setTimeout(resolve, durationMs));
	delete frameListeners[1];
	sendCaptured();

	function sendCaptured() {
		const dataAsFloatArr = new Float32Array(capturedData.flat());
		sendFcn(dataAsFloatArr.buffer);
		capturedData = [];
	}
}
