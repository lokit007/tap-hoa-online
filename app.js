// Module
let express = require("express");
let mysql = require("mysql");
let i18n = require("i18n");
let bodyParser = require("body-parser");
let session = require('express-session');
let cookieParser = require("cookie-parser");
let jsonfile = require('jsonfile')

let Db = require("./models/database.js");
let configI18n = require("./config/i18n-config.js");
let configData = require("./config/connection-data.js");
let urls = jsonfile.readFileSync('./urls.json');


// Biến môi trường
let app = express();
let post = process.env.PORT || 3000;
let host = "localhost";
let lsAdmin = [];
let pool = mysql.createPool(configData.dataonline);
let obj = {};
let lang = "vi";

// Cấu hình
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('trust proxy', 1) // trust first proxy

i18n.configure(configI18n.config);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'Session module',
  resave: false,
  saveUninitialized: true
}));
app.use(i18n.init);
app.use(function(req, res, next){
    if(req.query.lang) {
        i18n.setLocale(req.query.lang);
        lang = req.query.lang;
    }
    res.locals.clanguage = req.getLocale();
    res.locals.languages = i18n.getLocales();
    obj = jsonfile.readFileSync('./config/languages/'+lang+'.json');
    if(req.path == "/dang-nhap") {
        next();
    } else {
        if(req.session.login === "true") {
            next();
        } else {
            res.render("login", { 'meserr' : "" });
        }
    }
});

// Lắng nghe, khởi tạo server
app.listen(post, function(){
    console.log("Server is runing http://%s:%s", host, post);
});

// Routes
app.get("/", function(req, res, next){
    if(req.session.login === "true") {
        res.redirect("/chi-nhanh");
    } else {
        res.render("login", { 'meserr' : "" });
    }
});

app.post("/dang-nhap", function(req, res, next){
    if(req.session.login === "true" || lsAdmin.indexOf(req.body.username) >= 0)  {
        res.render("404");
    } else {
        let objDb = new Db(pool);
        let sql = `select UserName, UserId, FullName, BranchId, JurisdictionId, jurisdiction.Name as JurisdictionName from admin 
        inner join user on admin.UserId = user.IdUser 
        inner join branch on admin.BranchId = branch.IdBranch 
        inner join jurisdiction on admin.JurisdictionId = jurisdiction.IdJurisdiction 
        where UserName = ? and PassWord = ?;`;
        try {
            objDb.getData(sql, [req.body.username, req.body.pass])
            .then(results => {
                if (results.length>0) {
                    req.session.login = "true";
                    req.session.admin = {
                        user: results[0].UserName,
                        name: results[0].FullName,
                        branch: results[0].BranchId,
                        jurisdiction: results[0].JurisdictionId,
                        jurisdictionname: results[0].JurisdictionName
                    };
                    lsAdmin.push(req.body.username);
                    res.redirect("/");
                } else {
                    req.session.login = "false";
                    res.render("login", {'meserr' : __('login-massage-error')});
                }
            })
            .catch(error => {
                res.render("error", {error: error});
            });
        } catch (error) {
            res.render("error", {error: error});
        }
    }
});

app.get("/dang-xuat", function(req, res, next){
    req.session.login = "false";
    let index = lsAdmin.indexOf(req.session.admin.user);
    if (index != -1) {
        lsAdmin.splice(index,1);
    }
    req.session.admin = null;
    res.render("login", { 'meserr' : "" });
});

app.get("/error", function(req, res){
    res.render("404");
});

app.get("/translate", function(req, res){
    res.send(obj);
});
// Thêm route
var routeBranch = require("./routes/branch.js")(app, pool);