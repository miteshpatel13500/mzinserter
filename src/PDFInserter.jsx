import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";

export default function PDFInserter() {
  const [mainFiles, setMainFiles] = useState([]);
  const [insertFile, setInsertFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);

  // ✅ Load default insert PDF from /public folder
  useEffect(() => {
    const loadDefaultInsert = async () => {
      try {
        const response = await fetch("/insert.pdf");
        if (!response.ok) throw new Error("insert.pdf not found in /public");
        const blob = await response.blob();
        const file = new File([blob], "insert.pdf", { type: "application/pdf" });
        setInsertFile(file);
      } catch (err) {
        console.error(err);
        setStatus("⚠️ Could not load insert.pdf. Please check your /public folder.");
      }
    };
    loadDefaultInsert();
  }, []);

  const handleMainFilesChange = (e) => {
    setMainFiles(Array.from(e.target.files));
    setStatus("");
    setProgress(0);
  };

  const processAll = async () => {
    if (!insertFile) {
      setStatus("⚠️ Insert PDF missing — please check /public/insert.pdf");
      return;
    }
    if (mainFiles.length === 0) {
      setStatus("⚠️ Please select at least one main PDF.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setStatus("🔄 Preparing to merge...");

    try {
      const insertPdfBytes = await insertFile.arrayBuffer();
      const insertPdf = await PDFDocument.load(insertPdfBytes);

      for (let idx = 0; idx < mainFiles.length; idx++) {
        const mainFile = mainFiles[idx];
        setStatus(`📘 Processing ${idx + 1} of ${mainFiles.length}: ${mainFile.name}`);
        setProgress(((idx / mainFiles.length) * 100).toFixed(0));

        const mainPdfBytes = await mainFile.arrayBuffer();
        const mainPdf = await PDFDocument.load(mainPdfBytes);
        const outputPdf = await PDFDocument.create();
        const totalPages = mainPdf.getPageCount();

        for (let i = 0; i < totalPages; i++) {
          const [mainPage] = await outputPdf.copyPages(mainPdf, [i]);
          outputPdf.addPage(mainPage);

          const [insertPage] = await outputPdf.copyPages(insertPdf, [0]);

          // Match size + scale proportionally
          const { width, height } = mainPage.getSize();
          const scaleX = width / insertPage.getWidth();
          const scaleY = height / insertPage.getHeight();
          const scale = Math.min(scaleX, scaleY);

          insertPage.setSize(width, height);
          insertPage.scale(scale, scale);

          outputPdf.addPage(insertPage);
        }

        const pdfBytes = await outputPdf.save();
        saveAs(new Blob([pdfBytes]), `merged-${mainFile.name}`);
      }

      setProgress(100);
      setStatus("✅ All PDFs processed successfully!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error while processing. Please check console logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>✨ PDF Page Inserter</h2>
        <p style={styles.subtitle}>
          Insert a default page after every page of your uploaded PDFs.
        </p>

       <div
  style={styles.dropZone}
  onDrop={(e) => {
    e.preventDefault();
    setMainFiles(Array.from(e.dataTransfer.files));
  }}
  onDragOver={(e) => e.preventDefault()}
>
  <label htmlFor="pdf-upload" style={styles.dropZoneLabel}>
    <div style={styles.iconWrapper}>
      📂
    </div>
    <div>
      <p style={styles.dropText}>Drag & drop your PDFs here</p>
      <p style={styles.orText}>or click to select files</p>
    </div>
  </label>
  <input
    id="pdf-upload"
    type="file"
    multiple
    accept="application/pdf"
    onChange={handleMainFilesChange}
    style={{ display: "none" }}
  />
</div>

{/* File list preview */}
{mainFiles.length > 0 && (
  <div style={styles.fileList}>
    {mainFiles.map((file, index) => (
      <div key={index} style={styles.fileItem}>
        <span style={styles.fileIcon}>📄</span>
        <span style={styles.fileName}>{file.name}</span>
        <button
          onClick={() =>
            setMainFiles(mainFiles.filter((_, i) => i !== index))
          }
          style={styles.removeBtn}
        >
          ✕
        </button>
      </div>
    ))}
  </div>
)}


        <button
          onClick={processAll}
          disabled={loading}
          style={{
            ...styles.button,
            background: loading
              ? "linear-gradient(135deg, #aaa, #888)"
              : "linear-gradient(135deg, #007bff, #0056d2)",
          }}
        >
          {loading ? "Processing..." : "Generate & Download PDFs"}
        </button>

        {status && (
          <div style={styles.statusBox}>
            <p
              style={{
                ...styles.statusText,
                color: status.startsWith("✅")
                  ? "#28a745"
                  : status.startsWith("❌")
                  ? "#dc3545"
                  : "#333",
              }}
            >
              {status}
            </p>

            {loading && (
              <div style={styles.progressBarOuter}>
                <div
                  style={{
                    ...styles.progressBarInner,
                    width: `${progress}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 🌈 Beautiful inline styles
const styles = {
  container: {
    background: "linear-gradient(135deg, #e0f7fa, #e3f2fd)",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 35px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    width: "95%",
    maxWidth: 480,
    textAlign: "center",
  },
  title: {
    fontSize: 26,
    marginBottom: 8,
    fontWeight: 700,
    color: "#222",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 30,
  },
  inputGroup: {
    textAlign: "left",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: "#333",
  },
  fileInput: {
    display: "block",
    marginTop: 10,
    width: "100%",
    padding: 8,
    borderRadius: 8,
    border: "1px solid #ccc",
    cursor: "pointer",
  },
  fileCount: {
    fontSize: 13,
    color: "#666",
    marginTop: 6,
  },
  button: {
    width: "100%",
    padding: "12px 0",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  statusBox: {
    marginTop: 25,
    background: "#f8f9fa",
    borderRadius: 12,
    padding: "12px 15px",
  },
  statusText: {
    margin: 0,
    fontSize: 14,
    fontWeight: 500,
  },
  progressBarOuter: {
    height: 8,
    background: "#ddd",
    borderRadius: 8,
    marginTop: 10,
    overflow: "hidden",
  },
  progressBarInner: {
    height: "100%",
    background: "linear-gradient(90deg, #007bff, #00c6ff)",
    borderRadius: 8,
    transition: "width 0.3s ease",
  },
  dropZone: {
  border: "2px dashed #007bff",
  borderRadius: 15,
  padding: "40px 20px",
  textAlign: "center",
  background: "linear-gradient(135deg, #f0f8ff, #f9fbff)",
  cursor: "pointer",
  transition: "all 0.3s ease",
  marginBottom: 20,
},
dropZoneLabel: {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  textAlign: "center",
},
iconWrapper: {
  fontSize: 42,
  marginBottom: 10,
},
dropText: {
  fontSize: 16,
  fontWeight: 600,
  color: "#007bff",
  marginBottom: 4,
},
orText: {
  fontSize: 13,
  color: "#555",
},
fileList: {
  marginTop: 15,
  background: "#f8f9fa",
  borderRadius: 10,
  padding: 10,
  maxHeight: 180,
  overflowY: "auto",
},
fileItem: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 12px",
  borderBottom: "1px solid #eee",
  borderRadius: 6,
},
fileIcon: {
  fontSize: 20,
  marginRight: 10,
},
fileName: {
  flex: 1,
  fontSize: 14,
  color: "#333",
  textAlign: "left",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
},
removeBtn: {
  background: "transparent",
  border: "none",
  color: "#dc3545",
  fontSize: 16,
  cursor: "pointer",
  marginLeft: 10,
  transition: "color 0.2s",
},

};
