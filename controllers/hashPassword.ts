const bcrypt = require("bcrypt");
const saltRounds = 10;

export default function hashPassword(password: String): Promise<string> {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(saltRounds, function (err: Error, salt: any) {
            bcrypt.hash(password, salt, function (err: Error, hash:string) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(hash);
                return;
            });
        });
    });
};
