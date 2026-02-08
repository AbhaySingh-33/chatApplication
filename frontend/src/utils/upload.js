export const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    ); 
    formData.append("api_key", import.meta.env.VITE_CLOUDINARY_API_KEY); 
  
    // Determine folder & resource type
    const fileType = file.type.startsWith("image") ? "image" : "video";
    const folder = fileType === "image" ? "chat_images" : "chat_videos";
  
    formData.append("folder", folder);
  
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_NAME
        }/${fileType}/upload`,
        { method: "POST", body: formData }
      );
  
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      return null;
    }
  };
