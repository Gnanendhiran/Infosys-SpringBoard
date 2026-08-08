
const sanitizePath = (p) => {
  // Replace spaces and parentheses with underscores
  let cleaned = p.replace(/[\s()]+/g, "_");
  // Collapse multiple consecutive dots into a single dot
  cleaned = cleaned.replace(/\.\.+/g, ".");
  // Remove leading/trailing underscores or dots
  cleaned = cleaned.replace(/^[_\.]+|[_\.]+$/g, "");
  return cleaned;
};

const paths = [
  "123/123456_My Resume.pdf",
  "123/123456_My Resume (1).pdf",
  "123/123456_My.Resume...pdf",
  "123/123456_ .Resume. .pdf",
  "user id/file name.pdf"
];

paths.forEach(p => {
  console.log(`Original: '${p}' -> Sanitized: '${sanitizePath(p)}'`);
});
