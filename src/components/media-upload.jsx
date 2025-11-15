import { useState, useContext } from "react";
import { useUploadThing } from "../lib/uploadthing";
import { Loader2, X, ImageIcon, Send } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const ImageUploader = ({ chatRoomId, onImageSent, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const { user, authToken } = useContext(AuthContext);

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    input: {
      chatRoomId: chatRoomId,
      userId: user?.id || null,
    },
    headers: {
      "x-user-id": user?.id || "",
      Authorization: `Bearer ${authToken || ""}`,
      withCredentials: true,
    },

    onClientUploadComplete: (res) => {
      console.log("✅ Upload completed:", res);
      if (res && res[0]) {
        setUploadedUrl(res[0].url);
        setUploading(false);
      }
    },
    onUploadError: (error) => {
      console.error("❌ Upload error:", error);
      alert("Failed to upload image: " + error.message);
      setUploading(false);
      setProgress(0);
      setPreview(null);
    },
    onUploadProgress: (p) => {
      setProgress(p);
    },
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert("Image must be less than 4MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to UploadThing
    try {
      setUploading(true);
      await startUpload([file]);
    } catch (error) {
      console.error("Upload failed:", error);
      setPreview(null);
    }
  };

  const handleSendImage = async () => {
    if (!uploadedUrl || !chatRoomId || !user?.id) return;

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/chatserver/chat/chatrooms/${chatRoomId}/messages/image`,
        {
          imageUrl: uploadedUrl,
          senderId: user.id,
          caption: caption.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
          withCredentials: true,
        }
      );

     // console.log("📷 Image message created:", data);
      onImageSent?.(data);
      
      // Reset state
      setPreview(null);
      setUploadedUrl(null);
      setCaption("");
      setProgress(0);
    } catch (error) {
      console.error("Failed to send image:", error);
      alert("Failed to send image. Please try again.");
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setUploadedUrl(null);
    setCaption("");
    setProgress(0);
    onClose();
  };

  return (
    <motion.div
      className="w-full p-4 border-b border-white/10 bg-white/5"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white/70">
          {uploadedUrl ? "Add Caption & Send" : "Upload Image"}
        </span>
        <button
          onClick={handleCancel}
          className="text-white/50 hover:text-white/80 transition-colors p-1"
          disabled={uploading || isUploading}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-60 object-contain rounded-lg bg-black/20"
              />
              {(uploading || isUploading) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg">
                  <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                  <div className="w-3/4 bg-white/20 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-white text-sm mt-2">
                    {Math.round(progress)}%
                  </span>
                </div>
              )}
            </div>

            {uploadedUrl && !uploading && !isUploading && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a caption (optional)..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-white/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendImage();
                    }
                  }}
                />
                <motion.button
                  onClick={handleSendImage}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </motion.button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.label
            key="upload"
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors bg-white/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.02 }}
          >
            <ImageIcon className="w-10 h-10 text-white/40 mb-2" />
            <span className="text-sm text-white/60">Click to upload image</span>
            <span className="text-xs text-white/40 mt-1">PNG, JPG up to 4MB</span>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading || isUploading}
            />
          </motion.label>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ImageUploader;