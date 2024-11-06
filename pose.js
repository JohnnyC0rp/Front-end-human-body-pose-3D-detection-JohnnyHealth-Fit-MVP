const video = document.getElementsByClassName('input_video5')[0];
const out = document.getElementsByClassName('output5')[0];
const controlsElement = document.getElementsByClassName('control5')[0];
const canvasCtx = out.getContext('2d');
const loading_pic = document.getElementById("loading_pic")
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
    modelComplexity: 0,
    smoothLandmarks: true,
    enableSegmentation: false,
    refineFaceLandmarks: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
holistic.onResults(onResultsHolistic);

const camera = new Camera(video, {
    onFrame: async () => {
        await holistic.send({ image: video });
    },
    width: 1440,
    height: 810,
    facingMode: 'environment'
});

camera.start();

