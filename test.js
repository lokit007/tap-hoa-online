var express = require("express");
var app = express();
var cookieParser = require("cookie-parser");
// Cấu hình
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
// i18n : Đa ngôn ngữ
var i18n = require("i18n");
i18n.configure({
    locales:['vi', 'en'],
    register: global,
    fallbacks:{'vi': 'en'},
    cookie: 'language',
    defaultLocale: 'en',
    queryParameter: 'lang',
    autoReload: true,
    updateFiles: true,
    syncFiles: true,
    directory: __dirname + '/languages',
    api: {
      '__': '__',
      '__n': '__n'
    },
    preserveLegacyCase: true
});
app.use(i18n.init);
app.use(function(req, res, next){
    if(req.query.lang) i18n.setLocale(req.query.lang);
    res.locals.clanguage = req.getLocale();
    res.locals.languages = i18n.getLocales();
    next();
});
// Lắng nghe
app.listen(3000, function(){
    console.log("Website demo : http://localhost:3000");
});
// Route
app.get("/", function(req, res, next){
    console.log(__('404-title'));
    res.render('404');
});
app.get("/emodel", function(req, res, next){
    res.render('eModel');
});