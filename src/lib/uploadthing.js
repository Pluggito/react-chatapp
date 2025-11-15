import { generateReactHelpers } from "@uploadthing/react";

// Point to your Express backend's UploadThing endpoint
export const { useUploadThing, uploadFiles } = generateReactHelpers({
  url: `${import.meta.env.VITE_API_BASE_URL}/chatserver/chat/uploadthing`,
});