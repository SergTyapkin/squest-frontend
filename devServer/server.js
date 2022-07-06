fs = require("fs");
http = require('http');
https = require('https');
express = require('express');
path = require('path');
proxy = require('express-http-proxy');
app = express();

ROOT_DIR = path.resolve(__dirname, '..');

PRIVATE_KEY_PATH = 'devServer/ssl/server.key';
PUBLIC_KEY_PATH = 'devServer/ssl/server.crt';

DEFAULT_STATIC_PATH = 'build';
SITE_CONFIG = {
    prefix: '/squest',
    apiPath: '/api',
    apiRedirectUrl: 'http://127.0.0.1:9000/api',

    staticDir: 'build',
    indexHtml: 'index.html',
    SPA: true,
}


// api requests
app.use(`${SITE_CONFIG.prefix}${SITE_CONFIG.apiPath}`, proxy(SITE_CONFIG.apiRedirectUrl));

// path files requests
app.use(`${SITE_CONFIG.prefix}`, express.static(SITE_CONFIG.staticDir));

// another path requests -> resolve to index.html
app.get(`${SITE_CONFIG.prefix}/:path`, (req, res) => {
    if (SITE_CONFIG.SPA) {
        console.log(req.path, "send index.html");
        res.sendFile(path.resolve(ROOT_DIR, SITE_CONFIG.staticDir, SITE_CONFIG.indexHtml || 'index.html'));
        return;
    }
    res.sendFile(path.resolve(ROOT_DIR, SITE_CONFIG.staticDir, req.params.path));
});

app.use(`/`, express.static(DEFAULT_STATIC_PATH));

//The 404 route with global index.html
app.get('*', function(req, res){
    res.status(404).sendFile(path.resolve(ROOT_DIR, DEFAULT_STATIC_PATH, 'index.html'));
});


const HTTP_PORT = process.env.PORT || 80;
const HTTPS_PORT = process.env.PORT || 443;

const privateKey = fs.readFileSync(PRIVATE_KEY_PATH);
const certificate = fs.readFileSync(PUBLIC_KEY_PATH);

const httpServer = http.createServer(app);
const httpsServer = https.createServer({
    key: privateKey,
    cert: certificate
}, app);

httpServer.listen(HTTP_PORT, 'localhost', () => {
    console.log(`http server started at :${HTTP_PORT}`);
});
httpsServer.listen(HTTPS_PORT, () => {
    console.log(`https server started at :${HTTPS_PORT}`);
});
