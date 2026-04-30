import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { ZEGO_CONFIG } from "../utils/constants";

let zegoInstance = null;
let userHasJoined = false;
let isDestroying = false;
let activeContainer = null;

/*
  This prevents Zego internal async DOM error from showing
  when React removes the video container during navigation.
*/
if (typeof window !== "undefined" && !window.__ZEGO_ERROR_HANDLER__) {
  window.__ZEGO_ERROR_HANDLER__ = true;

  window.addEventListener(
    "error",
    (event) => {
      const message = event?.message || "";

      if (
        message.includes("createSpan") ||
        message.includes("Cannot read properties of null")
      ) {
        event.preventDefault();
        console.warn("Suppressed Zego cleanup error:", message);
      }
    },
    true
  );

  window.addEventListener("unhandledrejection", (event) => {
    const message = event?.reason?.message || "";

    if (
      message.includes("createSpan") ||
      message.includes("Cannot read properties of null")
    ) {
      event.preventDefault();
      console.warn("Suppressed Zego promise cleanup error:", message);
    }
  });
}

export const generateKitToken = (roomId, userId, userName) => {
  if (!ZEGO_CONFIG.APP_ID) {
    throw new Error("ZEGOCLOUD App Id not configured. Please set the value in env");
  }

  const appId = parseInt(ZEGO_CONFIG.APP_ID);

  if (isNaN(appId)) {
    throw new Error("Invalid ZEGOCLOUD App Id. Must be a number");
  }

  const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
    appId,
    ZEGO_CONFIG.SERVER_SECRET || "",
    roomId,
    userId.toString(),
    userName || `User_${userId}`
  );

  if (!kitToken) {
    throw new Error("Token generation returned empty token");
  }

  return kitToken;
};

const requestMediaPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error("Failed to get media permission:", error);
    return false;
  }
};

const clearContainer = () => {
  try {
    if (activeContainer && document.body.contains(activeContainer)) {
      activeContainer.innerHTML = "";
    }
  } catch (error) {
    console.error("Clear Zego container error:", error);
  }
};

export const joinRoom = async (
  roomId,
  userId,
  userName,
  container,
  onJoinCallback,
  onLeaveCallback
) => {
  if (!container) {
    throw new Error("Container element is required");
  }

  if (!document.body.contains(container)) {
    throw new Error("Container is not mounted in DOM");
  }

  if (!ZEGO_CONFIG.APP_ID) {
    throw new Error("ZEGOCLOUD App Id is not configured");
  }

  await leaveRoom();

  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!document.body.contains(container)) {
    throw new Error("Container removed before joining room");
  }

  const hasPermission = await requestMediaPermission();
  const kitToken = generateKitToken(roomId, userId, userName);

  try {
    const zp = ZegoUIKitPrebuilt.create(kitToken);

    if (!zp) {
      throw new Error("Failed to create Zego UIKit instance");
    }

    zegoInstance = zp;
    activeContainer = container;

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!document.body.contains(container)) {
      await leaveRoom();
      throw new Error("Container removed before Zego joinRoom");
    }

    zp.joinRoom({
      container,
      scenario: {
        mode: ZegoUIKitPrebuilt.GroupCall,
      },

      turnOnCameraWhenJoining: hasPermission,
      turnOnMicrophoneWhenJoining: hasPermission,

      showMyCameraToggleButton: true,
      showMyMicrophoneToggleButton: true,
      showAudioVideoSettingsButton: true,
      showTextChat: true,
      showUserList: true,

      onJoinRoom: () => {
        userHasJoined = true;

        if (typeof onJoinCallback === "function") {
          onJoinCallback();
        }
      },

      onLeaveRoom: () => {
        userHasJoined = false;

        if (typeof onLeaveCallback === "function") {
          onLeaveCallback();
        }
      },

      onError: (error) => {
        console.error("ZEGO room error:", error);
      },
    });

    return zp;
  } catch (error) {
    console.error("Error joining Zego room:", error);

    await leaveRoom();

    throw new Error(`Failed to join room: ${error.message}`);
  }
};

export const leaveRoom = async (onLeaveCallback) => {
  if (isDestroying) return;

  const instance = zegoInstance;

  isDestroying = true;

  try {
    if (instance && activeContainer) {
      activeContainer.style.visibility = "hidden";
      activeContainer.style.pointerEvents = "none";
    }

    if (instance && typeof instance.leaveRoom === "function") {
      instance.leaveRoom();
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (instance && typeof instance.destroy === "function") {
      instance.destroy();
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    clearContainer();

    if (typeof onLeaveCallback === "function") {
      onLeaveCallback();
    }
  } catch (error) {
    console.error("Error leaving Zego room:", error);
  } finally {
    zegoInstance = null;
    userHasJoined = false;
    activeContainer = null;
    isDestroying = false;
  }
};

export const getZegoInstance = () => {
  return zegoInstance;
};

export const hasUserJoined = () => {
  return userHasJoined;
};