// ========================================
// ELEMENT
// ========================================

const video =
    document.getElementById("video");

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");

const startBtn =
    document.getElementById("startBtn");

const stopBtn =
    document.getElementById("stopBtn");


// ========================================
// CAMERA
// ========================================

let stream = null;

let running = false;


// ========================================
// GESTURE
// ========================================

let lastGesture = "NORMAL";


// ========================================
// AUDIO
// ========================================

const blurSound =
    new Audio("sounds/blur.mp3");

blurSound.volume = 1.0;

let audioContext = null;


// ========================================
// SETUP AUDIO
// ========================================

function setupAudio() {

    if (audioContext) {
        return;
    }

    audioContext =
        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

}


// ========================================
// PLAY SOUND
// ========================================

async function playBlurSound() {

    setupAudio();

    if (
        audioContext.state ===
        "suspended"
    ) {

        await audioContext.resume();

    }

    /*
        Reset hanya ketika gesture
        baru terdeteksi.

        Jadi sound tidak restart
        berkali-kali saat V masih
        ditahan.
    */

    blurSound.currentTime = 0;

    try {

        await blurSound.play();

    }

    catch (error) {

        console.log(
            "Sound gagal dimainkan:",
            error
        );

    }

}


// ========================================
// CEK JARI
// ========================================

function fingerUp(
    hand,
    tip,
    pip
) {

    return (
        hand[tip].y <
        hand[pip].y
    );

}


// ========================================
// DETEKSI GESTURE
// ========================================

function detectGesture(hand) {

    const index =
        fingerUp(
            hand,
            8,
            6
        );

    const middle =
        fingerUp(
            hand,
            12,
            10
        );

    const ring =
        fingerUp(
            hand,
            16,
            14
        );

    const pinky =
        fingerUp(
            hand,
            20,
            18
        );


    // ====================================
    // ✌️ V SIGN
    // ====================================

    if (
        index &&
        middle &&
        !ring &&
        !pinky
    ) {

        return "V";

    }


    return "NORMAL";

}


// ========================================
// TERAPKAN EFEK
// ========================================

function applyEffect(gesture) {

    // ====================================
    // ✌️ V SIGN
    // ====================================

    if (gesture === "V") {

        video.classList.add("blur");

        /*
            Sound hanya dipanggil sekali,
            ketika gesture berubah
            dari NORMAL -> V.
        */

        playBlurSound();

    }


    // ====================================
    // NORMAL
    // ====================================

    else {

        video.classList.remove("blur");

    }

}


// ========================================
// MEDIAPIPE
// ========================================

const hands =
    new Hands({

        locateFile: (file) => {

            return (
                "https://cdn.jsdelivr.net/npm/" +
                "@mediapipe/hands/" +
                file
            );

        }

    });


hands.setOptions({

    maxNumHands: 1,

    modelComplexity: 0,

    minDetectionConfidence: 0.6,

    minTrackingConfidence: 0.6

});


// ========================================
// HASIL DETEKSI
// ========================================

hands.onResults(
    (results) => {

        if (!video.videoWidth) {
            return;
        }


        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        // =================================
        // TIDAK ADA TANGAN
        // =================================

        if (
            !results.multiHandLandmarks ||
            results.multiHandLandmarks.length === 0
        ) {

            if (
                lastGesture !==
                "NORMAL"
            ) {

                lastGesture =
                    "NORMAL";

                applyEffect(
                    "NORMAL"
                );

            }

            return;

        }


        // =================================
        // AMBIL TANGAN
        // =================================

        const hand =
            results.multiHandLandmarks[0];


        // =================================
        // DETEKSI
        // =================================

        const gesture =
            detectGesture(hand);


        // =================================
        // HANYA KETIKA BERUBAH
        // =================================

        if (
            gesture !==
            lastGesture
        ) {

            lastGesture =
                gesture;

            applyEffect(
                gesture
            );

        }

    }
);


// ========================================
// MULAI KAMERA
// ========================================

async function startCamera() {

    try {

        setupAudio();


        if (
            audioContext.state ===
            "suspended"
        ) {

            await audioContext.resume();

        }


        stream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        facingMode:
                            "user",

                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        }

                    },

                    audio: false

                });


        video.srcObject =
            stream;


        await video.play();


        running = true;

        lastGesture =
            "NORMAL";


        processCamera();

    }

    catch (error) {

        console.error(error);

        alert(
            "Kamera tidak bisa dibuka. " +
            "Pastikan izin kamera sudah diberikan."
        );

    }

}


// ========================================
// PROCESS CAMERA
// ========================================

async function processCamera() {

    if (!running) {
        return;
    }


    try {

        await hands.send({
            image: video
        });

    }

    catch (error) {

        console.error(error);

    }


    requestAnimationFrame(
        processCamera
    );

}


// ========================================
// STOP KAMERA
// ========================================

function stopCamera() {

    running = false;


    // Stop kamera

    if (stream) {

        stream
            .getTracks()
            .forEach(
                track => {
                    track.stop();
                }
            );

        stream = null;

    }


    video.srcObject = null;


    // Hilangkan blur

    video.classList.remove(
        "blur"
    );


    // Stop sound

    blurSound.pause();

    blurSound.currentTime = 0;


    lastGesture =
        "NORMAL";

}


// ========================================
// BUTTON
// ========================================

startBtn.addEventListener(
    "click",
    startCamera
);


stopBtn.addEventListener(
    "click",
    stopCamera
);