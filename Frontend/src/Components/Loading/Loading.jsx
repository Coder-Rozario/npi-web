import loadingImage from "../../Images/loading.png";

const Loading = () => {
    const styles = {
        overlay: {
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8fafc",
            overflow: "hidden",
        },
        backgroundPattern: {
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            pointerEvents: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23000000'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        },
        container: {
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
            width: "min(92%, 520px)",
            maxWidth: "520px",
        },
        logoSection: {
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "128px",
            height: "128px",
            marginBottom: "32px",
        },
        logoContainer: {
            zIndex: 10,
            backgroundColor: "#ffffff",
            padding: "12px",
            borderRadius: "9999px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            border: "1px solid #f1f5f9",
        },
        logoImg: {
            width: "64px",
            height: "64px",
            objectFit: "contain",
        },
        textSection: {
            marginBottom: "40px",
        },
        title: {
            fontSize: "26px",
            fontWeight: "bold",
            color: "#1e293b",
            margin: "0 0 8px 0",
            letterSpacing: "-0.02em",
        },
        DhakaSpan: {
            color: "#1d4ed8",
        },
        subtitle: {
            fontSize: "12px",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#64748b",
            opacity: 0.8,
            margin: 0,
        },
        progressWrapper: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        },
        progressBar: {
            position: "relative",
            width: "280px",
            height: "6px",
            backgroundColor: "#e2e8f0",
            borderRadius: "9999px",
            overflow: "hidden",
        },
        statusText: {
            marginTop: "16px",
            fontSize: "10px",
            color: "#94a3b8",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.backgroundPattern} />

            <div style={styles.container} className="loading-container">
                <div style={styles.logoSection} className="loading-logo-section">
                    <div className="inner-gear-npi" />
                    <div className="outer-ring-npi" />
                    <div style={styles.logoContainer} className="loading-logo-container">
                        <img src={loadingImage} alt="NPI Logo" style={styles.logoImg} className="loading-logo-img" />
                    </div>
                </div>

                <div style={styles.textSection}>
                    <h1 style={styles.title} className="loading-title">
                        National Polytechnic Institute,<span style={styles.DhakaSpan}>Dhaka</span>
                    </h1>
                    <p style={styles.subtitle} className="loading-subtitle">
                        Best Polytechnic Institute in Bangladesh
                    </p>
                </div>

                <div style={styles.progressWrapper}>
                    <div style={styles.progressBar} className="loading-progress-bar">
                        <div className="loader-slide-npi" />
                    </div>
                    <p style={styles.statusText} className="pulse-text-npi loading-status-text">
                        PLEASE WAIT...
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .inner-gear-npi {
                    position: absolute;
                    inset: 0;
                    border: 4px dashed rgba(3, 105, 161, 0.15);
                    border-radius: 9999px;
                    animation: spin 8s linear infinite;
                    will-change: transform;
                }
                .outer-ring-npi {
                    position: absolute;
                    inset: 0;
                    border-top: 4px solid #075985;
                    border-radius: 9999px;
                    animation: spin 1.2s linear infinite;
                    will-change: transform;
                }
                .loader-slide-npi {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 35%;
                    border-radius: 9999px;
                    background: linear-gradient(to right, #0C4A6E, #0186C0, #0C4A6E);
                    animation: slide 1.6s infinite ease-in-out;
                    will-change: transform;
                }
                .pulse-text-npi {
                    animation: pulse 2s ease-in-out infinite;
                    will-change: opacity;
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slide { 0% { transform: translateX(-145%); } 100% { transform: translateX(210%); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                @media (max-width: 639px) {
                  .loading-container {
                    width: min(92%, 360px) !important;
                  }
                  .loading-title {
                    font-size: 20px !important;
                  }
                  .loading-subtitle {
                    font-size: 10px !important;
                  }
                  .loading-logo-section {
                    width: 112px !important;
                    height: 112px !important;
                    margin-bottom: 24px !important;
                  }
                  .loading-logo-container {
                    padding: 10px !important;
                  }
                  .loading-logo-img {
                    width: 54px !important;
                    height: 54px !important;
                  }
                  .loading-progress-bar {
                    width: 200px !important;
                  }
                  .loading-status-text {
                    font-size: 9px !important;
                  }
                }
                @media (prefers-reduced-motion: reduce) {
                  .inner-gear-npi,
                  .outer-ring-npi,
                  .loader-slide-npi,
                  .pulse-text-npi {
                    animation: none !important;
                  }
                }
            `}} />
        </div>
    );
};

export default Loading;
