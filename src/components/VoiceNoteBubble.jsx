import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Trash2 } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function VoiceNoteBubble({ src, isOwn }) {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "rgba(255,255,255,0.3)",
        progressColor: isOwn ? "rgb(29,185,84)" : "rgb(88,101,242)",
        barWidth: 2,
        barRadius: 3,
        height: 36,
        responsive: true,
        cursorWidth: 0,
      });

      wavesurfer.current.load(src);

      wavesurfer.current.on("ready", () => {
        setDuration(wavesurfer.current.getDuration());
      });

      wavesurfer.current.on("audioprocess", () => {
        if (wavesurfer.current.isPlaying()) {
          setCurrentTime(wavesurfer.current.getCurrentTime());
        }
      });

      wavesurfer.current.on("finish", () => {
        setIsPlaying(false);
        setCurrentTime(duration);
      });
    }

    return () => wavesurfer.current?.destroy();
  }, [src]);

  const togglePlay = () => {
    wavesurfer.current.playPause();
    setIsPlaying(!isPlaying);
  };

  const formatTime = (t) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 max-w-xs px-3 py-3 rounded-2xl ${
        isOwn
          ? "bg-gradient-to-r from-[#1a1a1a] to-[#222] ml-auto text-white"
          : "bg-[#202020] text-gray-100"
      } shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={togglePlay}
        className="p-2 rounded-full bg-[#2a2a2a] hover:bg-[#333] transition"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </motion.button>

      <div className="flex-1">
        <div ref={waveformRef} className="w-32" />
        <div className="text-xs text-gray-400 mt-1">{formatTime(currentTime || duration)}</div>
      </div>

      <motion.button
        whileTap={{ scale: 0.8 }}
        className="text-gray-500 hover:text-red-400"
      >
        <Trash2 size={16} />
      </motion.button>
    </motion.div>
  );
}
