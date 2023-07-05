function playBeep(audio: THREE.Audio) {
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('audio/beep-01a.wav', function (buffer) {
      audio.setBuffer(buffer);
      audio.setVolume(1.0);
      audio.play();
    });
  }