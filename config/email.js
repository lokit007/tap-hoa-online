/**
 * Config Email
 * - NodeMailer : https://nodemailer.com/about/
 * - W3School : https://www.w3schools.com/nodejs/nodejs_email.asp
 */
module.exports.email = {
    service: 'gmail',
    auth: {
        user: 'doihamhieu@gmail.com',
        pass: 'nhanviet1'
    }
}

// Hoặc dùng cái này
// module.exports.email = {
//     host: 'smtp.gmail.com',
//     port: 465,
//     secure: true, // secure:true for port 465, secure:false for port 587
//     auth: {
//         user: 'doihamhieu@gmail.com',
//         pass: 'nhanviet1'
//     }
// }