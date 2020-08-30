# mysqlSync
### **mysqlSync** es una herramienta para sincronizar la esturctura de una base de datos apartir de otra añadiendo o eliminando tablas,campos,funciones,procedimientos dependendiendo las diferencias que se encuentren entre una y otra.


# Como Se Instala
```javascript 
//con npm
npm i @gamalielmh921230/mysqlsync 
//con yarn
yarn add @gamalielmh921230/mysqlsync
````
# Clases Que La Componen
## **Mysql**
#### es un envoltorio para el modulo de mysql de node que añade  soporta para promesas
### **Propiedades**
- **isConnected ->** *Indica si esta conectado con la base de datos*
- **cDatabase ->** *Nombre de la base de datos*
### **Metodos**
- **connect():** *establece la conexion con la base de datos*
- **query(sql,args):** *ejecuta las sentencias de sql*
- **release():** *Cierra la conexion con la base de datos*
- **beginTransaction():** *Comienza una transaccion*
- **commit():** *Completa la transaccion*
- **rollback():** *Concela la transaccion*
- **escape(str):** *Escapa los caracteres de un **String***
### **Como se Usa**

```javascript 
const {Mysql} = require('@gamalielmh921230/mysqlsync')

const Cnn = new Mysql({
    host: "localhost", 
    user: "root", 
    password: "12345",
    database: "mydb",
    timeout: 60000
})

await Cnn.connect()
const [result]= await Cnn.query("SELECT CURDATE() AS FECHA")
console.log(result.FECHA)//--> imprime la fecha del servidor
````

## **SyncDb**
#### es una clase que se encarga de compara y sincronizar la estructura de dos bases de datos
### **Propiedades**
- **TablesDiff ->** *Objeto Con las diferencias encontradas en las **tablas** al ejecutar metodo **Compare***
- **ViewsDiff ->** *Objeto Con las diferencias encontradas en las **vistas** al ejecutar metodo **Compare***
- **ProceduresDiff ->** *Objeto Con las diferencias encontradas en los **procedimientos** al ejecutar metodo **Compare***
- **FunctionsDiff ->** *Objeto Con las diferencias encontradas en las **funciones** al ejecutar metodo **Compare***
### **Metodos**
- **Compare():** *Compra la estructura de las bases de datos y obtiene las diferencias*
- **Sync():** *Sincroniza la estructura de las bases de datos aplicando las diferencias encontradas(si no se llamo al metodo Compare antes lo llama internamente).*
- **ReleaseConections():** *Cierra la conexion con la base de datos*

```javascript 
const {Mysql,SyncDb} = require('@gamalielmh921230/mysqlsync')

//se crea la conexion con la base de datos que recibira los cambios
const CnnClient = new Mysql({
    host: "localhost", 
    user: "root", 
    password: "12345",
    database: "mydb_client",
    timeout: 60000
})

//se conecta con la base de datos modelo
const CnnMaestro = new Mysql({
    host: "localhost", 
    user: "root", 
    password: "12345",
    database: "mydb_model",
    timeout: 60000
})

//se sincronizan las bases de datos
const sync = new SyncDb(CnnClient,CnnMaestro)
await sync.Sync()
await sync.ReleaseConections()

/*
    tabla en base de datos modelo
    --------------------------
    |id | campo1 | campoNuevo|
    --------------------------
    --------------------------

    tabla en base de datos cliente
    -------------
    |id | campo1|
    -------------
    | 1 | hola  |
    -------------

    resultado despues del proceso 
    en base de datos del cliente
    --------------------------
    |id | campo1 | campoNuevo|
    -------------------------- 
    | 1 | hola  |            |
    --------------------------
*/
````
## **ConstansSync**
### **Propiedades**
- **EnumActions ->** *objeto con las acciones posibles en la sincronizacion*. {**CREATE_TABLE**: 1,**ALTER_TABLE**: 2,**DROP_TABLE**: 3}