import { API_BASE_URL } from "../../apiConfig";
import { useState, useEffect, useRef } from "react";
import { FaArrowLeft, FaImage } from "react-icons/fa";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const P_FeedbackForm = () => {
  const [name, setName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const wordLimit = 250;

  const handleMessageChange = (e) => {
    const inputMessage = e.target.value;
    const wordCount = inputMessage.trim().split(/\s+/).length;
    if (wordCount <= wordLimit) {
      setMessage(inputMessage);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB.");
      return;
    }
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const wordCount = message.trim().split(/\s+/).length;
    if (wordCount > wordLimit) {
      toast.error(`Your feedback exceeds the ${wordLimit} word limit. Please shorten it.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("occupation", occupation);
      formData.append("message", message);
      if (photo) {
        formData.append("photo", photo);
      }

      const response = await fetch(`${API_BASE_URL}/add-parents-feedback`, {
        method: "POST",
        body: formData,
      });

      let data = {};
      const contentType = response.headers.get("content-type") || "";
      try {
        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error("Non-JSON response:", text.substring(0, 300));
          data = { error: response.status === 500 ? "Server error. Please contact support or try again later." : `Unexpected response (${response.status})` };
        }
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        data = { error: `Server response error (${response.status})` };
      }

      if (response.ok) {
        setStatus("Feedback submitted successfully!");
        setStatusType("success");
        setName("");
        setOccupation("");
        setMessage("");
        setPhoto(null);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.success("Feedback submitted successfully!");
      } else {
        let errorMsg = "Error submitting feedback.";
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          errorMsg = data.errors.map((e) => e.message).join("\n");
        } else if (data.error) {
          errorMsg = data.error;
        } else if (data.message) {
          errorMsg = data.message;
        } else if (response.status === 500) {
          errorMsg = "Server error (500). Please upload the latest server.js to cPanel and restart the Node app.";
        }
        setStatus(errorMsg);
        setStatusType("error");
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error(err);
      const msg = "Network error submitting feedback. Please check your connection and try again.";
      setStatus(msg);
      setStatusType("error");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-4xl mx-auto px-6">
        <Link to="/" className="text-gray-600 hover:text-gray-800 p-2 rounded-full">
          <FaArrowLeft className="text-xl" />
        </Link>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Submit Your Feedback</h1>

        {status && (
          <div className={`p-4 mb-6 rounded-md text-center ${
            statusType === "error"
              ? "bg-red-100 text-red-800 border border-red-200"
              : "bg-green-100 text-green-800 border border-green-200"
          }`}>
            {status}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="photo" className="block text-gray-600 mb-2">
              Your Photo <span className="text-gray-400 text-sm">(Optional)</span>
            </label>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div
                onClick={() => !photoPreview && fileInputRef.current?.click()}
                className={`w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${
                  photoPreview ? "border-gray-300 cursor-default" : "border-gray-400 hover:border-blue-500 hover:bg-blue-50 bg-gray-50"
                }`}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <FaImage className="text-gray-400 text-2xl mb-1" />
                    <span className="text-xs text-gray-400">Add Photo</span>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                {!photoPreview && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 w-fit"
                  >
                    Choose Image
                  </button>
                )}
                {photoPreview && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-400">Image will be shown as your profile photo. Max 5MB. (JPG, PNG, WebP)</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-600 mb-2">Your Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white text-black px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="occupation" className="block text-gray-600 mb-2">Your Occupation</label>
            <input
              type="text"
              id="occupation"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full bg-white text-black px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your occupation"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="message" className="block text-gray-600 mb-2">Your Feedback</label>
            <textarea
              id="message"
              value={message}
              onChange={handleMessageChange}
              className="w-full bg-white text-black px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Write your feedback here"
              required
            ></textarea>
            <p className="text-gray-500 text-sm mt-1">
              {message.trim().split(/\s+/).length} / {wordLimit} words
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setName("");
                setOccupation("");
                setMessage("");
                setStatus("");
                setStatusType("");
                removePhoto();
              }}
              className="px-4 py-2 bg-gray-200 rounded-lg text-black hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </div>
  );
};

export default P_FeedbackForm;
