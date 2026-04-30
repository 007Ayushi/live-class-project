import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { joinRoom, leaveRoom } from "../service/zego";

export const useZego = () => {
  const [isJoined, setIsJoined] = useState(false);
  const [userHasJoined, setUserHasJoined] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const joinedRoomIdRef = useRef(null);
  const isJoiningRef = useRef(false);
  const isLeavingRef = useRef(false);
  const isMountedRef = useRef(false);

  const { user } = useAuth();

  const safeSetState = useCallback((setter, value) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  const clearVideoContainer = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    try {
      container.innerHTML = "";
    } catch (error) {
      console.error("Clear video container error:", error);
    }
  }, []);

  const leaveZegoRoom = useCallback(async () => {
    if (isLeavingRef.current) return;

    isLeavingRef.current = true;

    try {
      await Promise.resolve(
        leaveRoom(() => {
          safeSetState(setUserHasJoined, false);
        })
      );
    } catch (error) {
      console.error("Error leaving Zego room:", error);
    } finally {
      joinedRoomIdRef.current = null;

      safeSetState(setIsJoined, false);
      safeSetState(setUserHasJoined, false);
      safeSetState(setLoading, false);
      safeSetState(setError, null);

      setTimeout(() => {
        clearVideoContainer();
      }, 300);

      isJoiningRef.current = false;
      isLeavingRef.current = false;
    }
  }, [clearVideoContainer, safeSetState]);

  const joinZegoRoom = useCallback(
    async (roomId) => {
      if (!roomId) {
        const errorMessage = "Room ID is required";
        safeSetState(setError, errorMessage);
        return { success: false, error: errorMessage };
      }

      if (!user?.id || !user?.name) {
        const errorMessage = "User details are missing";
        safeSetState(setError, errorMessage);
        return { success: false, error: errorMessage };
      }

      if (joinedRoomIdRef.current === roomId) {
        return { success: true };
      }

      if (isJoiningRef.current || isLeavingRef.current) {
        return {
          success: false,
          error: "Zego is already processing",
        };
      }

      isJoiningRef.current = true;
      safeSetState(setLoading, true);
      safeSetState(setError, null);

      try {
        let retries = 0;
        const maxRetries = 40;

        while (!containerRef.current && retries < maxRetries) {
          if (!isMountedRef.current) {
            return { success: false, error: "Component unmounted" };
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }

        const container = containerRef.current;

        if (!container) {
          throw new Error("Video container not ready. Please refresh the page.");
        }

        let dimRetries = 0;

        while (
          container &&
          (container.offsetWidth === 0 || container.offsetHeight === 0) &&
          dimRetries < 10
        ) {
          if (!isMountedRef.current || !containerRef.current) {
            return { success: false, error: "Component unmounted" };
          }

          await new Promise((resolve) => setTimeout(resolve, 200));
          dimRetries++;
        }

        if (!isMountedRef.current || !containerRef.current) {
          return { success: false, error: "Component unmounted" };
        }

        await joinRoom(
          roomId,
          user.id,
          user.name,
          containerRef.current,
          () => {
            safeSetState(setUserHasJoined, true);
          },
          () => {
            safeSetState(setUserHasJoined, false);
          }
        );

        if (!isMountedRef.current || !containerRef.current) {
          await leaveZegoRoom();
          return { success: false, error: "Component unmounted" };
        }

        joinedRoomIdRef.current = roomId;

        safeSetState(setIsJoined, true);
        safeSetState(setUserHasJoined, true);

        return { success: true };
      } catch (error) {
        console.error("Failed to join Zego room:", error);

        const errorMessage =
          error?.message ||
          "Failed to join room. Please check camera/microphone permission.";

        joinedRoomIdRef.current = null;

        safeSetState(setError, errorMessage);
        safeSetState(setIsJoined, false);
        safeSetState(setUserHasJoined, false);

        return { success: false, error: errorMessage };
      } finally {
        isJoiningRef.current = false;
        safeSetState(setLoading, false);
      }
    },
    [user?.id, user?.name, safeSetState, leaveZegoRoom]
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      try {
        leaveRoom();
      } catch (error) {
        console.error("Zego cleanup on unmount error:", error);
      }

      setTimeout(() => {
        clearVideoContainer();
      }, 300);

      joinedRoomIdRef.current = null;
      isJoiningRef.current = false;
      isLeavingRef.current = false;
    };
  }, [clearVideoContainer]);

  return {
    isJoined,
    userHasJoined,
    error,
    loading,
    containerRef,
    joinZegoRoom,
    leaveZegoRoom,
  };
};