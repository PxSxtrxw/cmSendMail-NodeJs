const http = require('http');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { infoLogger, errorLogger } = require('./logger');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde el archivo .env
dotenv.config();

console.log('Correo Utilizado:', process.env.MAIL_USER);

// Configurar transporte de correo con los detalles proporcionados
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    logger: true,
    debug: true,
    connectionTimeout: 30000, // tiempo de espera para la conexión (30 segundos)
    greetingTimeout: 30000, // tiempo de espera para el saludo (30 segundos)
    socketTimeout: 30000 // tiempo de espera para el socket (30 segundos)
});

// Función para enviar el correo
const sendMail = (jsonData, res) => {
    const mailOptions = {
        from: process.env.MAIL_USER,
        to: jsonData.to.join(', '),
        subject: jsonData.subject,
        text: jsonData.text,
        attachments: []
    };

    // Agregar contenido HTML si está presente en el JSON
    if (jsonData.html) {
        mailOptions.html = jsonData.html;
    }

    if (jsonData.cc && jsonData.cc.length > 0 && jsonData.cc[0] !== '') {
        mailOptions.cc = jsonData.cc.join(', ');
    }

    if (jsonData.bcc && jsonData.bcc.length > 0 && jsonData.bcc[0] !== '') {
        mailOptions.bcc = jsonData.bcc.join(', ');
    }

    // Agregar archivos adjuntos si se proporcionan rutas de archivos
    if (jsonData.attachments && jsonData.attachments.length > 0) {
        jsonData.attachments.forEach(filePath => {
            // Verificar si el archivo existe
            if (fs.existsSync(filePath)) {
                mailOptions.attachments.push({
                    filename: path.basename(filePath),
                    path: filePath
                });
            } else {
                console.error(`Archivo no encontrado: ${filePath}`);
                errorLogger.error(`Archivo no encontrado: ${filePath}`);
            }
        });
    }

    console.log(`Enviando correo con opciones: ${JSON.stringify(mailOptions)}`);
    infoLogger.info(`Enviando correo con opciones: ${JSON.stringify(mailOptions)}`);

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            const errorMessage = `Error al enviar el correo a ${mailOptions.to}: ${error.message}`;
            console.error(errorMessage);
            errorLogger.error(errorMessage);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error al enviar el correo', details: error.message }));
        } else {
            const successMessage = `Correo enviado correctamente a ${mailOptions.to}. Respuesta: ${info.response}`;
            console.log(successMessage);
            infoLogger.info(successMessage);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Correo enviado correctamente', response: info.response }));
        }
    });
};

// Crear servidor HTTP
const server = http.createServer((req, res) => {
    console.log(`Solicitud recibida: ${req.method} ${req.url}`);
    infoLogger.info(`Solicitud recibida: ${req.method} ${req.url}`);

    if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
            console.log(`Recibiendo datos: ${chunk.toString()}`);
            infoLogger.info(`Recibiendo datos: ${chunk.toString()}`);
        });

        req.on('end', () => {
            console.log('Datos completos recibidos');
            infoLogger.info('Datos completos recibidos');

            try {
                const jsonData = JSON.parse(body);
                console.log('Datos JSON parseados:', JSON.stringify(jsonData));
                infoLogger.info(`Datos JSON parseados: ${JSON.stringify(jsonData)}`);

                // Validación de campos requeridos
                if (!jsonData.to || !jsonData.subject || (!jsonData.text && !jsonData.html)) {
                    const missingFieldsMessage = 'Faltan campos requeridos en el JSON';
                    console.error(missingFieldsMessage);
                    errorLogger.error(missingFieldsMessage);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: missingFieldsMessage }));
                    return;
                }

                // Validar formato de correo electrónico para listas y eliminar entradas vacías
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const allEmailsValid = jsonData.to.every(email => emailRegex.test(email)) &&
                    (!jsonData.cc || jsonData.cc.filter(email => email !== '').every(email => emailRegex.test(email))) &&
                    (!jsonData.bcc || jsonData.bcc.filter(email => email !== '').every(email => emailRegex.test(email)));

                if (!allEmailsValid) {
                    const invalidEmailMessage = 'Formato de correo electrónico inválido';
                    console.error(invalidEmailMessage);
                    errorLogger.error(invalidEmailMessage);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: invalidEmailMessage }));
                    return;
                }

                sendMail(jsonData, res);

            } catch (error) {
                const parseErrorMessage = `Error al procesar la solicitud JSON: ${error.message}`;
                console.error(parseErrorMessage);
                errorLogger.error(parseErrorMessage);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: parseErrorMessage }));
            }
        });

        req.on('error', (err) => {
            const requestErrorMessage = `Error en la solicitud: ${err.message}`;
            console.error(requestErrorMessage);
            errorLogger.error(requestErrorMessage);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error en la solicitud', details: err.message }));
        });
    } else {
        const methodNotAllowedMessage = 'Método no permitido';
        console.error(methodNotAllowedMessage);
        errorLogger.error(methodNotAllowedMessage);
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: methodNotAllowedMessage }));
    }
});

server.on('error', (err) => {
    const serverErrorMessage = `Error en el servidor: ${err.message}`;
    console.error(serverErrorMessage);
    errorLogger.error(serverErrorMessage);
});

const PORT = process.env.PORT ;
server.listen(PORT, () => {
    const serverStartMessage = `Servidor HTTP escuchando en el puerto ${PORT}`;
    console.log(serverStartMessage);
    infoLogger.info(serverStartMessage);
});
