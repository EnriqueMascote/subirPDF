const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/pdf', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Conexión a MongoDB establecida'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

// Definir modelo de datos
const PdfModel = mongoose.model('Documents', {
    filename: String, // Nombre original del archivo PDF
    file: {
        data: Buffer,
        contentType: String
    }
});


// Configurar multer para manejar la carga de archivos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



// Ruta para servir el formulario HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/// Ruta para manejar la carga de archivos
app.post('/upload', upload.single('pdfFile'), async (req, res) => {
    try {
        const pdf = new PdfModel({
            filename: req.file.originalname, // Guardar el nombre original del archivo
            file: {
                data: req.file.buffer,
                contentType: req.file.mimetype
            }
        });
        await pdf.save();
        res.redirect('/documents'); // Redireccionar a la página de lista después de cargar el archivo
    } catch (error) {
        console.error('Error al subir el archivo PDF:', error);
        res.status(500).send('Error al subir el archivo PDF');
    }
});

// Ruta para la página de lista y descarga de documentos
app.get('/documents',
    async (req, res) => {
        try {
            const documents = await PdfModel.find();
            res.render('documents', {documents});
        } catch (error) {
            console.error('Error al obtener los documentos:', error);
            res.status(500).send('Error al obtener los documentos');
        }
    });

// Ruta para descargar un documento específico
app.get('/documents/:id/download', async (req, res) => {
    try {
        const document = await PdfModel.findById(req.params.id);
        if (!document) {
            return res.status(404).send('Documento no encontrado');
        }
        res.set('Content-Disposition', `attachment; filename="${document.filename}"`);
        res.send(document.file.data);
    } catch (error) {
        console.error('Error al descargar el documento:', error);
        res.status(500).send('Error al descargar el documento');
    }
});


// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});
