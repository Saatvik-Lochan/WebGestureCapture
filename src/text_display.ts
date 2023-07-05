import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

// global variables
let loadedFont: Font;


// object type definitions
class TextObject {
    text: string;
    size: number;
    xpos: number;
    ypos: number;

    constructor(text: string, size = 1, xpos = 0, ypos = 0) {
      this.text = text;
      this.size = size;
      this.xpos = xpos;
      this.ypos = ypos;
    }
}

type TextGroup = TextObject[];

class TextInstance {
    textGroup: TextGroup;
    duration: number;
  
    constructor(textRepr: TextGroup, duration: number) {
      this.textGroup = textRepr;
      this.duration = duration;
    }
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