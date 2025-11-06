"use client";

import { useState, useRef, useEffect } from "react";
import { Square, Play, Pause, Send, Trash2, Loader2, Mic } from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

const VoiceRecorderInline = ({ onSendVoiceNote, chatRoomId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const canvasRef = useRef(null);
  const playbackContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const playbackWaveformRef = useRef(null);
  const streamRef = useRef(null);

  const MAX_RECORDING_TIME = 60;

  // In VoiceRecorderInline - UPDATE CLEANUP
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);

      // FIX: Check if context is open before closing
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }

      if (playbackWaveformRef.current) {
        try {
          playbackWaveformRef.current.destroy();
        } catch (err) {
          console.error("Playback waveform cleanup error:", err);
        }
      }

      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioUrl]);

  // ==================== WAVEFORM VISUALIZATION ====================
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#60a5fa";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  // ==================== START RECORDING ====================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;

      drawWaveform();

      // Use MP3 if supported, otherwise WebM
      let mimeType = "audio/webm;codecs=opus";
      if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/mpeg")) {
        mimeType = "audio/mpeg";
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        stream.getTracks().forEach((track) => track.stop());

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        initPlaybackWaveform(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to access microphone. Please check permissions.");
    }
  };

  // ==================== PAUSE/RESUME RECORDING ====================
  const togglePauseRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    } else if (mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  // ==================== STOP RECORDING ====================
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === "recording" ||
        mediaRecorderRef.current.state === "paused")
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  // ==================== PLAYBACK WAVEFORM ====================
  const initPlaybackWaveform = (url) => {
    if (playbackContainerRef.current && url) {
      playbackWaveformRef.current = WaveSurfer.create({
        container: playbackContainerRef.current,
        waveColor: "#4b5563",
        progressColor: "#60a5fa",
        cursorColor: "#60a5fa",
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 40,
        barGap: 2,
      });

      playbackWaveformRef.current.load(url);

      playbackWaveformRef.current.on("finish", () => {
        setIsPlaying(false);
      });
    }
  };

  // ==================== PLAY/PAUSE ====================
  const togglePlayPause = () => {
    if (playbackWaveformRef.current) {
      playbackWaveformRef.current.playPause();
      setIsPlaying(!isPlaying);
    }
  };

  // ==================== UPLOAD AUDIO (FIXED) ====================
  const uploadAudio = async (blob) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();

      const fileExtension = blob.type.includes("mp4")
        ? "m4a"
        : blob.type.includes("mpeg")
        ? "mp3"
        : "webm";

      formData.append("audio", blob, `voice-note.${fileExtension}`);
      formData.append("chatRoomId", chatRoomId);

      // FIXED: Match the path from Chat.tsx
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/chatserver/chat/chatrooms/${chatRoomId}/messages/audio`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      return response.data.url;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ==================== SEND VOICE NOTE ====================
  const handleSendVoiceNote = async () => {
    if (!audioBlob) return;

    try {
      // Upload directly without compression
      const url = await uploadAudio(audioBlob);

      onSendVoiceNote({
        mediaUrl: url,
        duration: recordingTime,
        type: "AUDIO",
      });

      handleDiscard();
    } catch (error) {
      console.error("Failed to send voice note:", error);
      alert("Failed to send voice note. Please try again.");
    }
  };

  // ==================== DISCARD ====================
  const handleDiscard = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    if (playbackWaveformRef.current) {
      playbackWaveformRef.current.destroy();
      playbackWaveformRef.current = null;
    }
  };

  // ==================== FORMAT TIME ====================
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ==================== RENDER ====================
  return (
    <motion.div
      className="w-full space-y-3 sm:space-y-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {/* Recording State */}
      {isRecording && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              />
              <span className="text-xs font-medium text-white/70">
                Recording...
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-white">
              {formatTime(recordingTime)}
            </span>
          </div>

          {/* Live Waveform */}
          <motion.div
            className="bg-white/5 border border-white/10 rounded-lg p-2 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <canvas
              ref={canvasRef}
              width="400"
              height="40"
              className="w-full h-10"
              style={{ filter: "drop-shadow(0 0 2px rgba(96, 165, 250, 0.2))" }}
            />
          </motion.div>

          {/* Recording Progress */}
          <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-500"
              style={{
                width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Recording Controls */}
          <div className="flex gap-2">
            <motion.button
              onClick={togglePauseRecording}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm border border-white/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              )}
            </motion.button>
            <motion.button
              onClick={stopRecording}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Square className="w-4 h-4" fill="white" />
              Done
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Playback State */}
      {!isRecording && audioBlob && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Playback Waveform */}
          <motion.div
            className="bg-white/5 border border-white/10 rounded-lg overflow-hidden backdrop-blur-sm"
            ref={playbackContainerRef}
          />

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={togglePlayPause}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 p-2 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isUploading}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </motion.button>

            <span className="font-mono text-xs font-semibold text-white/70 min-w-[35px]">
              {formatTime(recordingTime)}
            </span>

            <div className="flex-1" />

            <motion.button
              onClick={handleDiscard}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors border border-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isUploading}
            >
              <Trash2 className="w-4 h-4 text-white/70" />
            </motion.button>

            <motion.button
              onClick={handleSendVoiceNote}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 p-2 rounded-lg transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </motion.button>
          </div>

          {/* Upload Progress */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Uploading...</span>
                  <span className="text-white/80 font-semibold">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Idle State */}
      {!isRecording && !audioBlob && (
        <motion.button
          onClick={startRecording}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <Mic className="w-4 h-4" />
          </motion.div>
          Start Recording
        </motion.button>
      )}
    </motion.div>
  );
};

export default VoiceRecorderInline;
