const mysql= require('mysql');

module.exports = class Mysql {

    constructor(dbConfig) {
        
        this.connection = mysql.createConnection(dbConfig);
        this.cDatabase  = dbConfig.database
        this.releasecnn = false
        this.isConnected = false

    }

    connect(){
        return new Promise((resolve, reject) => {
            this.connection.connect((err) => {
                if (err){
                    this.isConnected = false
                    return reject(err);
                }else{
                    this.isConnected = true
                    resolve(this.connection.threadId);
                }
            });
        });
    }

    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows);
            });
        });
    }

    release() {
        if (!this.releasecnn) {
            this.releasecnn = true
            this.isConnected = false
            this.connection.end()
        }
    }

    beginTransaction() {
        return new Promise((resolve, reject) => {
            this.connection.beginTransaction(err => {
                if (err) {
                    return reject(err);
                } else {
                    resolve();
                }

            });
        });
    }

    commit() {
        return new Promise((resolve, reject) => {

            this.connection.commit(err => {
                if (err) {
                    return reject(err);
                } else {
                    resolve();
                }

            });
        });
    }

    rollback() {
        return new Promise((resolve) => {

            this.connection.rollback(() => { resolve() });

        });
    }

    escape(str) { return this.connection.escape(str) }
}
