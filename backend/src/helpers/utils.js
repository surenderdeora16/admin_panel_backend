const CryptoJS = require("crypto-js");

exports.encrypt = (plainText, secret) => {
    try {
        const keyHash = CryptoJS.MD5(secret);

        // Encrypt the data
        const encrypted = CryptoJS.AES.encrypt(plainText, keyHash, {
            iv: CryptoJS.enc.Hex.parse('000102030405060708090a0b0c0d0e0f'),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        // Convert encrypted data to hex format
        return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
    } catch (error) {
        return null;
    }
};

exports.decrypt = (encryptedText, workingKey) => {
    try {
        // Convert the key to a binary format (md5 hash)
        const keyHash = CryptoJS.MD5(workingKey);

        // Convert encrypted data to WordArray format
        const encryptedWordArray = CryptoJS.enc.Hex.parse(encryptedText);

        // Decrypt the data
        const decrypted = CryptoJS.AES.decrypt({ ciphertext: encryptedWordArray }, keyHash, {
            iv: CryptoJS.enc.Hex.parse('000102030405060708090a0b0c0d0e0f'),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        // Convert decrypted data to utf8 format
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        return null;
    }

};

exports.queryStringToObject = queryString => {
    let pairs = queryString.split('&');
    let result = {};
    pairs.forEach(pair => {
        let [key, value] = pair.split('=');
        result[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
    return result;
}