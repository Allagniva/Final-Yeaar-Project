const fs = require('fs');

exports.deleteFile = (filepath) => {
    fs.unlink(filepath, (err) => {
        if(err){
            console.log(err);
        }
    })
}