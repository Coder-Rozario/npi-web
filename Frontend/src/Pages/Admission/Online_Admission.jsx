import { API_BASE_URL } from "../../apiConfig";
import { useEffect, useState, useRef } from "react";
import DOMPurify from "dompurify";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  HiOutlineUser, HiOutlineAcademicCap, HiOutlineCash,
  HiCheckCircle, HiOutlineUpload, HiOutlineInformationCircle
} from "react-icons/hi";

const Online_Admission = () => {
  const currentYear = new Date().getFullYear();
  const [content, setContent] = useState("");
  const [phone, setPhone] = useState("+8801728710248");
  const [formData, setFormData] = useState({
    nationality: "Bangladeshi",
    upojati: "No",
    freefighter: "No",
    dobDay: "",
    dobMonth: "",
    dobYear: ""
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [latestImage, setLatestImage] = useState(null);
  const topRef = useRef(null);

  useEffect(() => {

    fetch(`${API_BASE_URL}/get-instruction`)
      .then((response) => {
        if (!response.ok) throw new Error("Not Found");
        return response.json();
      })
      .then((data) => {
        if (data.content) setContent(data.content);
        if (data.phone) setPhone(data.phone);
      })
      .catch((err) => {
        console.error("Error fetching instruction:", err);
      });

    fetch(`${API_BASE_URL}/get-latest-image`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.image_path) {
          const cleanPath = data.image_path.replace(/\\/g, '/').replace(/^\/?api\/?/, '').replace(/^\/?uploads\/?/, '');
          setLatestImage(`${API_BASE_URL}/uploads/${cleanPath}`);
        }
      })
      .catch((err) => console.error("Error fetching latest image:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { dobDay, dobMonth, dobYear, ...rest } = formData;
    let date_of_birth = formData.date_of_birth;
    if (dobDay && dobMonth && dobYear) {
      const d = String(dobDay).padStart(2, "0");
      const m = String(dobMonth).padStart(2, "0");
      const y = String(dobYear).padStart(4, "0");
      date_of_birth = `${y}-${m}-${d}`;
    }
    const finalData = { ...rest, date_of_birth };

    const data = new FormData();
    for (const key in finalData) { data.append(key, finalData[key]); }
    if (image) { data.append("image", image); }

    const loadingToast = toast.loading("Processing Application...", { theme: "colored" });

    try {
      const response = await fetch(`${API_BASE_URL}/submit-admission`, {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        toast.update(loadingToast, {
          render: "Application Submitted Successfully! Check your email for confirmation.",
          type: "success",
          isLoading: false,
          autoClose: 5000,
          icon: "🚀"
        });
        setFormData({
          nationality: "Bangladeshi",
          upojati: "No",
          freefighter: "No",
          dobDay: "",
          dobMonth: "",
          dobYear: ""
        });
        setImage(null);
        setPreview(null);
        topRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        let errorMessage = "Error submitting form. Please try again.";
        if (result && Array.isArray(result.errors) && result.errors.length > 0) {
          errorMessage = result.errors.map(e => e.message).join(" ");
        } else if (result && typeof result.message === 'string') {
          errorMessage = result.message;
        } else if (result && typeof result.error === 'string') {
          errorMessage = result.error;
        }
        toast.update(loadingToast, {
          render: errorMessage,
          type: "error",
          isLoading: false,
          autoClose: 6000
        });
      }
    } catch (error) {
      toast.update(loadingToast, {
        render: "Check your connection or server status.",
        type: "error",
        isLoading: false,
        autoClose: 4000
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdff] py-10 px-4">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <div ref={topRef} />

      <div className="max-w-6xl mx-auto">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-900 rounded-[2.5rem] p-10 mb-10 text-white shadow-2xl shadow-blue-200">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <span className="inline-block px-4 py-1 bg-blue-500/30 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase mb-4 border border-blue-400/30">
                Official Admission Portal
              </span>
              <h1 className="text-xl md:text-5xl font-black mb-2 tracking-tight">Apply for Admission</h1>
              <p className="text-blue-100/80 font-medium">Empowering the next generation of engineers</p>
            </div>
            <div className="hidden lg:block bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl text-center">
              <div className="text-3xl font-bold">{currentYear}</div>
              <div className="text-xs uppercase tracking-widest opacity-60">Academic Session</div>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <HiOutlineInformationCircle className="text-blue-600" /> Instructions
              </h3>
              <div
                className="text-slate-600 text-sm leading-relaxed prose prose-blue"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content || "Please read all instructions carefully before submitting.") }}
              />
            </div>

            <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-200">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <HiCheckCircle /> Support Line
              </h4>
              <p className="text-blue-100 text-sm mb-4">Facing any problem while filling the form?</p>
              <div className="text-xl font-black">{phone}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-8">

            <div className="bg-white p-4 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Personal Profile</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="As per SSC Certificate" />

                <div className="relative group">
                  <label className="text-[13px] font-bold text-slate-500 mb-1.5 block ml-1 transition-colors group-focus-within:text-blue-600">Technology <span className="text-red-400">*</span></label>
                  <select name="course_id" value={formData.course_id || ""} onChange={handleChange} required
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-700 shadow-sm appearance-none">
                    <option value="">Select Technology</option>
                    {["Computer", "Electrical", "Civil", "Mechanical", "Architecture", "Electronics", "Automobile", "Textile", "Food"].map(tech => (
                      <option key={tech} value={tech}>{tech} Technology</option>
                    ))}
                  </select>
                </div>

                <div className="relative group">
                  <label className="text-[13px] font-bold text-slate-500 mb-1.5 block ml-1 transition-colors group-focus-within:text-blue-600">Date of Birth <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1 ml-1">Date</p>
                      <select name="dobDay" value={formData.dobDay || ""} onChange={handleChange} required
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-700 shadow-sm appearance-none">
                        <option value="">DD</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>{String(d).padStart(2, "0")}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1 ml-1">Month</p>
                      <select name="dobMonth" value={formData.dobMonth || ""} onChange={handleChange} required
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-700 shadow-sm appearance-none">
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1 ml-1">Year</p>
                      <input
                        type="number"
                        name="dobYear"
                        value={formData.dobYear || ""}
                        onChange={handleChange}
                        required
                        min="1950"
                        max={new Date().getFullYear()}
                        placeholder="YYYY"
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-700 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <label className="text-[13px] font-bold text-slate-500 mb-1.5 block ml-1 transition-colors group-focus-within:text-blue-600">Gender <span className="text-red-400">*</span></label>
                  <select name="gender" value={formData.gender || ""} onChange={handleChange} required
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-700 shadow-sm appearance-none">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <InputField label="Father's Name" name="father_name" value={formData.father_name} onChange={handleChange} />
                <InputField label="Mother's Name" name="mother_name" value={formData.mother_name} onChange={handleChange} />
                <InputField label="Mobile Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="017XXXXXXXX" />
                <InputField label="Guardian Phone" name="guardian_phone" type="tel" value={formData.guardian_phone} onChange={handleChange} />
                <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="example@mail.com" />
                <InputField label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="Bangladeshi" />

                <div className="relative group md:col-span-2">
                  <label className="text-[13px] font-bold text-slate-500 mb-1.5 block ml-1 transition-colors group-focus-within:text-blue-600">Full Address <span className="text-red-400">*</span></label>
                  <textarea name="address" value={formData.address || ""} onChange={handleChange} required placeholder="Village, Post, Upazila, District"
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-700 shadow-sm min-h-[100px]" />
                </div>

                <div className="relative group">
                  <label className="text-[13px] font-bold text-slate-500 mb-1.5 block ml-1 transition-colors group-focus-within:text-blue-600">Tribal Status (Upojati) <span className="text-red-400">*</span></label>
                  <select name="upojati" value={formData.upojati || ""} onChange={handleChange} required
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-700 shadow-sm appearance-none">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div className="relative group">
                  <label className="text-[13px] font-bold text-slate-500 mb-1.5 block ml-1 transition-colors group-focus-within:text-blue-600">Freedom Fighter (Quota) <span className="text-red-400">*</span></label>
                  <select name="freefighter" value={formData.freefighter || ""} onChange={handleChange} required
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-700 shadow-sm appearance-none">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="mt-8">
                <label className="text-[13px] font-bold text-slate-500 mb-3 block ml-1 uppercase tracking-widest">Applicant's Photograph</label>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 shrink-0">
                    {preview ? (
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : latestImage ? (
                      <img src={latestImage} alt="Latest Admission" className="w-full h-full object-cover" />
                    ) : (
                      <HiOutlineUser size={40} className="text-slate-300" />
                    )}
                  </div>
                  <label className="flex-1 w-full group cursor-pointer">
                    <div className="border-2 border-dashed border-slate-200 group-hover:border-blue-400 group-hover:bg-blue-50/30 rounded-3xl p-6 text-center transition-all">
                      <HiOutlineUpload className="mx-auto text-slate-400 group-hover:text-blue-600 mb-2" size={24} />
                      <span className="text-sm font-bold text-slate-600 block">Click to Upload Photo</span>
                      <span className="text-[11px] text-slate-400 uppercase tracking-tighter">JPG or PNG • Max 5MB</span>
                    </div>
                    <input type="file" className="hidden" onChange={handleFileChange} required />
                  </label>
                </div>
              </div>
            </div>

            {/* Section: Academic & Payment Summary Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Academic Mini Section */}
                <div>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><HiOutlineAcademicCap className="text-blue-400" /> Academic Info</h3>
                  <div className="space-y-4">
                    <select name="exam_id" value={formData.exam_id || ""} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all">
                      <option value="" className="text-black">Select Examination</option>
                      <option value="SSC" className="text-black">SSC</option>
                      <option value="Dakhil" className="text-black">Dakhil</option>
                      <option value="Vocational" className="text-black">Vocational</option>
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" name="board" value={formData.board || ""} onChange={handleChange} required placeholder="Board Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
                      <input type="text" name="devition" value={formData.devition || ""} onChange={handleChange} required placeholder="Group/Division" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" name="b_roll" value={formData.b_roll || ""} onChange={handleChange} required placeholder="Board Roll No" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
                      <input type="text" name="r_number" value={formData.r_number || ""} onChange={handleChange} required placeholder="Registration No" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" name="pass_year" value={formData.pass_year || ""} onChange={handleChange} required placeholder="Passing Year" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
                      <input type="number" step="0.01" name="gpa" value={formData.gpa || ""} onChange={handleChange} required placeholder="Result (GPA)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Payment Mini Section */}
                <div>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><HiOutlineCash className="text-green-400" /> Payment TRX</h3>
                  <div className="space-y-4">
                    <input type="number" name="transaction_amount" value={formData.transaction_amount || ""} onChange={handleChange} required placeholder="Amount Paid" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
                    <input type="text" name="btransaction_id" value={formData.btransaction_id || ""} onChange={handleChange} required placeholder="bKash Transaction ID" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-mono text-blue-300" />
                    <input type="text" name="transaction_reference" value={formData.transaction_reference || ""} onChange={handleChange} required placeholder="Transaction Reference" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-[11px] text-blue-200 leading-relaxed italic">
                      * Please ensure the Transaction ID is correct to avoid application rejection.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Luxury Submit Button */}
            <div className="flex flex-col items-center gap-4">
              <button type="submit" className="w-full md:w-auto px-16 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-full shadow-2xl shadow-blue-300 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg">
                Submit Application <HiCheckCircle size={24} />
              </button>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">Secure 256-bit Encrypted Submission</p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

// Modern Input Component - Moved outside to prevent re-rendering issues
const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = true }) => (
  <div className="relative group">
    <label className="text-[13px] font-bold text-slate-500 mb-1.5 block ml-1 transition-colors group-focus-within:text-blue-600">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-700 shadow-sm"
    />
  </div>
);

export default Online_Admission;
