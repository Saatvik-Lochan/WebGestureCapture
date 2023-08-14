# WebGestureCapture
The frontend for capturing hand gesture data through a browser on a VR Headset.
See [GestureLogger](https://github.com/Saatvik-Lochan/GestureLogger) for more 
details.

This project is to be used in conjunction with:
 - Backend: [WebGestureCaptureBackend](https://github.com/Saatvik-Lochan/WebGestureCaptureBackend)
 - Application: [GestureLogger](https://github.com/Saatvik-Lochan/GestureLogger)

## Usage
You can use this service at https://gesturelogger.com to trial the software or
for use in the collection of small datasets. Though I recommend hosting 
this and the backend yourself for any more serious project.

## Installation
### Vite
This frontend uses [vite](https://vitejs.dev/) as a build tool. See
https://vitejs.dev/guide/build.html for building and deployment options.

For most it will be enough to run

`npm install`

and then build the project with 

`npx vite build`

### Hosting

If you are using a VPS with Nginx, you can use a server block such as this:
```nginx
server {
    listen 443 ssl;
    server_name <your server_name>;
    ssl_certificate <ssl certificate>;
    ssl_certificate_key <ssl key>;

    # example: /var/www/WebGestureCapture/dist
    root <your repo location>/dist;  

    index index.html;

    location / {}
    location /demonstration/ {}
}
```

You could also use a hosting provider - just ensure that both the `/` and the `/demonstration/` route have been enabled.

### HTTPS
HTTPS is required to run [WebXR](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API) 
content. You can easily get your own certificate with [LetsEncrypt](https://letsencrypt.org/).

## Expansion
You're encouraged to fork this project to add features relevant to your 
project. The project has [JSDoc](https://jsdoc.app/) annotations that your
IDE should detect for ease of development.

Take a look at `/src/main.ts` and `/src/demonstration/main.ts` for a
basic template on how to use the other VR functionality the project provides.
