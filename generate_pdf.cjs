const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Define the output path within the public directory
const outputPath = path.join(__dirname, 'public', 'citizen_safety_guide.pdf');

// Ensure the public directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

// Create a new PDF document
const doc = new PDFDocument({ margin: 50 });

// Pipe the PDF into a writable stream
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Title page
doc.fontSize(28).font('Helvetica-Bold').fillColor('#2D3748').text('Citizen Safety Guide', { align: 'center', underline: true });
doc.moveDown(2);

doc.fontSize(14).font('Helvetica').fillColor('#4A5568').text('RoadWatch AI • Empowering Safer Communities', { align: 'center' });

doc.addPage();

// Helper for section headers
function addSectionHeader(title) {
  doc.moveDown(1);
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#2B6CB0').text(title);
  doc.moveDown(0.5);
}

// Section 1: Introduction
addSectionHeader('1. Introduction');
doc.fontSize(12).font('Helvetica').fillColor('#2D3748').text('This guide provides practical steps for citizens to safely identify, photograph, and report road hazards. Following these best‑practice recommendations helps keep our streets safe and ensures swift maintenance responses.', { lineGap: 4, paragraphGap: 8 });

doc.addPage();

// Section 2: Safety Precautions
addSectionHeader('2. Safety Precautions');
const safetyPoints = [
  'Never approach traffic on a moving road. Choose a safe spot away from vehicles.',
  'Use high‑visibility jackets or reflective gear when near traffic.',
  'Avoid standing directly in the path of oncoming traffic; use a barrier or stay on the sidewalk.',
  'If possible, have a companion assist you while photographing.'
];
safetyPoints.forEach((pt, i) => {
  doc.fontSize(12).font('Helvetica').fillColor('#2D3748').text(`${i + 1}. ${pt}`);
});

doc.addPage();

// Section 3: Photographing Hazards
addSectionHeader('3. Photographing Hazards');
const photoTips = [
  'Capture the entire hazard and a wider context (e.g., a few meters before and after).',
  'Include a reference object (e.g., a traffic sign or road marker) for scale.',
  'Take multiple angles: top‑down, side view, and close‑up.',
  'Ensure good lighting; avoid harsh shadows or glare.'
];
photoTips.forEach((pt, i) => {
  doc.fontSize(12).font('Helvetica').fillColor('#2D3748').text(`${i + 1}. ${pt}`);
});

doc.addPage();

// Section 4: Reporting Procedure
addSectionHeader('4. Reporting Procedure');
const reportSteps = [
  'Open the RoadWatch AI mobile app or web portal.',
  'Select “Report Hazard”.',
  'Upload the photographs you captured.',
  'Provide a brief description and location details.',
  'Submit the report; you will receive a confirmation with a tracking ID.'
];
reportSteps.forEach((pt, i) => {
  doc.fontSize(12).font('Helvetica').fillColor('#2D3748').text(`${i + 1}. ${pt}`);
});

doc.addPage();

// Section 5: Frequently Asked Questions
addSectionHeader('5. FAQs');
const faq = [
  { q: 'What if the hazard is on a highway?', a: 'Never stop on a highway. Report the location and wait for a safe assistance point before approaching.' },
  { q: 'Can I report the same hazard multiple times?', a: 'If the hazard persists after the first report, you may update the original report with new photos.' },
  { q: 'How is my privacy protected?', a: 'Only the uploaded images and location are stored for maintenance purposes. Personal data is not shared.' }
];
faq.forEach((item, i) => {
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#2B6CB0').text(`Q${i + 1}: ${item.q}`);
  doc.fontSize(12).font('Helvetica').fillColor('#2D3748').text(`A: ${item.a}`);
  doc.moveDown(0.5);
});

doc.end();

stream.on('finish', () => {
  console.log('PDF generated at', outputPath);
});
