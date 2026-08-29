import { useState } from "react";
import { AiOutlineCloudUpload, AiOutlineFilePdf, AiOutlineFileImage, AiOutlineCheckCircle } from "react-icons/ai";
import { MdClose, MdOutlineTitle } from "react-icons/md";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL, apiClient } from "../../../apiConfig";
import { clearDataCache } from "../../../hooks/useFetchData";

const Admin_Notice = () => {
    const [title, setTitle] = useState("");
    const [files, setFiles] = useState([]);
    const [progress, setProgress] = useState({});

    const styles = {
        container: {
            padding: "50px 20px",
            width: "100%",
            minHeight: "95vh",
            backgroundColor: "#f8fafc",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "18px"
        },
        glassCard: {
            maxWidth: "650px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)",
            padding: "40px",
            border: "1px solid #e2e8f0"
        },
        header: {
            textAlign: "center",
            marginBottom: "35px"
        },
        titleIcon: {
            backgroundColor: "#F0F9FE",
            color: "#0186C0",
            width: "60px",
            height: "60px",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 15px auto",
            fontSize: "30px"
        },
        inputGroup: {
            marginBottom: "25px",
            position: "relative"
        },
        textInput: {
            width: "100%",
            padding: "15px 15px 15px 50px",
            borderRadius: "14px",
            border: "1.5px solid #e2e8f0",
            fontSize: "16px",
            outline: "none",
            transition: "all 0.3s ease",
            backgroundColor: "#fcfcfc",
            color: "#1e293b"
        },
        dropZone: {
            border: "2px dashed #cbd5e1",
            borderRadius: "20px",
            padding: "40px 20px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: "#f8fafc",
            transition: "all 0.3s ease",
            marginBottom: "30px",
            position: "relative"
        },
        fileItem: {
            display: "flex",
            alignItems: "center",
            gap: "15px",
            backgroundColor: "#ffffff",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            marginBottom: "15px",
            position: "relative",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)"
        },
        progressBar: {
            height: "6px",
            width: "100%",
            backgroundColor: "#e2e8f0",
            borderRadius: "10px",
            marginTop: "10px",
            overflow: "hidden"
        },
        progressFill: (percent) => ({
            width: `${percent}%`,
            height: "100%",
            backgroundColor: percent === 100 ? "#22c55e" : "#0186C0",
            transition: "width 0.3s ease-out, background-color 0.3s ease",
            borderRadius: "10px"
        }),
        uploadBtn: {
            width: "100%",
            padding: "16px",
            backgroundColor: "#1e293b",
            color: "#ffffff",
            border: "none",
            borderRadius: "14px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: "0 10px 15px -3px rgba(30, 41, 59, 0.2)"
        }
    };

    const handleFileInputClick = () => {
        document.getElementById("notice_img")?.click();
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const validFiles = selectedFiles.filter((file) => {
            const isValid = file.type === "application/pdf" || file.type.startsWith("image/");
            if (!isValid) toast.error(`File not supported: ${file.name}`);
            return isValid;
        });

        if (validFiles.length > 0) {
            setFiles((prev) => [...prev, ...validFiles]);

            validFiles.forEach(file => {
                setProgress(prev => ({ ...prev, [file.name]: 100 }));
            });
        }
    };

    const handleRemoveFile = (fileName) => {
        setFiles((prev) => prev.filter((file) => file.name !== fileName));
        setProgress((prev) => {
            const next = { ...prev };
            delete next[fileName];
            return next;
        });
    };

    const handleSubmit = async () => {
        if (!title || files.length === 0) {
            toast.warn("Please complete all fields.");
            return;
        }

        const apiUrl = `${API_BASE_URL}/upload-notice`;
        const loadingToast = toast.loading("Publishing notice...");

        const formData = new FormData();
        formData.append("title", title);
        files.forEach(file => {
            formData.append("files", file);
        });

        const initialProgress = {};
        files.forEach(file => {
            initialProgress[file.name] = 0;
        });
        setProgress(initialProgress);

        try {
            await apiClient.post(apiUrl, formData, {
                onUploadProgress: (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        const newProgress = {};
                        files.forEach(file => {
                            newProgress[file.name] = Math.min(percent, 99);
                        });
                        setProgress(newProgress);
                    }
                }
            });

            const finalProgress = {};
            files.forEach(file => {
                finalProgress[file.name] = 100;
            });
            setProgress(finalProgress);
            setTimeout(() => {
                toast.update(loadingToast, { render: "Notice Published!", type: "success", isLoading: false, autoClose: 3000 });
                setTitle("");
                setFiles([]);
                setProgress({});
                try { clearDataCache('/get-notices'); } catch (error) { console.warn('Failed to refresh notice cache', error); }
            }, 300);
        } catch (error) {
            console.error("Upload error:", error);
            const message = error?.response?.data?.message || error?.response?.data?.error || "Upload Failed.";
            toast.update(loadingToast, { render: message, type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.glassCard}>
                <div style={styles.header}>
                    <div style={styles.titleIcon}><AiOutlineCloudUpload /></div>
                    <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0" }}>Create New Notice</h2>
                    <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>Upload official documents or images for the students.</p>
                </div>

                <div style={styles.inputGroup}>
                    <MdOutlineTitle style={{ position: "absolute", left: "18px", top: "18px", color: "#94a3b8", fontSize: "20px" }} />
                    <input
                        type="text"
                        placeholder="Notice Headline..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={styles.textInput}
                        onFocus={(e) => { e.target.style.borderColor = "#0186C0"; e.target.style.boxShadow = "0 0 0 4px rgba(1, 134, 192, 0.1)"; }}
                        onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                    />
                </div>

                <div
                    style={styles.dropZone}
                    onClick={handleFileInputClick}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                >
                    <AiOutlineCloudUpload style={{ fontSize: "48px",margin:"0 auto", color: "#0186C0", marginBottom: "10px" }} />
                    <p style={{ fontWeight: "600", color: "#334155", margin: "0" }}>Click to upload file</p>
                    <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "5px" }}>PDF, PNG, JPG (Max. 10MB)</p>
                    <input id="notice_img" type="file" hidden onChange={handleFileChange} accept=".pdf, image/*" />
                </div>

                {files.length > 0 && (
                    <div style={{ marginBottom: "30px" }}>
                        <p style={{ fontSize: "12px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "15px" }}>Selected Files</p>
                        {files.map((file) => (
                            <div key={file.name} style={styles.fileItem}>
                                <div style={{ fontSize: "28px", color: "#0186C0" }}>
                                    {file.type.startsWith("image/") ? <AiOutlineFileImage /> : <AiOutlineFilePdf />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <p style={{ fontSize: "14px", fontWeight: "600", color: "#334155", margin: 0, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                                        <span style={{ fontSize: "12px", fontWeight: "700", color: progress[file.name] === 100 ? "#22c55e" : "#0186C0", marginLeft: "auto" }}>
                                            {progress[file.name] === 100 ? "Ready" : `${progress[file.name] || 0}%`}
                                        </span>
                                    </div>
                                    <div style={styles.progressBar}>
                                        <div style={styles.progressFill(progress[file.name] || 0)}></div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveFile(file.name)}
                                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "5px" }}
                                    onMouseOver={(e) => e.currentTarget.style.color = "#ef4444"}
                                    onMouseOut={(e) => e.currentTarget.style.color = "#94a3b8"}
                                >
                                    <MdClose size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    style={styles.uploadBtn}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#334155"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "#1e293b"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                    <AiOutlineCheckCircle size={22} />
                    Publish Notice
                </button>
            </div>
        </div>
    );
};

export default Admin_Notice;
