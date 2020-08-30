


(async function () {

    const Mysql = require('../src/Mysql')
    const SyncDb = require('../src/SyncDb')

    // se conecta con el primer servidor
    const Ocnn1 = new Mysql({
        host: "myhostip", // ip address of server running mysql
        user: "root", // user name to your mysql database
        password: "*****", // corresponding password
        database: "mydb", // use the specified database
        timeout: 60000
    })

    // se conecta con el segundo servidor
    const Ocnn2 = new Mysql({
        host: "myhostip", // ip address of server running mysql
        user: "root", // user name to your mysql database
        password: "*****", // corresponding password
        database: "mydb", // use the specified database
        timeout: 60000
    })

    //se establece la conexion
    await Ocnn1.connect()
    await Ocnn2.connect()

    const sync = new SyncDb(Ocnn1, Ocnn2)
    await sync.Compare()
    await sync.Sync()

    //se cierra la conexion
    await Ocnn2.release()
    await Ocnn1.release()

}());