// server/utils/cryptoUtils.js
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');

const KEYS_DIR = path.resolve(process.cwd(), 'config/keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');

// Ensure keys exist on startup
fs.ensureDirSync(KEYS_DIR);
if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.log("🔐 Generating Server RSA Keypair for Model Signing...");
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    // ✅ FIX (M3): Write private key with strict permissions (owner read-only)
    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o400 });
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
    console.log("🔐 RSA keypair generated and stored with restricted permissions.");
}

// ✅ FIX (L5): Cache the public key at module load time — avoid repeated disk I/O on every export
const _cachedPublicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');

/**
 * Signs data using the private key.
 * @param {Buffer|string} data
 * @returns {string} Hex signature
 */
const signData = (data) => {
    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'hex');
};

/**
 * Returns the cached public key content.
 * @returns {string}
 */
const getPublicKey = () => _cachedPublicKey;

module.exports = { signData, getPublicKey };
