import { Audio, AudioLoader } from "three";

// beep buffer cache
let loadedBeep: AudioBuffer;

/**
 * Loads the an audio file which plays a beep. Must be called before {@link playBeep}
 * @returns Returns a promise of an {@link AudioBuffer}
 */
function loadBeep(): Promise<AudioBuffer> {
	return new Promise((resolve) => {
		const audioLoader = new AudioLoader();
		audioLoader.load('resources/audio/beep-01a.wav', (buffer) => {
			loadedBeep = buffer;
			resolve(loadedBeep);
		});
	});
}

/**
 * Call to play a beep sound effect.
 * 
 * @remarks There is a small delay between the calling of this function and 
 * the beep sound effect.
 * @param audio An {@link Audio} object.  
 */
function playBeep(audio: Audio) {
	audio.setBuffer(loadedBeep);
	audio.setVolume(0.25);
	audio.play();
}

export { loadBeep, playBeep };