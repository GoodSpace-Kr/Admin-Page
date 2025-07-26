const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        '/api',                   // 클라이언트에서 호출하는 API prefix 경로
        createProxyMiddleware({
            target: 'http://localhost:8080',  // 백엔드 서버 주소
            changeOrigin: true,
        })
    );
};
