module.exports = {
    httpUser: "yourUser",
    httpPass: "yourPass",
    useSsl: true,
    port: 3000,
    sslPrivateKeyPath: "/etc/letsencrypt/live/yourDomain/privkey.pem",
    sslCertificate: "/etc/letsencrypt/live/yourDomain/cert.pem",
    sslCa: "/etc/letsencrypt/live/yourDomain/chain.pem",
    gcmApiKey: "yourKey"
};