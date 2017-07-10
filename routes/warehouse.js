// Model
let Warehouse = require("../models/warehouse.js");
let Db = require("../models/database.js");

// Route
let RouteWarehouse = function(app, pool) {
    // Mới khởi tạo
    app.get('/warehouse', function(req, res){
        let objDb = new Db(pool);
        let session = req.session.admin;
        let sql = "select BranchId, NameBranch as BranchName, ProductId, product.Name as ProductName, ";
        sql += "Price, NewNumber, NewPrice, OldNumber, OldPrice, ";
        sql += "CategoryId, `category`.Name as CategoryName from depot ";
        sql += "inner join `product` on ProductId = IdProduct ";
        sql += "inner join `branch` on BranchId = IdBranch ";
        sql += "inner join `category` on CategoryId = IdCategory ";
        sql += "limit 0, 10 ";
        try {
            objDb.getData(sql)
            .then(results => {
                if (results.length>0) {
                    let objList = [];
                    for(let i=0; i<results.length; i++) {
                        objList.push(new Warehouse(results[i].BranchId, results[i].BranchName, results[i].ProductId, results[i].ProductName, results[i].Price, results[i].NewNumber, results[i].NewPrice, results[i].OldNumber, results[i].OldPrice, results[i].CategoryId, results[i].CategoryName));
                    }
                    res.render("home", {screen: 4, session: session, data : objList});
                } else {
                    res.render("home", {screen: 4, session: session, data : {}});
                }
            })
            .catch(error => {
                res.render("home", {screen: 4, session: session, data : {}});
            });
        } catch (errorall) {
            res.redirect("error");
        }
    });
    // Thông tin theo id
    app.get('/warehouse/:id', function(req, res){
        let objDb = new Db(pool);
        let session = req.session.admin;
        let sql = "select UserName, PassWord, IdentityCard, TotalSalary, ";
        sql += "UserId, FullName, `user`.Address, `user`.Phone, `user`.Email, BranchId, NameBranch, "
        sql += "JurisdictionId, `jurisdiction`.Name as NameJurisdiction, `jurisdiction`.Description "
        sql += "from `admin` "
        sql += "inner join `user` on `admin`.UserId = `user`.IdUser "
        sql += "inner join `jurisdiction` on `admin`.JurisdictionId = `jurisdiction`.IdJurisdiction "
        sql += "inner join `branch` on `admin`.BranchId = `branch`.IdBranch ";
        sql += "where UserName = ?";

        try {
            objDb.getData(sql, [req.params.id])
            .then(results => {
                if (results.length>0) {
                    let i = 0;
                    let obj = new Personnel(results[i].UserName, results[i].PassWord, results[i].IdentityCard, results[i].TotalSalary, results[i].UserId, results[i].FullName, results[i].Address, results[i].Phone, results[i].Email, results[i].BranchId, results[i].NameBranch, results[i].JurisdictionId, results[i].NameJurisdiction, results[i].Description)
                    res.send(obj);
                } else {
                    res.send({});
                }
            })
            .catch(error => {
                res.send({});
            });
        } catch (error) {
            res.send({});
        }
    });
    // Search
    app.get('/search/warehouse', function(req, res){
        let objDb = new Db(pool);
        let session = req.session.admin;
        let sql = "select BranchId, NameBranch as BranchName, ProductId, product.Name as ProductName, ";
        sql += "Price, NewNumber, NewPrice, OldNumber, OldPrice, ";
        sql += "CategoryId, `category`.Name as CategoryName from depot ";
        sql += "inner join `product` on ProductId = IdProduct ";
        sql += "inner join `branch` on BranchId = IdBranch ";
        sql += "inner join `category` on CategoryId = IdCategory ";
        sql += "where BranchId = ? and CategoryId = ? ";
        sql += "and product.Name like N? ";
        sql += "limit ?, 10 ";
        let obj = [
            req.query.branch,
            req.query.category,
            "%"+req.query.textsearch+"%",
            parseInt(req.query.index)
        ];

        try {
            objDb.getData(sql, obj)
            .then(results => {
                if (results.length>0) {
                    let objList = [];
                    for(let i=0; i<results.length; i++) {
                        objList.push(new Personnel(results[i].UserName, results[i].PassWord, results[i].IdentityCard, results[i].TotalSalary, results[i].UserId, results[i].FullName, results[i].Address, results[i].Phone, results[i].Email, results[i].BranchId, results[i].NameBranch, results[i].JurisdictionId, results[i].NameJurisdiction, results[i].Description));
                    }
                    res.send(objList);
                } else {
                    res.send([]);
                }
            })
            .catch(error => {
                res.send([]);
            })
        } catch (error) {
            res.send([]);
        } 
    });
    // Update
    app.post('/update/warehouse', function(req, res){
        let objDb = new Db(pool);
        let session = req.session.admin;
        let sql = "";
        let obj = {};
        let id = req.body.id;
        let dNow = new Date();
        if (id == '-1') {
            sql = "INSERT INTO `user` SET ?";
            obj = {
                FullName: req.body.fullname,
                Address: req.body.address,
                Phone: req.body.phone,
                Email: req.body.email
            };
        } else {
            sql = "UPDATE `user` SET FullName = ?, Address = ?, Phone = ?, Email = ? WHERE IdUser = ?";
            obj = [req.body.fullname, req.body.address, req.body.phone, req.body.email, id]
        }

        try {
            pool.getConnection(function(err, connection) {
                connection.beginTransaction(function(errTran){
                    if(errTran) throw errTran;
                    else objDb.executeQuery(sql, obj, connection)
                    .then(results => {
                        if (id == '-1') {
                            sql = "INSERT INTO `admin` SET ?";
                            obj = {
                                UserName: req.body.username,
                                PassWord: "12345678",
                                UserId: results.insertId,
                                BranchId: req.body.branch,
                                JurisdictionId: req.body.jurisdiction,
                                IdentityCard: req.body.identitycard,
                                TotalSalary: req.body.salary
                            };
                        } else {
                            sql = "UPDATE `admin` SET BranchId = ?, JurisdictionId = ?, IdentityCard = ?, TotalSalary = ? WHERE UserName = ?";
                            obj = [req.body.branch, req.body.jurisdiction, req.body.identitycard, req.body.salary, req.body.username]
                        }
                        return objDb.executeQuery(sql, obj, connection);
                    })
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
                    })
                });
            });
        } catch (error) {
            res.send("Erorr");
        }
        pool.getConnection(function(err, connection) {
            connection.beginTransaction(function(errTran){
                if(errTran) throw errTran;
                connection.query(sql, obj, function(error, results, fields){
                    if(error) connection.rollback(function(){
                        res.send("Erorr");
                        throw error;
                    });
                    // Cập nhật tiếp
                    if (id == '-1') {
                        sql = "INSERT INTO `admin` SET ?";
                        obj = {
                            UserName: req.body.username,
                            PassWord: "12345678",
                            UserId: results.insertId,
                            BranchId: req.body.branch,
                            JurisdictionId: req.body.jurisdiction,
                            IdentityCard: req.body.identitycard,
                            TotalSalary: req.body.salary
                        };
                    } else {
                        sql = "UPDATE `admin` SET BranchId = ?, JurisdictionId = ?, IdentityCard = ?, TotalSalary = ? WHERE UserName = ?";
                        obj = [req.body.branch, req.body.jurisdiction, req.body.identitycard, req.body.salary, req.body.username]
                    }
                    connection.query(sql, obj, function(errorLog, resultLogs){
                        if(errorLog) connection.rollback(function(){
                            res.send("Erorr");
                            throw errorLog;
                        });
                        // Commit kết thúc transaction
                        connection.commit(function(errComit){
                            if(errComit) connection.rollback(function(){
                                res.send("Erorr");
                                throw errComit;
                            });
                            res.send("Success");
                        });
                    });
                });
            });
        });
    });
    // Delete
    app.get('/delete/warehouse/:id', function(req, res){
        let objDb = new Db(pool);
        let session = req.session.admin;
        let sql = "DELETE FROM `admin` WHERE UserName=?";

        try {
            pool.getConnection(function(err, connection) {
                connection.beginTransaction(function(errTran){
                    if(errTran) throw errTran;
                    else objDb.executeQuery(sql, [req.params.id], connection)
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
                });
            });
        } catch (error) {
            res.send("Erorr");
        }
    });
    // Load data
    app.get('/loaddata/warehouse', function(req, res) {
        let objDb = new Db(pool);
        let session = req.session.admin;
        let sql = "select * from branch; ";
        sql += " select * from category; ";
        sql += " select * from supplier ";
        
        try {
            objDb.getData(sql)
            .then(results => {
                if (results.length>0) {
                    res.send(results);
                } else {
                    res.send("Error");
                }
            })
            .catch(error => {
                res.send("Error");
            });
        } catch (error) {
            res.send("Error");
        }
    });
    // import data excel
    app.post('/importexcel/warehouse', function(req, res){
        let arrlist = JSON.parse(req.body.listproduct);
        let sql = "";
        let obj = [];
        // sort data
        arrlist.sort(function(a, b){
            if (a["Nhà cung cấp"] > b["Nhà cung cấp"]) return 1;
            else if (a["Chi nhánh"] > b["Chi nhánh"]) return 1;
            else return 0;
        });
        // update data
        let objDb = new Db(pool);
        pool.getConnection(function(err, connection) {
            connection.beginTransaction(function(errTran){
                if(errTran) throw errTran;
                else {
                    try {
                        arrlist.forEach(function( val, ind){
                            newId = val["Nhà cung cấp"] + val["Chi nhánh"];
                            sql = "set @Result = 0; ";
                            sql += "set @Message = ''; ";
                            sql += "call grocerydb.ImportWareHouse(N?, ?, ?, N?, N?, N?, @Result, @Message); ";
                            sql += "select @Result as Result, @Message as Message limit 1; ";
                            obj = [
                                val["Sản phẩm"],
                                val["Số lượng nhập"],
                                val["Giá nhập"],
                                val["Danh mục"],
                                val["Chi nhánh"],
                                val["Nhà cung cấp"]
                            ];
                            objDb.executeQuery(sql, obj, connection).then(results => {
                                console.log(results[3][0].Result);
                                if(results[3][0].Result == -1) {
                                    throw new Error("Lỗi cập nhật " + results[3][0].Message);
                                }
                            });
                        });
                        connection.commit(function(errComit){
                            if(errComit) connection.rollback(() => {
                                res.send("Error");
                            });
                            res.send("Success")
                        });
                    } catch (error) {
                        connection.rollback(() => {
                            res.send("Error");
                        });
                    } finally {
                        connection.release();
                    }
                }
            });
        });
    });
}

module.exports = RouteWarehouse;
