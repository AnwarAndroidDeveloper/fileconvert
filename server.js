
    const express = require('express');
    const multer = require('multer');
    const fs = require('fs');
    const XLSX = require('xlsx');

    const app = express();
    const upload = multer({ dest: 'uploads/' });


    

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });

    app.get('/merge', (req, res) => {
        res.sendFile(__dirname + '/merge.html');
    });

    app.post('/convert', upload.single('file'), (req, res) => {
        const file = req.file;
        if (!file || file.mimetype !== 'text/plain') {
            return res.status(400).send('Please upload a .txt file');
        }

        fs.readFile(file.path, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                return res.status(500).send('Error reading file');
            }

            try {
                const jsonData = JSON.parse(data);
                const workbook = XLSX.utils.book_new();
                const sheet = XLSX.utils.json_to_sheet(jsonData);
                XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');

                const fileName = file.originalname.replace(/\.[^/.]+$/, ''); // Get the original file name without extension
                const outputPath = `uploads/${fileName}.xlsx`; // Set the output file path with the original file name and .xlsx extension

                XLSX.writeFile(workbook, outputPath);


                res.download(outputPath, `${fileName}.xlsx`, (err) => {
                    if (err) {
                        console.error('Error downloading file:', err);
                        res.status(500).send('Error downloading file');
                    } else {
                        // Clean up temporary files
                        fs.unlinkSync(file.path);
                        fs.unlinkSync(outputPath);
                    }
                });
            } catch (error) {
                console.error('Error parsing JSON:', error);
                res.status(400).send('Invalid JSON format');
            }
        });
    });

    

    app.get('/merge', (req, res) => {
        res.sendFile(__dirname + '/merge.html');
    });
    
    app.post('/merge', upload.array('files'), (req, res) => {
        const files = req.files;
        if (!files || files.length < 2) {
            return res.status(400).send('Please select at least two .txt files');
        }
    
        let mergedData = [];
        files.forEach((file, index) => {
            const data = fs.readFileSync(file.path, 'utf8');
            try {
                const jsonData = JSON.parse(data);
                mergedData = mergedData.concat(jsonData);
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        });
    
        const outputPath = 'uploads/merged.txt';
        fs.writeFileSync(outputPath, JSON.stringify(mergedData, null, 2));
    
        res.download(outputPath, 'merged.txt', (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).send('Error downloading file');
            } else {
                // Clean up temporary files
                files.forEach(file => fs.unlinkSync(file.path));
                fs.unlinkSync(outputPath);
            }
        });
    });
    
    
 
    app.listen(3000, () => {
        console.log('Server running on http://localhost:3000');
    });

