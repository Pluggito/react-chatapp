"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Loader2, AlertCircle } from "lucide-react";

const VoiceNotePlayer = ({
  mediaUrl,
  duration,
  isActive = false,
  onActivate,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(duration || 0);

  const audioRef = useRef(null);

  useEffect(() => {
    if (!mediaUrl) return;

    const audio = new Audio(mediaUrl);
    audioRef.current = audio;
    audio.preload = "metadata";

    audio.onloadedmetadata = () => {
      setIsLoading(false);
      setActualDuration(Math.floor(audio.duration));
    };

    audio.ontimeupdate = () => {
      setCurrentTime(Math.floor(audio.currentTime));
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.onerror = () => {
      setError(true);
      setIsLoading(false);
    };

    return () => audio.pause();
  }, [mediaUrl]);

  const togglePlayPause = (e) => {
    e.stopPropagation();
    if (isLoading || error) return;

    if (!isActive && onActivate) {
      onActivate();
      setTimeout(() => handlePlay(), 100);
      return;
    }

    handlePlay();
  };

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex items-center gap-3 w-[300px] sm:w-[340px] h-[52px] px-3 rounded-xl border transition-all duration-300 relative
        ${
          isActive
            ? "bg-blue-500/10 border-blue-500/30 shadow-md"
            : "bg-[#1a1a1a]/90 border-white/10"
        }
      `}
    >
      {/* Play/Pause button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading || error}
        className={`flex-shrink-0 rounded-full p-2 transition-transform duration-200 hover:scale-105 shadow-sm
          ${isActive ? "bg-blue-500/20" : "bg-white/10"}
        `}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        ) : error ? (
          <AlertCircle className="w-4 h-4 text-red-400" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 text-white" />
        ) : (
          <Play className="w-4 h-4 text-white ml-0.5" />
        )}
      </button>

      {/* Simple progress bar instead of waveform */}
      <div className="flex-1 bg-white/10 h-[6px] rounded-full overflow-hidden">
        <div
          className="bg-blue-500 h-full transition-all"
          style={{
            width: `${(currentTime / actualDuration) * 100}%`,
          }}
        />
      </div>

      {/* Duration */}
      <div className="flex flex-col items-end text-[11px] text-white/70 flex-shrink-0 w-[44px] text-right">
        <span className="font-mono">{formatTime(currentTime)}</span>
        <span className="text-white/40 font-mono">
          {formatTime(actualDuration)}
        </span>
      </div>
    </div>
  );
};

export default VoiceNotePlayer;
