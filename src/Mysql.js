const mysql = require('mysql');

module.exports = class Mysql {

    constructor(dbConfig) {
        
        this.CnnParams=dbConfig
        this.cDatabase = dbConfig.database
        this.host = dbConfig.host
        this.releasecnn = false
        this.isConnected = false

        //se crea la instancia de la conexion
        this.InicializeConection()

    }

    InicializeConection(){
        this.connection = mysql.createConnection(this.CnnParams);
        this.connection.on('error', this.onError)
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.connection.connect((err) => {
                if (err) {
                    this.isConnected = false
                    return reject(err);
                } else {
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

    async showSchemas() {

        if (this.isConnected) {

            const Database = await this.query("SHOW DATABASES")
            return Database.reduce((P, C) => {
                P.push(C.Database)
                return P
            }, [])

        } else {
            return []
        }

    }

    onError(err) {
        if (err.code === `PROTOCOL_CONNECTION_LOST`) {
           this.InicializeConection()
        }
    }
}
