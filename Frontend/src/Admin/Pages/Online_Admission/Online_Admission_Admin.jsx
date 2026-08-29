import { API_BASE_URL, authFetch } from "../../../apiConfig";
import { useState, useEffect } from "react";
import { FaTimes, FaEye, FaDownload, FaUserAlt, FaCreditCard, FaGraduationCap } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import Loading from "../../../Components/Loading/Loading";
import logo from "../../../Images/loading.png";

const Online_Admission_Admin = () => {
  const [admissionList, setAdmissionList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const formatDate = (isoDate) => {
    if (!isoDate) return "N/A";
    const str = String(isoDate).trim();
    const m = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) {
      const year = m[1];
      const month = String(m[2]).padStart(2, "0");
      const day = String(m[3]).padStart(2, "0");
      return `${day}/${month}/${year}`;
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return str;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const correctedPath = imagePath.replace(/\\/g, '/');
    return `${API_BASE_URL}/${correctedPath}`;
  };

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const [admissionResponse, statusResponse] = await Promise.all([
        authFetch(`${API_BASE_URL}/online-admissions?t=${Date.now()}`, { cache: 'no-store' }),
        authFetch(`${API_BASE_URL}/online-admissions-status?t=${Date.now()}`, { cache: 'no-store' })
      ]);

      const admissionData = await admissionResponse.json();
      const statusData = await statusResponse.json();

      if (Array.isArray(admissionData) && Array.isArray(statusData)) {
        const mergedData = admissionData.map((admission) => {
          const status = statusData.find((s) => s.id === admission.id);
          return { ...admission, is_Clicked: status ? status.is_Clicked : 0 };
        });

        setAdmissionList(mergedData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } else {
        console.error('Unexpected data format:', { admissionData, statusData });
        setAdmissionList([]);
      }
    } catch (err) {
      toast.error("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmissions = admissionList.filter((adm) => 
    adm.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    adm.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    adm.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    adm.course_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    adm.btransaction_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewAdmission = async (admission) => {
    if (!admission.is_Clicked) {
      try {
        await authFetch(`${API_BASE_URL}/update-admission-status/${admission.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_Clicked: 1 }),
        });
        fetchAdmissions();
      } catch (err) {
        console.error(err);
      }
    }
    setSelectedAdmission(admission);
  };


  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const student = selectedAdmission;
    

    const primaryColor = [0, 0, 0];
    const secondaryColor = [100, 116, 139];
    const textColor = [30, 41, 59];


    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 45, "F"); 
    doc.setDrawColor(226, 232, 240);
    doc.line(0, 45, 210, 45);
    

    try {
      doc.addImage(logo, "JPEG", 97, 5, 14, 14);
    } catch (e) {
      console.error("Logo error:", e);
    }

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("NATIONAL POLYTECHNIC INSTITUTE", 105, 27, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Online Admission Application Form", 105, 34, { align: "center" });


    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`Application ID: NPI-${student.id} | Date: ${new Date(student.created_at).toLocaleDateString()}`, 105, 40, { align: "center" });


    const imgUrl = getImageUrl(student.image);
    if (imgUrl) {
      doc.setDrawColor(0, 0, 0);
      doc.rect(150, 50, 40, 45); 
      doc.addImage(imgUrl, "JPEG", 151, 51, 38, 43);
    }


    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("PERSONAL INFORMATION", 20, 55);
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 58, 140, 58);

    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    const personalY = 68;
    const rowHeight = 8;

    const personalData = [
      ["Full Name", student.full_name],
      ["Date of Birth", formatDate(student.date_of_birth)],
      ["Gender", student.gender],
      ["Father's Name", student.father_name],
      ["Mother's Name", student.mother_name],
      ["Email Address", student.email],
      ["Phone Number", student.phone],
      ["Guardian Phone", student.guardian_phone],
      ["Nationality", student.nationality],
      ["Address", student.address],
      ["Tribal Status", student.upojati || "N/A"],
      ["Freedom Fighter", student.freefighter || "N/A"],
    ];

    personalData.forEach((item, index) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${item[0]}:`, 20, personalY + index * rowHeight);
      doc.setFont("helvetica", "normal");
      doc.text(String(item[1]), 65, personalY + index * rowHeight);
    });


    const academicY = 175;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("ACADEMIC RECORD", 20, academicY);
    doc.line(20, academicY + 3, 190, academicY + 3);

    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    const academicData = [
      ["Course Applied", student.course_id],
      ["Examination", student.exam_id],
      ["Board Roll", student.b_roll],
      ["Registration No", student.r_number],
      ["GPA Score", student.gpa],
      ["Passing Year", student.pass_year],
      ["Board", student.board],
      ["Group/Division", student.devition],
    ];

    academicData.forEach((item, index) => {
      const xPos = index % 2 === 0 ? 20 : 110;
      const yPos = academicY + 12 + Math.floor(index / 2) * 10;
      doc.setFont("helvetica", "bold");
      doc.text(`${item[0]}:`, xPos, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(String(item[1]), xPos + 35, yPos);
    });


    const paymentY = 225;
    doc.setFillColor(248, 250, 252);
    doc.rect(20, paymentY, 170, 30, "F");
    doc.setDrawColor(0, 0, 0);
    doc.rect(20, paymentY, 170, 30);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT VERIFICATION", 25, paymentY + 8);
    
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.text(`bKash Transaction ID: ${student.btransaction_id}`, 25, paymentY + 18);
    doc.text(`Amount Paid: BDT ${student.transaction_amount}`, 25, paymentY + 24);
    doc.text(`Reference: ${student.transaction_reference}`, 110, paymentY + 18);
    doc.text(`Status: COMPLETED`, 110, paymentY + 24);


    const footerY = 270;
    doc.setDrawColor(...secondaryColor);
    doc.line(140, footerY, 190, footerY);
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Authorized Signature", 165, footerY + 5, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.text(`© ${new Date().getFullYear()} National Polytechnic Institute. All Rights Reserved.`, 105, 290, { align: "center" });


    doc.save(`${student.full_name.replace(/\s+/g, '_')}_Admission.pdf`);
  };

  useEffect(() => { fetchAdmissions(); }, []);

  return (
    <div className="min-h-screen bg-[#f1f5f9] py-12 px-4 font-sans w-full">
      <style>{`
        .glass-modal { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
        .info-pill { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; transition: all 0.3s; }
        .info-pill:hover { border-color: #0186C0; background: #fff; }
        @keyframes custom-ping { 75%, 100% { transform: scale(1.5); opacity: 0; } }
        .animate-status-ping { animation: custom-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <div className="w-full">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admission <span className="text-blue-600">Portal</span></h1>
            <p className="text-slate-500 mt-2 font-medium italic">Review and manage upcoming student applications</p>
          </div>
          
          <div className="relative w-full md:w-80 group">
            <input
              type="text"
              placeholder="Search admissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 pl-12 focus:border-blue-600 focus:ring-0 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </header>


        
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          <div className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Total</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{admissionList.length}</p>
          </div>
          <div className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
            <p className="text-blue-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Pending</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{admissionList.filter(f => !f.is_Clicked).length}</p>
          </div>
          <div className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
            <p className="text-green-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Accepted</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{admissionList.filter(f => f.is_Clicked).length}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loading /></div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-3xl shadow-sm text-slate-400 font-bold">{searchQuery ? "No matching records found." : "No Records Found"}</div>
        ) : (
          <div className="max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid gap-5">
              {filteredAdmissions.map((admission) => (
                <div
                  key={admission.id}
                  className={`group relative overflow-hidden bg-white rounded-2xl transition-all duration-300 hover:shadow-xl border-l-8 ${
                    admission.is_Clicked ? "border-slate-200" : "border-slate-900 bg-slate-50/30"
                  }`}
                >
                  {!admission.is_Clicked && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl z-10">
                      New
                    </div>
                  )}
                  <div className="p-5 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                      <img
                        src={getImageUrl(admission.image)}
                        alt="Student"
                        className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover shadow-md border-2 border-white"
                      />
                      {!admission.is_Clicked && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-status-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-900"></span>
                        </span>
                      )}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-slate-800">{admission.full_name}</h3>
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full font-black border ${
                          admission.is_Clicked ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-slate-900 text-white border-slate-900"
                        }`}>
                          {admission.is_Clicked ? "Archived" : "New"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 text-xs">
                        <p className="text-slate-500"><strong className="text-slate-700">Phone:</strong> {admission.phone}</p>
                        <p className="text-slate-500"><strong className="text-slate-700">Course:</strong> {admission.course_id}</p>
                        <p className="text-slate-500 italic">{new Date(admission.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewAdmission(admission)}
                      className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 text-xs uppercase tracking-wider ${
                        admission.is_Clicked 
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                        : "bg-slate-900 text-white hover:bg-black shadow-slate-200"
                      }`}
                    >
                      <FaEye /> View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      
      {selectedAdmission && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedAdmission(null)}></div>
          
          <div className="relative glass-modal w-full max-w-5xl max-h-full rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100"><FaUserAlt /></div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedAdmission.full_name}</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Application Dossier</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDownloadPDF} className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all"><FaDownload /></button>
                <button onClick={() => setSelectedAdmission(null)} className="p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><FaTimes /></button>
              </div>
            </div>

            
            <div className="p-8 overflow-y-auto custom-scrollbar bg-white/30">
              <div className="flex flex-col lg:flex-row gap-8">
                
                <div className="lg:w-1/3">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <img 
                      src={getImageUrl(selectedAdmission.image)} 
                      alt="Student Photo" 
                      className="w-full aspect-square rounded-[1.5rem] object-cover mb-4 ring-4 ring-slate-50 shadow-inner"
                    />
                    <div className="text-center mb-5">
                      <h3 className="text-lg font-black text-slate-900 leading-tight mb-1 truncate">{selectedAdmission.full_name}</h3>
                      <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Applicant</p>
                    </div>
                    <div className="space-y-4 text-center">
                      <div className="py-2 px-4 bg-slate-50 rounded-xl">
                        <p className="text-[10px] text-slate-400 font-black uppercase">Selected Course</p>
                        <p className="text-blue-600 font-black text-lg">{selectedAdmission.course_id}</p>
                      </div>
                      <div className="py-2 px-4 bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
                        <p className="text-[10px] text-blue-100 font-black uppercase">Transaction Status</p>
                        <p className="text-white font-black text-lg">TK {selectedAdmission.transaction_amount}</p>
                      </div>
                    </div>
                  </div>
                </div>

                
                <div className="lg:w-2/3 space-y-8">
                  
                  <section>
                    <div className="flex items-center gap-2 mb-4 text-blue-600">
                      <FaCreditCard /> <h3 className="font-black uppercase tracking-widest text-sm">Payment Verification</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="info-pill"><p className="text-xs text-slate-400 font-bold mb-1">bKash Transaction ID</p><p className="font-mono font-bold text-slate-800">{selectedAdmission.btransaction_id}</p></div>
                      <div className="info-pill"><p className="text-xs text-slate-400 font-bold mb-1">Reference</p><p className="font-bold text-slate-800">{selectedAdmission.transaction_reference}</p></div>
                    </div>
                  </section>

                  
                  <section>
                    <div className="flex items-center gap-2 mb-4 text-purple-600">
                      <FaGraduationCap /> <h3 className="font-black uppercase tracking-widest text-sm">Academic Record</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="info-pill"><p className="text-xs text-slate-400 font-bold mb-1">Exam</p><p className="font-bold text-slate-800">{selectedAdmission.exam_id}</p></div>
                      <div className="info-pill"><p className="text-xs text-slate-400 font-bold mb-1">Board Roll</p><p className="font-bold text-slate-800">{selectedAdmission.b_roll}</p></div>
                      <div className="info-pill"><p className="text-xs text-slate-400 font-bold mb-1">Reg No</p><p className="font-bold text-slate-800">{selectedAdmission.r_number}</p></div>
                      <div className="info-pill"><p className="text-xs text-slate-400 font-bold mb-1">GPA Score</p><p className="font-black text-purple-600">{selectedAdmission.gpa}</p></div>
                      <div className="info-pill"><p className="text-xs text-slate-400 font-bold mb-1">Pass Year</p><p className="font-bold text-slate-800">{selectedAdmission.pass_year}</p></div>
                      <div className="info-pill"><p className="text-xs text-slate-400 font-bold mb-1">Board</p><p className="font-bold text-slate-800 uppercase">{selectedAdmission.board}</p></div>
                      <div className="info-pill md:col-span-2"><p className="text-xs text-slate-400 font-bold mb-1">Group/Division</p><p className="font-bold text-slate-800 uppercase">{selectedAdmission.devition}</p></div>
                    </div>
                  </section>

                  
                  <section>
                    <div className="flex items-center gap-2 mb-4 text-emerald-600">
                      <FaUserAlt /> <h3 className="font-black uppercase tracking-widest text-sm">Personal Profile</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100/50">
                      <div className="text-sm">
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Father's Name</p>
                        <p className="font-bold text-slate-800 mb-2">{selectedAdmission.father_name}</p>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Mother's Name</p>
                        <p className="font-bold text-slate-800 mb-2">{selectedAdmission.mother_name}</p>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Date of Birth</p>
                        <p className="font-bold text-slate-800 mb-2">{formatDate(selectedAdmission.date_of_birth)}</p>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Gender</p>
                        <p className="font-bold text-slate-800 mb-2">{selectedAdmission.gender}</p>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Nationality</p>
                        <p className="font-bold text-slate-800">{selectedAdmission.nationality}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Guardian Phone</p>
                        <p className="font-bold text-slate-800 mb-2">{selectedAdmission.guardian_phone}</p>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Email</p>
                        <p className="font-bold text-slate-800 mb-2 lowercase truncate">{selectedAdmission.email}</p>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Tribal Status</p>
                        <p className="font-bold text-slate-800 mb-2 uppercase">{selectedAdmission.upojati}</p>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Freedom Fighter</p>
                        <p className="font-bold text-slate-800 uppercase">{selectedAdmission.freefighter}</p>
                      </div>
                      <div className="sm:col-span-2 pt-2 border-t border-emerald-100/50">
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Permanent Address</p>
                        <p className="font-bold text-slate-800">{selectedAdmission.address}</p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 text-center text-[10px] text-slate-400 font-black uppercase tracking-tighter border-t border-slate-100">
              National Polytechnic Institute • Admission Administration System • {new Date().getFullYear()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Online_Admission_Admin;
