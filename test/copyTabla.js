(async function () {

    const {Mysql,SyncDb} = require('../index')
 
    // se conecta con el primer servidor
    const oCnn = new Mysql({
        host: "remoteserver", 
        user: "root", 
        password: "****",
        port:3306,
        timeout: 60000
    })

    //se copian tablas dentro de la misma conexion
    const sync = new SyncDb(oCnn, oCnn)
    await sync.CopyTable('mytbl1','mydborigen','mydbdestino',lCopiarDatos)//se copia con datos
    await sync.CopyTable('mytbl2','mydborigen','mydbdestino')//se copia sin datos
    await sync.ReleaseConections()

    //se copian tablas en conexiones diferentes
    const oCnnOrigen = new Mysql({
        host: "remoteserver", 
        user: "root", 
        password: "****",
        port:3306,
        timeout: 60000
    })

    const oCnnDestino = new Mysql({
        host: "localhost", 
        user: "root", 
        password: "****",
        port:3306,
        timeout: 60000
    })
   
    const sync2 = new SyncDb(oCnnDestino,oCnnOrigen)
    const lCopiarDatos=true
    await sync2.CopyTable('mytbl1','mydborigen','mydbdestino',lCopiarDatos)//se copia con datos
    await sync2.CopyTable('mytbl2','mydborigen','mydbdestino')//se copia sin datos
    await sync2.ReleaseConections()

}());