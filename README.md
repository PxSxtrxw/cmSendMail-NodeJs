# cmSendMail (Programa NoseJs para Envío de Correos vía HTTP)

Este programa Python está diseñado para crear un servidor HTTP que escucha solicitudes JSON para enviar correos electrónicos utilizando el modulo nodemailer.

## Requerimientos

Para utilizar este código, es necesario tener instalado:

- Node.js
- npm (Node Package Manager)

## Instalación

Para instalar las dependencias necesarias, ejecute el siguiente comando en la terminal:

```bash
npm install nodemailer
```
```bash
npm install http 
```
```bash
npm install dotenv 
```
```bash
npm install winston
```
## Configuración

Antes de ejecutar el servidor, asegúrese de configurar adecuadamente la direccion de correo electronico donde se realizara la solicitud de autenticacion SMTP, tambien los demas campos necesarios en el archivo  `.env` , en el campo MAIL_USER, MAIL_PASS, etc


#### Componentes Principales:

1. **Configuración de Nodemailer:**
   - Utiliza el modulo nodemailer para configurar el transporte SMTP hacia el servidor de un correo en especifico.

2. **Creación del Servidor HTTP:**
   - Utiliza el módulo `http` de Node.js para crear un servidor HTTP que escucha en un puerto específico (por defecto en el puerto 3060 o según la variable de entorno `PORT` definida).
   - Maneja las solicitudes recibidas mediante el evento `request` del servidor, capturando los datos del cuerpo de la solicitud JSON y procesándolos para enviar correos electrónicos.

3. **Manejo de Solicitudes HTTP:**
   - Cuando se recibe una solicitud HTTP POST con datos JSON, el servidor convierte el cuerpo de la solicitud en una cadena y la parsea a JSON.
   - Configura las opciones del correo (remitente, destinatario, copia carbono, copia oculta, asunto, contenido del correo, cuerpo HMTL, y adjuntos) basadas en los datos JSON recibidos.

4. **Envío de Correo Electrónico:**
   - Utiliza las opciones configuradas para enviar un correo electrónico utilizando el transporte SMTP configurado con email.mime .
   - Registra eventos de éxito o error del envío del correo utilizando los loggers `infoLogger` y `errorLogger` importados desde el archivo `logger.js`.

5. **Respuestas HTTP:**
   - Maneja las respuestas al cliente según el éxito o fracaso del envío del correo:
     - Si hay un error durante el envío del correo, se registra el error detallado y se responde con un código de estado 500 y un mensaje de error JSON.
     - Si el correo se envía correctamente, se registra el éxito junto con la respuesta del servidor de correo y se responde con un código de estado 200 y un mensaje de éxito JSON.

## Uso

### Ejecución del Servidor

Para iniciar el servidor de desarrollo, use el siguiente comando:

```bash
node server
```
El servidor se iniciará en http://localhost:{PORT}



