import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL, authFetch } from "../../../apiConfig";
import { useState, useEffect, useRef } from "react";
import { FaSave, FaCamera } from "react-icons/fa";
import { MdVerified, MdLayers } from "react-icons/md";

const Admin_Manikganj_Campus = () => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [currentId, setCurrentId] = useState(3);

  const fileInputRef = useRef(null);

  const generateTableHTML = (title, data) => {
    if (!data || data.length === 0) return "";
    let html = `<h3>${title}</h3><table border="1" style="width:100%; border-collapse: collapse; margin-bottom: 20px;"><thead><tr><th>SI No.</th><th>Name</th><th>Capacity</th></tr></thead><tbody>`;
    data.forEach((row, index) => {
      html += `<tr><td>${index + 1}</td><td>${row.name}</td><td>${row.capacity}</td></tr>`;
    });
    html += `</tbody></table>`;
    return html;
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/fetchManikganj`);
        const data = await response.json();
        setCurrentId(data.id);
        
        let combinedContent = "";
        
        let engTableData = [];
        let texTableData = [];

        try {
          engTableData = JSON.parse(data.table_engineering || "[]");
        } catch (e) {
          console.error("Error parsing engineering table data", e);
        }

        try {
          texTableData = JSON.parse(data.table_textile || "[]");
        } catch (e) {
          console.error("Error parsing textile table data", e);
        }

        if (engTableData.length > 0 || texTableData.length > 0) {
          combinedContent += data.heading_engineering || "";
          combinedContent += generateTableHTML("Engineering Technologies", engTableData);
          combinedContent += data.heading_textile || "";
          combinedContent += generateTableHTML("Textile/Other Courses", texTableData);
        } else {
          combinedContent = data.heading_engineering || "";
        }

        setContent(combinedContent);

        if (data.image) {
          setImagePreview(data.image.startsWith("http") ? data.image : `${API_BASE_URL}/${data.image}`);
        } else {
          setImagePreview(`${API_BASE_URL}/storage/photos/shares/Neded%20Picture/1545365652Manikganj1.jpg`);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };

    fetchData();
  }, []);


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      toast.success("Image selected successfully!");
    }
  };


  const handleSaveChanges = async () => {
    const formData = new FormData();
    formData.append("heading_engineering", content);
    formData.append("heading_textile", "");
    formData.append("table_engineering", "[]");
    formData.append("table_textile", "[]");

    if (image) {
      formData.append("image", image);
    }
    formData.append("id", currentId || "");

    try {
      const response = await authFetch(`${API_BASE_URL}/saveManikganj`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.image) {
          const finalUrl = data.image.startsWith("http") ? data.image : `${API_BASE_URL}/${data.image}`;
          setImagePreview(finalUrl);
        }
        toast.success("Changes saved successfully!");
      } else {
        toast.error("Failed to save changes!");
      }
    } catch (error) {
      toast.error("Failed to save changes!");
      console.error(error);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen">
        <div className="section-wrapper p-6 md:p-12">
          <div className="w-full">
            <div className="bg-white rounded-[3rem] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100">
            <div className="p-8 md:p-14">
              <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                   <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Manikganj Campus</h2>
                   <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.3em] flex items-center gap-3">
                      <span className="w-10 h-[2px] bg-blue-600"></span>
                      Academic Configuration
                   </p>
                </div>
                <button
                  onClick={handleSaveChanges}
                  className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-[20px] font-black transition-all shadow-2xl shadow-blue-100 hover:-translate-y-1"
                >
                  <FaSave className="text-xl group-hover:rotate-12 transition-transform" />
                  <span>Update Campus Data</span>
                </button>
              </div>

              <div className="flex flex-col gap-12">
                
                <div className="w-full">
                  <div 
                    className="relative group cursor-pointer rounded-[40px] overflow-hidden border-2 border-dashed border-slate-200 hover:border-blue-400 transition-all bg-slate-50 p-3 h-[450px] flex items-center justify-center shadow-inner" 
                    onClick={() => fileInputRef.current.click()}
                  >
                    <div className="w-full h-full rounded-[30px] overflow-hidden relative">
                       <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                       <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center backdrop-blur-sm">
                          <div className="bg-white/20 p-5 rounded-full border border-white/30 text-white mb-4 scale-75 group-hover:scale-100 transition-transform">
                             <FaCamera size={32} />
                          </div>
                          <span className="text-white font-black uppercase tracking-widest text-xs">Update Campus Photo</span>
                       </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>
                </div>

                
                <div className="w-full space-y-8">
                  <div className="bg-slate-50 rounded-[40px] p-4 border border-slate-100">
                    <div className="flex items-center gap-4 mb-4 px-6 py-3 bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 shadow-sm">
                       <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                       </div>
                       <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex-1">campus_content.html</span>
                       <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                          Editor Mode
                       </div>
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full h-[550px] p-10 bg-transparent border-none focus:ring-0 font-mono text-[14px] leading-[1.8] text-slate-700 resize-none placeholder-slate-300"
                      placeholder="Enter HTML content..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center gap-5">
                        <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
                           <MdVerified size={24} />
                        </div>
                        <div>
                           <h4 className="text-slate-900 font-black text-lg">Auto-Format</h4>
                           <p className="text-slate-400 text-xs font-medium">Headings & tables are optimized</p>
                        </div>
                     </div>
                     <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center gap-5">
                        <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
                           <MdLayers size={24} />
                        </div>
                        <div>
                           <h4 className="text-slate-900 font-black text-lg">Responsive</h4>
                           <p className="text-slate-400 text-xs font-medium">Content adjusts to any screen</p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin_Manikganj_Campus;
