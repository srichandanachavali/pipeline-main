import AgoraRTC from "agora-rtc-sdk-ng";

// ------------------------------------------------------
//  YOUR APP CONFIG
// ------------------------------------------------------
const APP_ID = "8385487ff952449049991daf1174ade3";  // Your real App ID
const TOKEN = "007eJxTYNDb0fSsslbSkpVL64LiqfJi9+2n8+LkNFjnPn9UH771qoYCg4WxhamJhXlamqWpkYmJJQhaGqYkphkampskpqQavww3z2wIZGTQV3/GyMgAgSA+C0NJanEJAwMAouEdLQ==";  // Your Temp Token
const CHANNEL = "test";   // You can rename channel later
const UID = null;         // null = Agora auto-assigns UID

// ------------------------------------------------------
//  CLIENT INITIALIZATION
// ------------------------------------------------------
let client = AgoraRTC.createClient({
    mode: "rtc",
    codec: "vp8"
});

let localTrack;  
let remoteUsers = {};

// ------------------------------------------------------
//  JOIN CALL FUNCTION
// ------------------------------------------------------
async function joinCall() 
{
      try {
        document.getElementById("join").disabled = true;
        console.log("Joining channel...");

        await client.join(APP_ID, CHANNEL, TOKEN, UID);

        localTrack = await AgoraRTC.createCameraVideoTrack();

        localTrack.setEncoderConfiguration({
            width: 720,
            height: 1280,
            frameRate: 30,
            orientationMode: "portrait"
        });

        localTrack.play("local-video");

        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);

        console.log("Joined successfully");
    } catch (error) {
        console.error("JOIN ERROR:", error);
        document.getElementById("join").disabled = false;
    }
}


// ------------------------------------------------------
//  HANDLE REMOTE USER JOIN
// ------------------------------------------------------
async function handleUserPublished(user, mediaType) {
    remoteUsers[user.uid] = user;

    await client.subscribe(user, mediaType);

    console.log("Subscribed to remote user:", user.uid);

    if (mediaType === "video") {
        const remotePlayer = document.getElementById("remote-video");
        user.videoTrack.play(remotePlayer);
    }
}

// ------------------------------------------------------
//  HANDLE REMOTE USER LEAVE
// ------------------------------------------------------
function handleUserUnpublished(user) {
    delete remoteUsers[user.uid];
    console.log("Remote user left:", user.uid);
}

// ------------------------------------------------------
//  LEAVE CALL
// ------------------------------------------------------
async function leaveCall() {
    if (localTrack) {
        localTrack.stop();
        localTrack.close();
    }

    await client.leave();
    console.log("Left the call");
}

// ------------------------------------------------------
//  BUTTON CLICK EVENTS
// ------------------------------------------------------
document.getElementById("join").onclick = joinCall;
document.getElementById("leave").onclick = leaveCall;