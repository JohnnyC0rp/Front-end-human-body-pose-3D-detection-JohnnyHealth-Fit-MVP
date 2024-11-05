const video = document.getElementsByClassName('input_video5')[0];
const out = document.getElementsByClassName('output5')[0];
const controlsElement = document.getElementsByClassName('control5')[0];
const canvasCtx = out.getContext('2d');
const loading_pic = document.getElementById("loading_pic")
const fpsControl = new FPS();
var loading_deleted = false;

// Device detection function
function isIPhone() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Conditionally add playsinline attribute for iPhone
if (isIPhone()) {
    video.setAttribute('playsinline', '');
}

function onResultsHolistic(results) {
    if (!loading_deleted) {
        loading_pic.remove();
        loading_deleted = true;
    }

    fpsControl.tick();

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, out.width, out.height);
    canvasCtx.drawImage(results.image, 0, 0, out.width, out.height);

    // Draw pose landmarks
    if (results.poseLandmarks) {
        drawConnectors(
            canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
            { color: "rgb(3, 252, 32)" }
        );
        drawLandmarks(
            canvasCtx,
            Object.values(POSE_LANDMARKS_LEFT)
                .map(index => results.poseLandmarks[index]),
            { color: "red", fillColor: 'red' });
        drawLandmarks(
            canvasCtx,
            Object.values(POSE_LANDMARKS_RIGHT)
                .map(index => results.poseLandmarks[index]),
            { color: "blue", fillColor: 'blue' });
        drawLandmarks(
            canvasCtx,
            Object.values(POSE_LANDMARKS_NEUTRAL)
                .map(index => results.poseLandmarks[index]),
            { color: "yellow", fillColor: 'yellow' });
    }

    // // Draw face mesh
    // if (results.faceLandmarks) {
    //     drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION,
    //         { color: '#C0C0C070', lineWidth: 1 });
    //     drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_RIGHT_EYE,
    //         { color: 'rgb(0,217,231)' });
    //     drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_RIGHT_EYEBROW,
    //         { color: 'rgb(0,217,231)' });
    //     drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_LEFT_EYE,
    //         { color: 'rgb(255,138,0)' });
    //     drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_LEFT_EYEBROW,
    //         { color: 'rgb(255,138,0)' });
    //     drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_FACE_OVAL,
    //         { color: '#E0E0E0' });
    //     drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_LIPS,
    //         { color: '#E0E0E0' });
    // }

    // Draw hand landmarks
    if (results.leftHandLandmarks) {
        drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS,
            { color: 'rgb(0, 255, 0)', lineWidth: 5 });
        drawLandmarks(canvasCtx, results.leftHandLandmarks, { color: 'rgb(0, 255, 0)', lineWidth: 2 });
    }
    if (results.rightHandLandmarks) {
        drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS,
            { color: 'rgb(0, 0, 255)', lineWidth: 5 });
        drawLandmarks(canvasCtx, results.rightHandLandmarks, { color: 'rgb(0, 0, 255)', lineWidth: 2 });
    }

    canvasCtx.restore();
}

const holistic = new Holistic({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5/${file}`;
    }
});
holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    refineFaceLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
holistic.onResults(onResultsHolistic);

// FPS Control Variables
let lastFrameTime = 0;
let targetFPS = 60; // Initial desired FPS
let frameInterval = 1000 / targetFPS;

const camera = new Camera(video, {
    onFrame: async () => {
        const now = Date.now();
        if (now - lastFrameTime >= frameInterval) {
            lastFrameTime = now;
            await holistic.send({ image: video });
        }
    },
    width: 960,
    height: 540,
    facingMode: { ideal: 'user' }
});

camera.start();

new ControlPanel(controlsElement, {
    selfieMode: false,
    smoothLandmarks: true,
    modelComplexity: 1,
    targetFPS: 30, // Add targetFPS to options
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
})
    .add([
        new StaticText({ title: 'MediaPipe Holistic' }),
        fpsControl,
        new Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
        new Toggle({ title: 'Smooth Landmarks', field: 'smoothLandmarks' }),
        new Slider({
            title: 'Model Complexity',
            field: 'modelComplexity',
            range: [0, 1],
            step: 1
        }),
        new Slider({
            title: 'Target FPS',
            field: 'targetFPS',
            range: [1, 60],
            step: 1
        }),
        new Slider({
            title: 'Min Detection Confidence',
            field: 'minDetectionConfidence',
            range: [0, 1],
            step: 0.01
        }),
        new Slider({
            title: 'Min Tracking Confidence',
            field: 'minTrackingConfidence',
            range: [0, 1],
            step: 0.01
        }),
    ])
    .on(options => {
        video.classList.toggle('selfie', options.selfieMode);
        holistic.setOptions(options);

        // Update target FPS when slider changes
        if (options.targetFPS) {
            targetFPS = options.targetFPS;
            frameInterval = 1000 / targetFPS;
        }
    });
