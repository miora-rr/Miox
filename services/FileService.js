const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs');

class FileService {
    constructor (){}

    async downloadImageLocally(attachment, response) {
        const parsedUrl = new URL(attachment.url);
        const filename = path.basename(parsedUrl.pathname);

        return new Promise ((resolve, reject) => {
            const filePath = path.join(__dirname, 'downloads', filename);
            const writer = fs.createWriteStream(filePath);
    
            response.data.pipe(writer);
            
            writer.on('finish', () => {
                resolve(filePath);
            });
            writer.on('error', (error) => {
                console.error('Failed to write file:', error);
                reject(error);
            });
        });
    }

    toReadStream(filePath) {
        return fs.createReadStream(filePath);
    }

    cleanUpDownloadsFolder() {
        const downloadDir = path.join(__dirname, 'downloads');
        fs.rmSync(downloadDir, { recursive: true, force: true });
    }
    
    async createPDFLocaly(imagePaths) {
        const doc = new PDFDocument();
        const pdfPath = path.join(__dirname, 'downloads', 'tmp_receipts.pdf');
        const pdfStream = fs.createWriteStream(pdfPath);
    
        return new Promise((resolve, reject) => {
            doc.pipe(pdfStream);
    
            imagePaths.forEach((imagePath, index) => {
                if (index !== 0) doc.addPage();
                doc.image(imagePath, {
                    fit: [500, 700],
                    align: 'center',
                    valign: 'center',
                });
            });
    
            doc.end();
    
            pdfStream.on('finish', () => {
                console.log(`PDF created at ${pdfPath}`);
                const readSream = fs.createReadStream(pdfPath);
                resolve(readSream);
            });
    
            pdfStream.on('error', (err) => {
                console.error('Error creating PDF:', err);
                reject(err);
            });
        });
    }

    async createLocalDownloadFolder() {
        const dirPath = path.join(__dirname, 'downloads');
    
        if (!fs.existsSync(dirPath)) {
            fs.mkdir(dirPath, { recursive: true }, (error) => {
                if (error) console.error('Failed to create directory:', error);
                else console.log('A directory called downloads was created successfully');
            });
        }
    }

}

module.exports = FileService;