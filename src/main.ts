import { initScene, initProject, animate } from "./init";

main();

async function main() {
    await initScene();
    await initProject();
    animate();
}