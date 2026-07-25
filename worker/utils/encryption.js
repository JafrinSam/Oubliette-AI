const crypto = require('crypto');

// ALGORITHM: AES-256-GCM (Authenticated Encryption)
// It provides confidentiality AND integrity (proof the file wasn't tampered with).
const ALGORITHM = 'aes-256-gcm';

// Load Key (Must be 32 bytes)
const getKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 32) {
        throw new Error("Security Error: ENCRYPTION_KEY must be exactly 32 characters.");
    }
    return Buffer.from(key);
};

exports.encryptBuffer = (buffer) => {
    // 1. Generate a unique Initialization Vector (IV) for this specific file
    const iv = crypto.randomBytes(16);

    // 2. Create Cipher
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    // 3. Encrypt
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

    // 4. Get Auth Tag (Proof of integrity)
    const authTag = cipher.getAuthTag();

    // 5. Pack it all together: [IV (16 bytes)] + [AuthTag (16 bytes)] + [EncryptedData]
    return Buffer.concat([iv, authTag, encrypted]);
};

exports.decryptBuffer = (buffer) => {
    // 1. Unpack the components
    const iv = buffer.subarray(0, 16);
    const authTag = buffer.subarray(16, 32);
    const encryptedText = buffer.subarray(32);

    // 2. Create Decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);

    // 3. Decrypt
    // If authTag doesn't match, this will THROW an error (meaning file was tampered)
    return Buffer.concat([decipher.update(encryptedText), decipher.final()]);
};
