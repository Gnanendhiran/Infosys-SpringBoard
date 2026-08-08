
const sanitizePath = (p) => {
    let cleaned = p.replace(/[\s()]+/g, "_");
    cleaned = cleaned.replace(/\.\.+/g, ".");
    cleaned = cleaned.replace(/^[_\.]+|[_\.]+$/g, "");
    return cleaned;
};

const userId = "gu68nWKKxqTcMzxWqb22s9l3S5H3";
const filename = "1763900871642_3VC22CS163_SIRISHA_VL_CSE.pdf";
const fullPath = `${userId}/${filename}`;

console.log("Original Path:", fullPath);
console.log("Sanitized Path:", sanitizePath(fullPath));
