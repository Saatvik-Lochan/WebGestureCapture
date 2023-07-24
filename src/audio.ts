import { Audio, AudioLoader } from "three";

// beep buffer cache
let loadedBeep: AudioBuffer;

function loadBeep() {
	return new Promise((resolve) => {
		const audioLoader = new AudioLoader();
		audioLoader.load('resources/audio/beep-01a.wav', (buffer) => {
			loadedBeep = buffer;
			resolve(loadedBeep);
		});
	});
}

function playBeep(audio: Audio) {
	audio.setBuffer(loadedBeep);
	audio.setVolume(0.25);
	audio.play();
}

export { loadBeep, playBeep };