// import React, { useEffect, useRef, useState } from 'react'
// import { useSession } from '../context/sessionContext';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import { useZego } from '../hooks/useZego';
// import { API_ENDPOINTS, APP_CONFIG, ROUTES } from '../utils/constants';
// import api from '../service/api';
// import SessionHeader from '../components/session/SessionHeader';
// import JoinForm from '../components/session/JoinForm';
// import VideoContainer from '../components/session/VideoContainer';
// import ParticipantsList from '../components/session/ParticipantsList';

// const JoinSession = () => {
//   const [roomId,setRoomId] = useState('')
//   const [localError,setLocalError] = useState('')
//   const [sessionJoined,setSessionJoined] = useState(null);
//   const [sessionInfo,setSessionInfo] = useState(null);
//   const zegoJoinedRef = useRef(false);
//     const [searchParams] = useSearchParams();

//     const { joinSession, getSession, loading,error } = useSession();
//   const navigate = useNavigate();

//     const {
//       isJoined,
//       userHasJoined,
//       error: zegoError,
//       loading: zegoLoading,
//       containerRef,
//       joinZegoRoom,
//       leaveZegoRoom,
//     } = useZego();
  
//     const handleFullScreen = () => {
//       const videoContainer = containerRef.current;
//       if (!videoContainer) return;
//       if (document.fullscreenElement) {
//         document.exitFullscreen?.();
//       } else {
//         videoContainer.requestFullscreen?.().catch(() => {});
//       }
//     };

//     //check if room id is exits in URL PARAMS 
//  useEffect(() => {
//   const urlRoomId = searchParams.get('roomId');
//   if (urlRoomId) {
//     setRoomId(urlRoomId); // ← only set when value exists
//   }
// }, [searchParams]);


//     //handle input change
//     const handleChange = (e) => {
//       setRoomId(e.target.value.toUpperCase().trim());
//       setLocalError('')
//     } 

//     const handleSubmit  = async(e) => {
//       e.preventDefault();
//       setLocalError('')

//       if(!roomId){
//         setLocalError('Please enter a room ID')
//         return;
//       }

//       const result = await joinSession(roomId)

//       if(result.success){
//         setSessionInfo(result.session)
//         setSessionJoined(true);

//         if(result.session.isHost){
//           navigate(`${ROUTES.HOST}?roomId=${roomId}`)
//         }
//       }

//     }

//     useEffect(() => {
//       if(!sessionJoined || !roomId || zegoJoinedRef.current){
//         return;
//       }

//       const joinZego= async() => {
//         if(containerRef.current){
//           zegoJoinedRef.current = true;
//           const zegoResult = await joinZegoRoom(roomId)

//         if (!zegoResult.success) {
//           console.error("failed to join zego room ", zegoResult.error);
//           zegoJoinedRef.current = false;
//         }
//         }else{
//           setTimeout(joinZego,200)
//         }
//       }

//       joinZego();

//       return () => {
//         if(zegoJoinedRef.current){
//           leaveZegoRoom();
//           zegoJoinedRef.current= false;
//         }
//       }
//     },[sessionJoined,roomId,joinZegoRoom,leaveZegoRoom])


//     useEffect(() => {
//       if(!sessionJoined || !roomId) return;
//       const interval = setInterval(async () => {
//         const res = await getSession(roomId)
//         if(res.success){
//           setSessionInfo(res.session)
//         }
//       },5000)
//       return () => clearInterval(interval)
//     },[sessionJoined,roomId,getSession])


//     const handleLeave = async() => {
//           if(zegoJoinedRef.current){
//             await leaveZegoRoom()
//             zegoJoinedRef.current= false
//           }

//           if(sessionJoined){
//             await api.post(API_ENDPOINTS.SESSION.LEAVE, {roomId})
//           }

//           navigate(ROUTES.DASHBOARD)
//     }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-green-50  via-emerald-50 to-teal-50">
//       <SessionHeader
//         title={APP_CONFIG.SESSION_CONTENT.HEADER.JOINING_TITLE}
//         roomId={sessionJoined ? roomId : ''}
//         onBack={ () => navigate(ROUTES.DASHBOARD)}
//       />

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//           {!sessionJoined ? (
//           <JoinForm
//            roomId={roomId}
//            error={error || localError}
//            onChange={handleChange}
//            onSubmit={handleSubmit}
//           />
//           ):
//           (

//     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           <div className="lg:col-span-2 space-y-6">

//             <VideoContainer
//               containerRef={containerRef}
//               isJoined={isJoined}
//               userHasJoined={userHasJoined}
//               zegoError={zegoError}
//               zegoLoading={zegoLoading}
//               onFullscreen={handleFullScreen}
//               onLeave={handleLeave}
//               leaveButtonText={
//                 APP_CONFIG.SESSION_CONTENT.VIDEO.LEAVE_BUTTON
//               }
//             />
//           </div>

//           <div className="lg:col-span-1">
//             <ParticipantsList
//               participants={sessionInfo.participants}
//               hostName={sessionInfo.hostName}
//             />
//           </div>
//         </div>
//           )}
    
//       </main>
//     </div>
//   )
// }

// export default JoinSession

import React, { useEffect, useRef, useState } from "react";
import { useSession } from "../context/sessionContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useZego } from "../hooks/useZego";
import { API_ENDPOINTS, APP_CONFIG, ROUTES } from "../utils/constants";
import api from "../service/api";
import SessionHeader from "../components/session/SessionHeader";
import JoinForm from "../components/session/JoinForm";
import VideoContainer from "../components/session/VideoContainer";
import ParticipantsList from "../components/session/ParticipantsList";

const JoinSession = () => {
  const [roomId, setRoomId] = useState("");
  const [localError, setLocalError] = useState("");
  const [sessionJoined, setSessionJoined] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  const zegoJoinedRef = useRef(false);
  const cleanupStartedRef = useRef(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { joinSession, getSession, loading, error } = useSession();

  const {
    isJoined,
    userHasJoined,
    error: zegoError,
    loading: zegoLoading,
    containerRef,
    joinZegoRoom,
    leaveZegoRoom,
  } = useZego();

  const cleanupZegoSession = async () => {
    if (cleanupStartedRef.current) return;

    cleanupStartedRef.current = true;

    try {
      if (zegoJoinedRef.current) {
        await leaveZegoRoom();
        zegoJoinedRef.current = false;
      }

      if (sessionJoined && roomId) {
        await api.post(API_ENDPOINTS.SESSION.LEAVE, { roomId });
      }
    } catch (error) {
      console.error("Cleanup session error:", error);
    } finally {
      cleanupStartedRef.current = false;
    }
  };

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
    const urlRoomId = searchParams.get("roomId");

    if (urlRoomId) {
      setRoomId(urlRoomId.toUpperCase().trim());
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setRoomId(e.target.value.toUpperCase().trim());
    setLocalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!roomId) {
      setLocalError("Please enter a room ID");
      return;
    }

    const result = await joinSession(roomId);

    if (result.success) {
      setSessionInfo(result.session);
      setSessionJoined(true);

      if (result.session.isHost) {
        navigate(`${ROUTES.HOST}?roomId=${roomId}`);
      }
    }
  };

  useEffect(() => {
    if (!sessionJoined || !roomId || zegoJoinedRef.current) return;

    let isMounted = true;
    let retryTimeout = null;

    const joinZego = async () => {
      if (!isMounted) return;

      if (containerRef.current && !zegoJoinedRef.current) {
        zegoJoinedRef.current = true;

        const zegoResult = await joinZegoRoom(roomId);

        if (!isMounted) return;

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

      cleanupZegoSession();
    };
  }, [sessionJoined, roomId, joinZegoRoom]);

  useEffect(() => {
    if (!sessionJoined || !roomId) return;

    const interval = setInterval(async () => {
      const res = await getSession(roomId);

      if (res.success) {
        setSessionInfo(res.session);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionJoined, roomId, getSession]);

  const handleLeave = async () => {
    await cleanupZegoSession();

    setSessionJoined(false);
    setSessionInfo(null);

    navigate(ROUTES.DASHBOARD, { replace: true });
  };

  useEffect(() => {
    const handleSafeNavigation = async (event) => {
      await cleanupZegoSession();

      setSessionJoined(false);
      setSessionInfo(null);

      navigate(event.detail || ROUTES.DASHBOARD, {
        replace: true,
      });
    };

    window.addEventListener("safe-navigation", handleSafeNavigation);

    return () => {
      window.removeEventListener("safe-navigation", handleSafeNavigation);
    };
  }, [navigate, sessionJoined, roomId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <SessionHeader
        title={APP_CONFIG.SESSION_CONTENT.HEADER.JOINING_TITLE}
        roomId={sessionJoined ? roomId : ""}
        onBack={handleLeave}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!sessionJoined ? (
          <JoinForm
            roomId={roomId}
            error={error || localError}
            onChange={handleChange}
            onSubmit={handleSubmit}
            loading={loading}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <VideoContainer
                containerRef={containerRef}
                isJoined={isJoined}
                userHasJoined={userHasJoined}
                zegoError={zegoError}
                zegoLoading={zegoLoading}
                onFullscreen={handleFullScreen}
                onLeave={handleLeave}
                leaveButtonText={APP_CONFIG.SESSION_CONTENT.VIDEO.LEAVE_BUTTON}
              />
            </div>

            <div className="lg:col-span-1">
              <ParticipantsList
                participants={sessionInfo?.participants}
                hostName={sessionInfo?.hostName}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default JoinSession;