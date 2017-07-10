// Model
let Branch = require("../models/branch.js");
let Db = require("../models/database.js");

// Định nghĩa route
let RouteBranch = function(app, pool) {
    // Danh sách branch mới khởi tạo
    app.get('/chi-nhanh', function(req, res){
        let objDb = new Db(pool);
        let session = req.session.admin;
        let sql = "select * from `branch` ";
        if(session.jurisdiction > 1){
            sql += "where IdBranch = " + pool.escape(session.branch) + " ";
        }
        sql += "order by IdBranch limit 0, 10";

        try {
            objDb.getData(sql)
            .then(results => {
                if (results.length>0) {
                    let objList = [];
                    if(session.jurisdiction > 1){
                        let i = 0;
                        objList = new Branch(results[i].IdBranch, results[i].NameBranch, results[i].Address, results[i].Phone, results[i].Email, results[i].Fax);
                        res.redirect("/info/branch/"+session.branch);
                        res.end();
                    } else {
                        for(let i=0; i<results.length; i++) {
                            objList.push(new Branch(results[i].IdBranch, results[i].NameBranch, results[i].Address, results[i].Phone, results[i].Email, results[i].Fax));
                        }
                        res.render("template", {screen: 0, session: session, data : objList});
                    }
                } else {
                    res.render("template", {screen: 0, session: session, data : {}});
                }
            })
            .catch(error => {
                 res.render("error");
            });
        } catch (error) {
            res.render("error");
        }
    });
    // Chi tiết một chi nhánh
    app.get('/thong-tin/chi-nhanh/:id', function(req, res) {
        let objDb = new Db(pool);
        let session = req.session.admin;
        let sql = `select * from branch where IdBranch = ?; 
            select UserName, UserId, FullName, Address, Phone, Email, IdentityCard, TotalSalary, Image, JurisdictionId, jurisdiction.Name, Description from admin 
            inner join user on UserId = IdUser 
            inner join jurisdiction on JurisdictionId = IdJurisdiction 
            where BranchId = ?;`
        let obj = [req.params.id, req.params.id];

        try {
            objDb.getData(sql, obj)
            .then(results => {
                if (results.length>0) {
                    res.render("template", {screen: 10, session: session, data : {branch: results[0], personnel: results[1]}});
                } else {
                    res.render("error");
                }
            })
            .catch(error => {
                res.render("error");
            });
        } catch (error) {
            res.render("error");
        }
    });
    // Lấy thông tin một chi nhánh
    app.get('/chi-nhanh/:id', function(req, res){
        let objDb = new Db(pool);
        let session = req.session.admin;
        let sql = "select * from `branch` WHERE IdBranch=?";
        try {
            if(session.jurisdiction == 1) {
                objDb.getData(sql, [req.params.id])
                .then(results => {
                    let obj = new Branch(results[0].IdBranch, results[0].NameBranch, results[0].Address, results[0].Phone, results[0].Email, results[0].Fax);
                    res.send(obj);
                })
                .catch(error => {
                     res.send({});
                });
            } else {
                res.send({});
            }
        } catch (error) {
             res.send({});
        }
    });
    // Lấy danh sách chi nhánh tìm kiếm autocomplex
    app.get('/search/chi-nhanh', function(req, res){
        let objDb = new Db(pool);
        let session = req.session.admin;
        let strsearch = req.query.name;
        let sql = "select * from `branch` ";
        sql += "WHERE NameBranch LIKE N? "
        sql += "OR Address LIKE N? "
        sql += "OR Phone LIKE ? "
        sql += "OR Email LIKE ? "
        sql += "OR Fax LIKE ? "
        sql += "order by IdBranch LIMIT ?, 10";
        let obj = [
            "%" + strsearch + "%",
            "%" + strsearch + "%",
            "%" + strsearch + "%",
            "%" + strsearch + "%",
            "%" + strsearch + "%",
            parseInt(req.query.index)
        ];
        try {
            if(session.jurisdiction == 1) {
                objDb.getData(sql, obj)
                .then(results => {
                    if (results.length>0) {
                        let objList = [];
                        for(let i=0; i<results.length; i++) {
                            objList.push(new Branch(results[i].IdBranch, results[i].NameBranch, results[i].Address, results[i].Phone, results[i].Email, results[i].Fax));
                        }
                        res.send(objList);
                    } else {
                        res.send([]);
                    }
                })
                .catch(error => {
                    res.send([]);
                });
            } else {
                res.send([]);
            }
        } catch (error) {
            res.send([]);
        }
    });
    // Thêm, cập nhật một branch
    app.post('/update/chi-nhanh', function(req, res){
        let objDb = new Db(pool);
        let session = req.session.admin;
        let sql = "";
        let obj = {};
        let id = req.body.id;
        let isquery = false;

        try {
            if (id == '-1') {
                sql += "INSERT INTO `branch` SET ?";
                obj = {
                    NameBranch: req.body.name,
                    Address: req.body.address,
                    Phone: req.body.phone,
                    Email: req.body.email,
                    Fax: req.body.fax
                }
            } else {
                sql += "UPDATE `branch` SET NameBranch = ?, Address = ?, Phone = ?, Email = ?, Fax = ? WHERE IdBranch = ?";
                obj = [req.body.name, req.body.address, req.body.phone, req.body.email, req.body.fax, id]
            }

            if(session.jurisdiction == 1) {
                isquery = true;
            } else if(session.jurisdiction < 3 && id == session.jurisdiction) {
                isquery = true;
            }
            
            if(isquery) {
                pool.getConnection(function(err, connection) {
                    connection.beginTransaction(function(errTran){
                        if(errTran) throw errTran;
                        else {
                            objDb.executeQuery(sql, obj, connection)
                            .then(results => {
                                connection.commit(function(errComit){
                                    if(errComit) connection.rollback(function(){
                                        res.send("Erorr");
                                        throw errComit;
                                    });
                                    res.send("Success");
                                });
                            })
                            .catch(error => {
                                connection.rollback(function(){
                                    res.send("Erorr");
                                });
                            });
                        }
                    });
                });
            } else {
                res.send("Erorr");
            }
        } catch (error) {
            res.send("Erorr");
        }
    });
    // Xóa branch
    app.get('/delete/chi-nhanh/:id', function(req, res){
        let objDb = new Db(pool);
        let session = req.session.admin;
        let sql = "DELETE from `branch` WHERE IdBranch=?";
        
        try {
            if(session.jurisdiction == 1) {
                pool.getConnection(function(err, connection) {
                    connection.beginTransaction(function(errTran){
                        if(errTran) throw errTran;
                        else {
                            objDb.executeQuery(sql, [req.params.id], connection)
                            .then(results => {
                                connection.commit(function(errComit){
                                    if(errComit) connection.rollback(function(){
                                        res.send("Erorr");
                                        throw errComit;
                                    });
                                    res.send("Success");
                                });
                            })
                            .catch(error => {
                                connection.rollback(function(){
                                    res.send("Erorr");
                                    throw error;
                                });
                            });
                        }
                    });
                });
            } else {
                res.send("Erorr");
            }
        } catch (error) {
            res.send("Erorr");
        }
    });
}

module.exports = RouteBranch;