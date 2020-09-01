(async function () {

    const {Mysql,SyncDb} = require('../index')
 
    // se conecta con el primer servidor
    const OcnnSource = new Mysql({
        host: "remotehost", 
        user: "root", 
        password: "12345",
        database: "my_master_model_db",
        port:3306,
        timeout: 60000
    })

    // se conecta con el segundo servidor
    const OcnnTarget = new Mysql({
        host: "localhost",
        user: "root",
        password: "12345",
        database: "my_client_db",
        port:3306,
        timeout: 60000
       
    })

    //se sincronizan las bases de datos
    const sync = new SyncDb(OcnnTarget, OcnnSource)
    await sync.Compare()
    await sync.Sync()
    await sync.ReleaseConections()

}());