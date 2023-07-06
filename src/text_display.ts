import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

// global variables
let loadedFont: Font;


// object type definitions
type FontObject = {
    size: number;
    xpos: number;
    ypos: number;
}

type TextObject = {
    text: string;
    size: number;
    xpos: number;
    ypos: number;
}

type TextGroup = TextObject[];

type TextInstance = {
    textGroup: TextGroup;
    duration: number;
}

type TempSequence = TextInstance[];

// promise definitions
function loadFont() {
    const fontLoader = new FontLoader();
    const currentFont = 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json';

    return new Promise((resolve) => {
        fontLoader.load(currentFont, (font) => {
            loadedFont = font;
            resolve(font);
        });
    });
}