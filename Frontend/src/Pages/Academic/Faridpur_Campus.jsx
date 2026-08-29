import { API_BASE_URL } from "../../apiConfig";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

const Faridpur_Campus = () => {
  const [data, setData] = useState({
    content: "",
    image: "",
  });

  useEffect(() => {
    const generateTableHTML = (title, data) => {
      if (!data || data.length === 0) return "";
      let html = `<h3>${title}</h3><table border="1" style="width:100%; border-collapse: collapse; margin-bottom: 20px;"><thead><tr><th>SI No.</th><th>Name</th><th>Capacity</th></tr></thead><tbody>`;
      data.forEach((row, index) => {
        html += `<tr><td>${index + 1}</td><td>${row.name}</td><td>${row.capacity}</td></tr>`;
      });
      html += `</tbody></table>`;
      return html;
    };

    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/fetchFaridpur`);
        const fetchedData = await response.json();

        let combinedContent = "";
        let engTableData = [];
        let texTableData = [];

        try {
          engTableData = JSON.parse(fetchedData.table_engineering || "[]");
          texTableData = JSON.parse(fetchedData.table_textile || "[]");
        } catch (e) {
          console.error("Error parsing table data", e);
        }

        if (engTableData.length > 0 || texTableData.length > 0) {
          combinedContent += fetchedData.heading_engineering || "";
          combinedContent += generateTableHTML("Engineering Technologies", engTableData);
          combinedContent += fetchedData.heading_textile || "";
          combinedContent += generateTableHTML("Textile/Other Courses", texTableData);
        } else {
          combinedContent = fetchedData.heading_engineering || "";
        }

        setData({
          content: combinedContent,
          image: fetchedData.image
            ? fetchedData.image.startsWith("http")
              ? fetchedData.image
              : `${API_BASE_URL}/${fetchedData.image}`
            : "/storage/photos/shares/Neded%20Picture/1545365652Faridpur1.jpg",
        });
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <style>{`
        :root {
          --primary: #0186C0;
          --secondary: #0f172a;
          --heading-color: #000000;
          --bg-light: #f8fafc;
          --text-main: #334155;
          --white: #ffffff;
        }

        .campus-page-wrapper {
          background-color: var(--bg-light);
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--text-main);
          padding: 40px 15px;
          min-height: 100vh;
        }

        .campus-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .premium-card {
          background: var(--white);
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .image-container {
          padding: 15px;
          text-align: center;
        }

        .image-container img {
          width: 100%;
          height: auto;
          border-radius: 12px;
          display: block;
        }

        .content-body {
          padding: 30px 40px;
        }

        /* Dynamic HTML Content Styling */
        .dynamic-html-content {
          line-height: 1.8;
          color: #475569;
          font-size: 1.05rem;
        }

        .dynamic-html-content h1,
        .dynamic-html-content h2,
        .dynamic-html-content h3 {
          color: #0f172a;
          font-weight: 900;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .dynamic-html-content h1 { font-size: 2.25rem; }
        .dynamic-html-content h2 { font-size: 1.85rem; }
        .dynamic-html-content h3 { font-size: 1.5rem; }

        .dynamic-html-content p {
          margin-bottom: 1.5rem;
          text-align: justify;
        }

        .dynamic-html-content b,
        .dynamic-html-content strong {
          color: #1e293b;
          font-weight: 700;
        }

        .dynamic-html-content table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 2.5rem 0;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
        }

        .dynamic-html-content th {
          background-color: #f8fafc;
          color: #64748b;
          padding: 1.25rem 1.5rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 1px solid #e2e8f0;
        }

        .dynamic-html-content td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.95rem;
          font-weight: 500;
          color: #334155;
        }

        .dynamic-html-content tr:last-child td {
          border-bottom: none;
        }

        .dynamic-html-content tr:hover td {
          background-color: #fcfdfe;
        }

        .dynamic-html-content ul,
        .dynamic-html-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }

        .dynamic-html-content li {
          margin-bottom: 0.5rem;
          position: relative;
        }

        @media (max-width: 600px) {
          .campus-page-wrapper { padding: 10px 5px; }
          .content-body { padding: 20px 15px; }
          .dynamic-html-content table {
             display: block;
             overflow-x: auto;
          }
        }
      `}</style>

      <div className="campus-page-wrapper">
        <div className="campus-container">
          <div className="premium-card">

            <div className="image-container">
              <img src={data.image} alt="Faridpur Campus - National Polytechnic Institute NPI Faridpur - Best Polytechnic in Bangladesh" />
            </div>

            <article className="content-body">
              <div className="dynamic-html-content">
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.content || "") }} />
              </div>
            </article>

          </div>
        </div>
      </div>
    </>
  );
};

export default Faridpur_Campus;
