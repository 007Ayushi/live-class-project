import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "../context/sessionContext";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useZego } from "../hooks/useZego";
import { API_ENDPOINTS, APP_CONFIG, ROUTES } from "../utils/constants";
import { copyToClipboard } from "../utils/helpers";
import api from "../service/api";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";
import SessionHeader from "../components/session/SessionHeader";
import SessionInfoCard from "../components/session/SessionInfoCard";
import VideoContainer from "../components/session/VideoContainer";
import ParticipantsList from "../components/session/ParticipantsList";

const HostSession = () => {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const zegoJoinedRef = useRef(false);
  const cleanupStartedRef = useRef(false);
  const sessionEndedRef = useRef(false);
  const isPageLeavingRef = useRef(false);

  const { currentSession, getSession, clearSession } = useSession();
  const { user } = useAuth();

  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || currentSession?.roomId;

  const {
    isJoined,
    userHasJoined,
    error: zegoError,
    loading: zegoLoading,
    containerRef,
    joinZegoRoom,
    leaveZegoRoom,
  } = useZego();

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const hardRedirect = useCallback((path) => {
    window.location.replace(path);
  }, []);

  const cleanupZegoOnly = useCallback(async () => {
    if (cleanupStartedRef.current) return;

    cleanupStartedRef.current = true;

    try {
      if (zegoJoinedRef.current) {
        await leaveZegoRoom();
        zegoJoinedRef.current = false;
      }

      await wait(1500);
    } catch (error) {
      console.error("Zego cleanup error:", error);
    } finally {
      cleanupStartedRef.current = false;
    }
  }, [leaveZegoRoom]);

  const handleFullScreen = () => {
    const videoContainer = containerRef.current;

    if (!videoContainer) return;

    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      videoContainer.requestFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      if (!roomId) {
        hardRedirect(ROUTES.DASHBOARD);
        return;
      }

      setLoading(true);

      const result = await getSession(roomId);

      if (!isMounted) return;

      if (result.success) {
        setSessionInfo(result.session);
      } else {
        hardRedirect(ROUTES.DASHBOARD);
      }

      setLoading(false);
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [roomId, getSession, hardRedirect]);

  useEffect(() => {
    if (
      !sessionInfo ||
      !roomId ||
      zegoJoinedRef.current ||
      isPageLeavingRef.current
    ) {
      return;
    }

    let isMounted = true;
    let retryTimeout = null;

    const joinZego = async () => {
      if (!isMounted || isPageLeavingRef.current) return;

      if (containerRef.current && !zegoJoinedRef.current) {
        zegoJoinedRef.current = true;

        const zegoResult = await joinZegoRoom(roomId);

        if (!isMounted || isPageLeavingRef.current) return;

        if (!zegoResult.success) {
          console.error("Failed to join zego room:", zegoResult.error);
          zegoJoinedRef.current = false;
        }
      } else if (!zegoJoinedRef.current) {
        retryTimeout = setTimeout(joinZego, 200);
      }
    };

    joinZego();

    return () => {
      isMounted = false;

      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [sessionInfo?.id, roomId, joinZegoRoom, containerRef]);

  useEffect(() => {
    if (!roomId || sessionEndedRef.current || isPageLeavingRef.current) return;

    const interval = setInterval(async () => {
      if (isPageLeavingRef.current) return;

      const res = await getSession(roomId);

      if (res.success && res.session && !isPageLeavingRef.current) {
        setSessionInfo((prev) => {
          if (
            prev &&
            prev.participantCount === res.session.participantCount &&
            prev.status === res.session.status &&
            prev.participants?.length === res.session.participants?.length
          ) {
            return prev;
          }

          return res.session;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [roomId, getSession]);

  const handleCopyRoomId = async () => {
    if (!roomId) return;

    const success = await copyToClipboard(roomId);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getShareableLink = () => {
    const baseURL = window.location.origin;
    return `${baseURL}${ROUTES.JOIN}?roomId=${roomId}`;
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(getShareableLink());

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const goDashboardSafely = async () => {
    isPageLeavingRef.current = true;

    await cleanupZegoOnly();

    clearSession();
    setSessionInfo(null);

    hardRedirect(ROUTES.DASHBOARD);
  };

  const handleEndSession = async () => {
    if (sessionEndedRef.current) return;

    sessionEndedRef.current = true;
    isPageLeavingRef.current = true;

    try {
      await cleanupZegoOnly();

      if (sessionInfo?.id && sessionInfo?.isHost) {
        await api.post(`${API_ENDPOINTS.SESSION.END}/${sessionInfo.id}`);
        toast.success("Session ended successfully");
      }

      clearSession();
      setSessionInfo(null);

      hardRedirect(ROUTES.DASHBOARD);
    } catch (error) {
      console.error("End session error:", error);

      clearSession();
      setSessionInfo(null);

      toast.error("Failed to end session. Please try again");
      hardRedirect(ROUTES.DASHBOARD);
    }
  };

  const handleLeave = async () => {
    await handleEndSession();
  };

  const handleBack = async () => {
    try {
      await goDashboardSafely();
    } catch (error) {
      console.error("Back navigation error:", error);
      hardRedirect(ROUTES.DASHBOARD);
    }
  };

  useEffect(() => {
    const handleSafeNavigation = async (event) => {
      try {
        isPageLeavingRef.current = true;

        await cleanupZegoOnly();

        clearSession();
        setSessionInfo(null);

        hardRedirect(event.detail || ROUTES.DASHBOARD);
      } catch (error) {
        console.error("Safe navigation error:", error);
        hardRedirect(event.detail || ROUTES.DASHBOARD);
      }
    };

    window.addEventListener("safe-navigation", handleSafeNavigation);

    return () => {
      window.removeEventListener("safe-navigation", handleSafeNavigation);
    };
  }, [cleanupZegoOnly, clearSession, hardRedirect]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">
            {APP_CONFIG.LOADING_MESSAGES.SESSION}
          </p>
        </div>
      </div>
    );
  }

  if (!sessionInfo) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SessionHeader
        title={APP_CONFIG.SESSION_CONTENT.HEADER.HOSTING_TITLE}
        roomId={roomId}
        userName={user?.name}
        onBack={handleBack}
        showEndButton={false}
        onEndSession={handleEndSession}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SessionInfoCard
              roomId={roomId}
              shareableLink={getShareableLink()}
              status={sessionInfo.status}
              participantCount={sessionInfo.participantCount}
              copied={copied}
              onCopyRoomId={handleCopyRoomId}
              onCopyLink={handleCopyLink}
            />

            <VideoContainer
              containerRef={containerRef}
              isJoined={isJoined}
              userHasJoined={userHasJoined}
              zegoError={zegoError}
              zegoLoading={zegoLoading}
              onFullscreen={handleFullScreen}
              onLeave={handleLeave}
              leaveButtonText={APP_CONFIG.SESSION_CONTENT.VIDEO.END_BUTTON}
            />
          </div>

          <div className="lg:col-span-1">
            <ParticipantsList
              participants={sessionInfo?.participants}
              hostName={sessionInfo?.hostName}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HostSession;