// backend/utils/pdfGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generateLeavePDF({ leave, studentSnapshot }) {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = `leave-${leave._id}.pdf`;
  const filepath = path.join(uploadsDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Leave Approval Pass', { align: 'center' });
      doc.moveDown();

      // Student details
      doc.fontSize(12).text(`Name: ${studentSnapshot.name || ''}`);
      if (studentSnapshot.rollNumber) doc.text(`Roll No: ${studentSnapshot.rollNumber}`);
      if (studentSnapshot.branch) doc.text(`Branch: ${studentSnapshot.branch}`);
      if (studentSnapshot.year) doc.text(`Year: ${studentSnapshot.year}`);
      if (studentSnapshot.hostel) doc.text(`Hostel: ${studentSnapshot.hostel}`);
      doc.moveDown();

      // Leave details
      doc.text(`Reason: ${leave.reason}`);
      doc.text(`From: ${new Date(leave.fromDate).toLocaleDateString()}`);
      doc.text(`To: ${new Date(leave.toDate).toLocaleDateString()}`);
      doc.moveDown();

      // Approval statuses
      doc.text(`Faculty Status: ${leave.facultyStatus || 'pending'}`);
      doc.text(`Rector Status: ${leave.rectorStatus || 'pending'}`);
      doc.moveDown();

      doc.text(`Issued on: ${new Date().toLocaleDateString()}`);
      doc.moveDown(2);

      // Signatures
      doc.moveDown(2);
      doc.text('__________________________           __________________________', { continued: false });
      doc.text('   Faculty Signature                              Rector Signature');

      doc.end();

      stream.on('finish', () => {
        resolve({ filename, filepath: `/uploads/${filename}` });
      });
      stream.on('error', (e) => reject(e));
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { generateLeavePDF };


// // backend/utils/pdfGenerator.js
// const PDFDocument = require('pdfkit');
// const fs = require('fs');
// const path = require('path');

// async function generateLeavePDF({ leave, studentSnapshot }) {
//   // ensure uploads exists
//   const uploadsDir = path.join(__dirname, '..', 'uploads');
//   if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

//   const filename = `leave-${leave._id}.pdf`;
//   const filepath = path.join(uploadsDir, filename);

//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ margin: 50 });
//       const stream = fs.createWriteStream(filepath);
//       doc.pipe(stream);

//       // Header
//       doc.fontSize(20).text('Leave Approval Pass', { align: 'center' });
//       doc.moveDown();

//       // Student details
//       doc.fontSize(12).text(`Name: ${studentSnapshot.name || ''}`);
//       if (studentSnapshot.rollNumber) doc.text(`Roll No: ${studentSnapshot.rollNumber}`);
//       if (studentSnapshot.branch) doc.text(`Branch: ${studentSnapshot.branch}`);
//       if (studentSnapshot.year) doc.text(`Year: ${studentSnapshot.year}`);
//       if (studentSnapshot.hostel) doc.text(`Hostel: ${studentSnapshot.hostel}`);
//       doc.moveDown();

//       // Leave details
//       doc.text(`Reason: ${leave.reason}`);
//       doc.text(`From: ${new Date(leave.fromDate).toLocaleDateString()}`);
//       doc.text(`To: ${new Date(leave.toDate).toLocaleDateString()}`);
//       doc.moveDown();

//       // Approval statuses
//       doc.text(`Faculty Status: ${leave.facultyStatus || 'pending'}`);
//       doc.text(`Rector Status: ${leave.rectorStatus || 'pending'}`);
//       doc.moveDown();

//       doc.text(`Issued on: ${new Date().toLocaleDateString()}`);
//       doc.moveDown(2);

//       // signature placeholders
//       doc.text('__________________________           __________________________', { continued: false });
//       doc.text('   Faculty Signature                              Rector Signature');

//       doc.end();

//       stream.on('finish', () => {
//         resolve({ filename, filepath: `/uploads/${filename}` });
//       });
//       stream.on('error', (e) => reject(e));
//     } catch (e) {
//       reject(e);
//     }
//   });
// }

// module.exports = { generateLeavePDF };

// // const fs = require("fs");
// // const PDFDocument = require("pdfkit");

// // const generatePDF = (leave, user) => {
// //   const dir = './uploads';
// //   if (!fs.existsSync(dir)) fs.mkdirSync(dir);

// //   const filePath = `${dir}/pass_${leave._id}.pdf`;
// //   const doc = new PDFDocument();
// //   doc.pipe(fs.createWriteStream(filePath));

// //   doc.fontSize(20).text("Leave Pass", { align: "center" });
// //   doc.moveDown();
// //   doc.fontSize(14).text(`Student Name: ${user.name}`);
// //   doc.text(`Email: ${user.email}`);
// //   doc.text(`From: ${leave.fromDate}`);
// //   doc.text(`To: ${leave.toDate}`);
// //   doc.text(`Reason: ${leave.reason}`);
// //   doc.text(`Approval: Rector Approved`);

// //   doc.end();
// //   return filePath;
// // };

// // module.exports = generatePDF;