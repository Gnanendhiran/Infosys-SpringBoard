// Export utilities for generating reports

export const exportToCSV = (data: any[], filename: string = "export.csv") => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? "";
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = async (content: string, filename: string = "report.pdf") => {
  // Basic PDF export - in production, use a library like jsPDF or pdfkit
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #6B46C1; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #6B46C1; color: white; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

export const generateCandidateReport = (candidates: any[]) => {
  const reportData = candidates.map(candidate => ({
    Name: candidate.fileName || "Unknown",
    "Match Score": `${candidate.matchScore || 0}%`,
    "Skills Matched": `${candidate.skillsMatched || 0}/${candidate.totalSkills || 0}`,
    Experience: candidate.experience || "N/A",
    Education: candidate.education || "N/A",
    Status: candidate.status || "pending",
  }));

  return reportData;
};


