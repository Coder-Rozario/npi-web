import { API_BASE_URL } from "../../apiConfig";
import { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaUser, FaBuilding, FaLayerGroup, FaPenNib, FaImage } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FeedbackForm = () => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [type, setType] = useState('running');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const wordLimit = 250;

  const handleMessageChange = (e) => {
    const inputMessage = e.target.value;
    const wordCount = inputMessage.trim() === "" ? 0 : inputMessage.trim().split(/\s+/).length;
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

    if (!name || !message || !photo || (type === 'running' && !semester)) {
      toast.error('Please fill out all required fields.');
      return;
    }

    const wordCount = message.trim() === "" ? 0 : message.trim().split(/\s+/).length;
    if (wordCount > wordLimit) {
      toast.error(`Your feedback exceeds the ${wordLimit} word limit. Please shorten it.`);
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('message', message);
    formData.append('photo', photo);
    formData.append('type', type);
    formData.append('department', department);
    formData.append('semester', type === 'running' ? semester : '');

    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Thank you! Your feedback has been submitted.', {
          position: "top-center",
          autoClose: 5000,
        });
        handleCancel();
      } else {
        toast.error('Submission failed. Please try again later.');
      }
    } catch (error) {
      toast.error('Network error. Check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setMessage('');
    removePhoto();
    setType('running');
    setDepartment('');
    setSemester('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors mb-6 group"
        >
          <div className="bg-white p-3 rounded-full shadow-sm group-hover:shadow-md transition-all">
            <FaArrowLeft />
          </div>
          <span className="font-medium">Back to Home</span>
        </Link>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white p-6 md:p-10">
          <header className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2">
              Share Your <span className="text-blue-600">Experience</span>
            </h1>
            <p className="text-slate-500">Your feedback helps us grow and inspire others.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-2">
              <label htmlFor="photo" className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1">
                <FaImage className="text-blue-500" /> Profile Photo
                <span className="text-red-400 text-sm font-normal">(Required)</span>
              </label>
              <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div
                  onClick={() => !photoPreview && fileInputRef.current?.click()}
                  className={`w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors flex-shrink-0 ${
                    photoPreview
                      ? "border-slate-300 cursor-default bg-white shadow-sm"
                      : "border-blue-400 hover:border-blue-500 hover:bg-blue-50 bg-white"
                  }`}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <FaImage className="text-blue-400 text-2xl mb-1" />
                      <span className="text-xs text-blue-400 font-medium">Add Photo</span>
                    </>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1 pt-1">
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
                      className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 w-fit shadow-sm"
                    >
                      Choose Image
                    </button>
                  )}
                  {photoPreview && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 shadow-sm"
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
                  <p className="text-xs text-slate-400">Image will be shown as your profile photo. Max 5MB. (JPG, PNG, WebP)</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1">
                <FaUser className="text-blue-500" /> Your Name
                <span className="text-red-400 text-sm font-normal">(Required)</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white text-slate-800 px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1">
                <FaBuilding className="text-blue-500" /> Student Type
                <span className="text-red-400 text-sm font-normal">(Required)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="flex items-center gap-3 flex-1 cursor-pointer p-3 rounded-xl border-2 transition-all hover:bg-white">
                  <input
                    type="radio"
                    name="studentType"
                    value="running"
                    checked={type === 'running'}
                    onChange={(e) => setType(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`font-medium ${type === 'running' ? 'text-blue-600' : 'text-slate-600'}`}>
                    Currently Studying
                  </span>
                </label>
                <label className="flex items-center gap-3 flex-1 cursor-pointer p-3 rounded-xl border-2 transition-all hover:bg-white">
                  <input
                    type="radio"
                    name="studentType"
                    value="finished"
                    checked={type === 'finished'}
                    onChange={(e) => setType(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`font-medium ${type === 'finished' ? 'text-blue-600' : 'text-slate-600'}`}>
                    Already Passed
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="department" className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1">
                <FaLayerGroup className="text-blue-500" /> Department
              </label>
              <select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-white text-slate-800 px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all appearance-none cursor-pointer"
              >
                <option value="">Select your department (optional)</option>
                <option value="Computer Technology">Computer Technology</option>
                <option value="Civil Technology">Civil Technology</option>
                <option value="Electrical Technology">Electrical Technology</option>
                <option value="Electronics Technology">Electronics Technology</option>
                <option value="Mechanical Technology">Mechanical Technology</option>
                <option value="Textile Technology">Textile Technology</option>
                <option value="Architecture Technology">Architecture Technology</option>
                <option value="Automobile Technology">Automobile Technology</option>
                <option value="Food Technology">Food Technology</option>
              </select>
            </div>

            {type === 'running' && (
              <div className="space-y-2">
                <label htmlFor="semester" className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1">
                  <FaLayerGroup className="text-blue-500" /> Semester
                  <span className="text-red-400 text-sm font-normal">(Required)</span>
                </label>
                <select
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full bg-white text-slate-800 px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select your semester</option>
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="3rd Semester">3rd Semester</option>
                  <option value="4th Semester">4th Semester</option>
                  <option value="5th Semester">5th Semester</option>
                  <option value="6th Semester">6th Semester</option>
                  <option value="7th Semester">7th Semester</option>
                  <option value="8th Semester">8th Semester</option>
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="message" className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1">
                <FaPenNib className="text-blue-500" /> Your Feedback
                <span className="text-red-400 text-sm font-normal">(Required)</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={handleMessageChange}
                className="w-full bg-white text-slate-800 px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all resize-none"
                rows="5"
                placeholder="Share your experience, thoughts, and suggestions about the institute..."
                required
              ></textarea>
              <div className="flex justify-between items-center px-1">
                <p className="text-xs text-slate-400">Write a genuine feedback to help others.</p>
                <p className={`text-sm font-medium ${(message.trim() === "" ? 0 : message.trim().split(/\s+/).length) > wordLimit * 0.9 ? 'text-orange-500' : 'text-slate-500'}`}>
                  {message.trim() === "" ? 0 : message.trim().split(/\s+/).length} / {wordLimit} words
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-3 font-semibold rounded-2xl hover:from-blue-700 hover:to-blue-600 disabled:from-blue-400 disabled:to-blue-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>

          </form>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </div>
  );
};

export default FeedbackForm;
