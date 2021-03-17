const fs = require('fs');

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.log(err);
        }
    });
}

exports.deleteFile = deleteFile;