const bcrypt = require("bcrypt");
const saltRounds = 10;

export default function passwordVerify(password: string, hash: String): Promise<Boolean> {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, function (err: Error, result: Boolean) {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
            return;
        });
    });
};