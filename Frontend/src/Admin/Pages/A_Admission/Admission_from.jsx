import { useState, useEffect } from "react";
import { API_BASE_URL, authFetch } from "../../../apiConfig";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Admission_from = () => {
  const [editorHtml, setEditorHtml] = useState("");
  const [phone, setPhone] = useState("");
  const [instructionId, setInstructionId] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/get-instruction?t=${Date.now()}`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error("Instruction not found");
        return response.json();
      })
      .then((data) => {
        if (data && data.id) {
          setEditorHtml(data.content || "");
          setPhone(data.phone || "");
          setInstructionId(data.id);
        }
      })
      .catch((err) => {
        console.error("Error fetching instruction:", err);

        setInstructionId(null);
      });
  }, []);

  const handleSave = () => {
    if (!editorHtml.trim()) {
      toast.error("Instructions cannot be empty!", { theme: "colored" });
      return;
    }

    console.log("Saving. ID:", instructionId, "Phone:", phone, "Content length:", editorHtml.length);
    const url = instructionId
      ? `${API_BASE_URL}/update-instruction/${instructionId}`
      : `${API_BASE_URL}/add-instruction`;

    const loadingToast = toast.loading("Saving changes...", { theme: "colored" });

    authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editorHtml, phone: String(phone) }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        toast.update(loadingToast, { render: data.message || "Saved successfully!", type: "success", isLoading: false, autoClose: 3000 });

        if (data.id) {
          setInstructionId(data.id);
        }
      })
      .catch((err) => {
        console.error("Error saving instruction:", err);
        toast.update(loadingToast, { render: "Failed to save. Check backend connection.", type: "error", isLoading: false, autoClose: 3000 });
      });
  };

  return (
    <div
      data-aos="fade-up"
      data-aos-duration="3000"
      className="Online_admission text-[18px]"
    >
      <div className="Heading_Text">
        <h1 className="Heading">Online Admission</h1>
        <span>4 years Diploma in Engineering in</span>
        <strong>
          Computer, Electrical, Textile, Electronics, Food, Mechanical,
          Automobile, Civil, Architecture
        </strong>
      </div>

      <div className="admission-info mb-14 mt-16 px-4 sm:px-8 md:px-12 max-w-6xl mx-auto">
        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.06)] border border-slate-50">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admission Instructions</h2>
                 <p className="text-slate-400 font-medium text-sm mt-1 uppercase tracking-[0.2em]">HTML Source Editor</p>
              </div>
              <button
                 onClick={handleSave}
                 className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100 hover:-translate-y-1"
              >
                 <FaSave className="group-hover:rotate-12 transition-transform" />
                 <span>Save Instructions</span>
              </button>
           </div>

           <div className="mb-8">
              <label className="text-sm font-bold text-slate-500 mb-2 block uppercase tracking-wider">Support Line Number</label>
              <input
                 type="text"
                 value={phone}
                 onChange={(e) => setPhone(e.target.value)}
                 placeholder="Enter Support Line Number (e.g. +8801728710248)"
                 className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all outline-none text-slate-700 font-bold"
              />
           </div>

           <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-[2.5rem] blur opacity-20"></div>
              <div className="relative bg-slate-50 rounded-[2.5rem] p-4 border border-slate-200/60">
                 <div className="flex items-center gap-3 mb-4 px-4 py-2 bg-white/50 rounded-2xl border border-white/80">
                    <div className="flex gap-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                    </div>
                    <div className="h-3 w-[1px] bg-slate-200 mx-1"></div>
                    <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">admission_inst.html</span>
                 </div>
                 <textarea
                    value={editorHtml}
                    onChange={(e) => setEditorHtml(e.target.value)}
                    className="w-full h-[450px] p-6 bg-transparent border-none focus:ring-0 font-mono text-[14px] leading-relaxed text-slate-700 resize-none"
                    placeholder="Enter HTML instruction here..."
                 />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Admission_from;
