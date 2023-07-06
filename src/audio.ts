import { Audio, AudioLoader } from "three";

function playBeep(audio: Audio) {
	return new Promise((resolve) => {
		const audioLoader = new AudioLoader();
		audioLoader.load('resources/audio/beep-01a.wav', (buffer) => {
			audio.setBuffer(buffer);
			audio.setVolume(0.5);
			audio.play();
			resolve(undefined);
		});
	});
}

export { playBeep };