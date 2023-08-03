import { initScene, initProject, animate } from "./init";

main();

async function main() {
    console.log('%cHello main.ts line:6 ', 'background: green; color: white; display: block;');
    await initScene();
    await initProject();
    animate();
}