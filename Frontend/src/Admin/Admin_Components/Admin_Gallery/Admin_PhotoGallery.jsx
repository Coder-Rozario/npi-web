import { API_BASE_URL } from "../../../apiConfig";
import { useEffect, useState } from "react";
import { AiOutlinePlus, AiOutlineClose, AiOutlineEdit } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Admin_PhotoGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [formData, setFormData] = useState({ title: "", photo: null });
  const [previewImg, setPreviewImg] = useState(null);
  const [imageVersion, setImageVersion] = useState(Date.now());

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/photos?t=${new Date().getTime()}`);
      const data = Array.isArray(response.data) ? [...response.data].reverse() : [];
      setPhotos(data);
      setImageVersion(Date.now());
    } catch (error) {
      console.error("Error fetching gallery photos:", error);
      toast.error("Failed to load gallery photos.");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (item) => {
    if (!item || !item.url) return "";
    if (item.url.startsWith("http") || item.url.startsWith("data:")) return item.url;
    const normalized = item.url.replace(/\\/g, "/");
    return `${API_BASE_URL}/${normalized}?t=${imageVersion}`;
  };

  const openAddModal = () => {
    setCurrentPhoto(null);
    setFormData({ title: "", photo: null });
    setPreviewImg(null);
    setModalOpen(true);
  };

  const openEditModal = (photo) => {
    setCurrentPhoto(photo);
    setFormData({ title: photo.title || "", photo: null });
    setPreviewImg(getImageUrl(photo));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentPhoto(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));
      setPreviewImg(URL.createObjectURL(file));
    }
  };

  const confirmDelete = (photo) => {
    toast(({ closeToast }) => (
      <div className="p-3 rounded-xl bg-white shadow-lg border border-slate-200">
        <p className="font-semibold text-slate-900">Delete this photo?</p>
        <p className="text-sm text-slate-500 mt-1">This action cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={closeToast}
            className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              closeToast();
              await handleDelete(photo.id);
            }}
            className="px-4 py-2 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    ), { autoClose: false, closeButton: false });
  };

  const handleDelete = async (photoId) => {
    try {
      await axios.delete(`${API_BASE_URL}/photos/${photoId}`);
      toast.success("Photo deleted successfully.");
      fetchPhotos();
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to delete photo.");
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title for the photo.");
      return;
    }

    if (!currentPhoto && !formData.photo) {
      toast.error("Please select a photo file.");
      return;
    }

    try {
      if (currentPhoto) {
        // Editing existing photo
        if (formData.photo instanceof File) {
          // Changing both title and file
          const payload = new FormData();
          payload.append("title", formData.title.trim());
          payload.append("photo", formData.photo);
          await axios.put(`${API_BASE_URL}/photos/${currentPhoto.id}`, payload);
        } else {
          // Only updating title (no file change)
          await axios.put(`${API_BASE_URL}/photos/${currentPhoto.id}`, {
            title: formData.title.trim(),
          });
        }
        toast.success("Photo updated successfully.");
      } else {
        // Adding new photo
        if (!formData.photo) {
          toast.error("Please select a photo file.");
          return;
        }
        const payload = new FormData();
        payload.append("title", formData.title.trim());
        payload.append("photo", formData.photo);
        await axios.post(`${API_BASE_URL}/upload`, payload);
        toast.success("Photo added successfully.");
      }
      setImageVersion(Date.now());
      fetchPhotos();
      closeModal();
    } catch (error) {
      console.error("Error saving photo:", error);
      toast.error("Failed to save photo.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900">Admin Photo Gallery</h1>
            <p className="mt-2 text-slate-500 max-w-2xl">
              Manage gallery cards, upload new photos, edit titles, and remove outdated images.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-3xl bg-sky-600 px-6 py-3 text-white font-semibold shadow-lg shadow-sky-200 transition hover:bg-sky-700"
          >
            <AiOutlinePlus size={20} /> Add New Photo
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 rounded-3xl bg-white shadow-sm">
            <span className="text-slate-500 text-lg">Loading photos...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {photos.length ? photos.map((photo, index) => (
              <motion.div
                key={photo.id || index}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]"
              >
                <div className="relative h-80 overflow-hidden bg-slate-100">
                  <img
                    src={getImageUrl(photo)}
                    alt={photo.title || `Photo ${index + 1}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-md">
                    {photo.title || "Untitled photo"}
                  </div>
                  <div className="absolute inset-0 bg-slate-950/0 transition duration-300 group-hover:bg-slate-950/30"></div>
                  <div className="absolute inset-0 flex items-end justify-between p-4 opacity-0 transition duration-300 group-hover:opacity-100">
                    <button
                      onClick={() => openEditModal(photo)}
                      className="rounded-2xl bg-white/90 px-4 py-3 text-slate-800 shadow-sm hover:bg-white"
                    >
                      <AiOutlineEdit size={18} /> Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(photo)}
                      className="rounded-2xl bg-red-600 px-4 py-3 text-white shadow-sm hover:bg-red-700"
                    >
                      <AiOutlineClose size={18} /> Delete
                    </button>
                  </div>
                </div>
                <div className="p-6 text-center">
                  <div className="text-sm uppercase tracking-[0.2em] text-sky-600 font-bold mb-2">Photo #{index + 1}</div>
                  <p className="text-slate-500 leading-7">
                    {photo.title ? `Title: ${photo.title}` : "No title set yet"}
                  </p>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full rounded-[2rem] bg-white p-12 text-center shadow-sm">
                <p className="text-xl font-semibold text-slate-700">No gallery photos yet.</p>
                <p className="mt-3 text-slate-500">Use the button above to upload your first photo with a title.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {currentPhoto ? "Edit Photo" : "Add Gallery Photo"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">Set the title and choose a file to publish this gallery card.</p>
                </div>
                <button onClick={closeModal} className="rounded-full bg-slate-100 p-3 text-slate-600 hover:bg-slate-200">
                  <AiOutlineClose size={20} />
                </button>
              </div>

              <div className="grid gap-5">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Photo Title</span>
                  <input
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Enter image title..."
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Photo File</span>
                  <div className="relative mt-3 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-sky-400">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 h-full w-full opacity-0 cursor-pointer rounded-3xl" />
                    <div className="pointer-events-none relative">
                      <p className="text-slate-500">{previewImg ? "Change an image" : "Click or drop an image file here"}</p>
                    </div>
                  </div>
                </label>

                {previewImg && (
                  <div className="overflow-hidden rounded-[1.75rem] border border-slate-200">
                    <img src={previewImg} alt="Preview" className="h-72 w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={closeModal}
                  className="w-full rounded-3xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="w-full rounded-3xl bg-sky-600 px-6 py-3 text-white font-semibold shadow-lg shadow-sky-200 transition hover:bg-sky-700"
                >
                  {currentPhoto ? "Save Changes" : "Add Photo"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin_PhotoGallery;
