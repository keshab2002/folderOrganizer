// const express = require('express');
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');
// const cors = require('cors');
// const archiver = require('archiver');


// const app = express();
// const port = 3000;

// app.use(cors());

// const uploadDir = 'uploads';
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir);
// }

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, uploadDir);
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + "-" + file.originalname);
//     }
// });

// const upload = multer({ storage: storage });

// app.post('/upload', upload.array("files"), (req, res) => {
//     try {
//         organizeFiles();
//         res.json({ message: "Files uploaded successfully", files: req.files });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// const organizeFiles = () => {
//     fs.readdirSync(uploadDir).forEach((file) => {
//         const ext = path.extname(file).slice(1);
//         if (!ext) return;

//         const extDir = path.join(uploadDir, ext);
//         if (!fs.existsSync(extDir)) {
//             fs.mkdirSync(extDir);
//         }

//         fs.renameSync(path.join(uploadDir, file), path.join(extDir, file));
//     });
// };

// app.use("/downloads", express.static(uploadDir));

// app.get("/", (req, res) => {
//     res.sendFile('index.html', { root: __dirname });
// });

// app.get("/files", (req, res) => {
//     const getFilesRecursively = (dir) => {
//         let results = [];
//         fs.readdirSync(dir).forEach((file) => {
//             const filePath = path.join(dir, file);
//             if (fs.statSync(filePath).isDirectory()) {
//                 results = results.concat(getFilesRecursively(filePath));
//             } else {
//                 results.push(path.relative(uploadDir, filePath));
//             }
//         });
//         return results;
//     };

//     res.json(getFilesRecursively(uploadDir));
// });

// app.get('/downloadDir', (req, res) => {
//     const folderName = 'uploads';
//     const zipFileName = `uploads_${Date.now()}.zip`;
//     const outputFilePath = path.join(__dirname, zipFileName);

//     const output = fs.createWriteStream(outputFilePath);
//     const archive = archiver('zip', { zlib: { level: 9 } });

//     archive.pipe(output);
//     archive.directory(folderName, false);
//     archive.finalize();

//     output.on('close', () => {
//         res.download(outputFilePath, zipFileName, (err) => {
//             if (err) {
//                 console.error('Error sending file:', err);
//                 if (!res.headersSent) {
//                     res.status(500).send("Error downloading the folder");
//                 }
//             }
//             fs.unlink(outputFilePath, (unlinkErr) => {
//                 if (unlinkErr) console.error("Error deleting temp ZIP file:", unlinkErr);
//             });
//         });
//     });

//     archive.on('error', (err) => {
//         console.error('Error creating archive:', err);
//         if (!res.headersSent) {
//             res.status(500).send("Error creating ZIP file");
//         }
//     });

//     req.on('aborted', () => {
//         console.log('Client aborted request, cleaning up...');
//         archive.abort();
//         fs.unlink(outputFilePath, (unlinkErr) => {
//             if (unlinkErr) console.error("Error deleting temp ZIP file:", unlinkErr);
//         });
//     });
// });


// app.listen(port, () => {
//     console.log(`Server is running on port: ${port}`);
// });














const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const archiver = require('archiver');

const app = express();
const port = 3000;

app.use(cors());

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Global counter for unique filenames
let fileCounter = 1;

// Storage configuration without using Date
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${fileCounter++}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.array("files"), (req, res) => {
    try {
        organizeFiles();
        res.json({ message: "Files uploaded successfully", files: req.files });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Organizing files into folders based on extensions
const organizeFiles = () => {
    fs.readdirSync(uploadDir).forEach((file) => {
        const ext = path.extname(file).slice(1);
        if (!ext) return;

        const extDir = path.join(uploadDir, ext);
        if (!fs.existsSync(extDir)) {
            fs.mkdirSync(extDir);
        }

        fs.renameSync(path.join(uploadDir, file), path.join(extDir, file));
    });
};

// Serving uploaded files
app.use("/downloads", express.static(uploadDir));

app.get("/", (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

app.get("/files", (req, res) => {
    const getFilesRecursively = (dir) => {
        let results = [];
        fs.readdirSync(dir).forEach((file) => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                results = results.concat(getFilesRecursively(filePath));
            } else {
                results.push(path.relative(uploadDir, filePath));
            }
        });
        return results;
    };

    res.json(getFilesRecursively(uploadDir));
});

// Route to generate and download a ZIP file
app.get('/downloadDir', (req, res) => {
    const zipFileName = `uploads.zip`;
    const outputFilePath = path.join(__dirname, zipFileName);

    const output = fs.createWriteStream(outputFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(uploadDir, false);
    archive.finalize();

    output.on('close', () => {
        res.download(outputFilePath, zipFileName, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                if (!res.headersSent) {
                    res.status(500).send("Error downloading the folder");
                }
            }
            fs.unlink(outputFilePath, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting temp ZIP file:", unlinkErr);
            });
        });
    });

    archive.on('error', (err) => {
        console.error('Error creating archive:', err);
        if (!res.headersSent) {
            res.status(500).send("Error creating ZIP file");
        }
    });

    req.on('aborted', () => {
        console.log('Client aborted request, cleaning up...');
        archive.abort();
        fs.unlink(outputFilePath, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting temp ZIP file:", unlinkErr);
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
