import React, { useState } from "react";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import { APP_CONFIG } from "../../utils/constants";

const SessionHeader = ({
  title,
  roomId,
  userName,
  onBack,
  showEndButton = false,
  onEndSession,
}) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const handleBackClick = async () => {
    if (isNavigating || isEnding) return;

    try {
      setIsNavigating(true);

      if (onBack) {
        await onBack();
      }
    } catch (error) {
      console.error("Back button error:", error);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleEndSessionClick = async () => {
    if (isEnding || isNavigating) return;

    try {
      setIsEnding(true);

      if (onEndSession) {
        await onEndSession();
      }
    } catch (error) {
      console.error("End session button error:", error);
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleBackClick}
              disabled={isNavigating || isEnding}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isNavigating ? (
                <FaSpinner className="w-5 h-5 animate-spin" />
              ) : (
                <FaArrowLeft className="w-5 h-5" />
              )}
            </button>

            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>

              {roomId && (
                <p className="text-sm text-gray-500">Room ID: {roomId}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {userName && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {userName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>

                <span className="text-gray-700 font-medium text-sm">
                  {userName}
                </span>
              </div>
            )}

            {showEndButton && (
              <button
                type="button"
                onClick={handleEndSessionClick}
                disabled={isEnding || isNavigating}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isEnding && <FaSpinner className="animate-spin" />}
                {APP_CONFIG.SESSION_CONTENT.HEADER.END_SESSION_BUTTON}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SessionHeader;