const DriverMysql = require('./DriverMysql')
const { EnumActions } = require('./Consts')

module.exports = class SyncDb extends DriverMysql {

    constructor(TargetCnn, SourceCnn, config) {

        super(TargetCnn, SourceCnn)

        this.TablesDiff = {}
        this.ViewsDiff = {}
        this.ProceduresDiff = {}
        this.FunctionsDiff = {}
        this.lExecuteCompare = false

    }

    async Compare() {

        try {

            await this.InitConections()
            this.TablesDiff = await this.getCompareTables()
            this.ViewsDiff = await this.getCompareViews()
            this.ProceduresDiff = await this.getCompareProcedures()
            this.FunctionsDiff = await this.getCompareFunctions()
            this.lExecuteCompare = true

            return true

        } catch (error) {
            console.log(error)
            return false
        }

    }

    async Sync() {

        try {

            if (!this.lExecuteCompare) { await this.Compare() }

            await this.InitConections()
            await this.PrepareSync()
            await this.SyncTables()
            await this.SyncViews()
            await this.SyncProcedures()
            await this.SyncFunctions()
            await this.FinalizeSync()

            return true

        } catch (error) {

            console.log(error)
            await this.Cnn1.rollback()
            return false

        }

    }

    async SyncTables() {

        if (Object.keys(this.TablesDiff).length > 0) {

            for (const key in this.TablesDiff) {

                const Table = this.TablesDiff[key]

                if (Table.Action == EnumActions.CREATE_TABLE || Table.Action == EnumActions.DROP_TABLE) {

                    //se crea la tabla
                    await this.Cnn1.query(Table.ActionQuery)

                } else if (Table.Action == EnumActions.ALTER_TABLE) {

                    //se respalda la tabla
                    const cTablaRespaldo = `${key}_${Math.floor(Math.random() * 101)}`
                    await this.Cnn1.query("CREATE TABLE " + cTablaRespaldo + " SELECT * FROM " + key)
                    //se elimina la tabla original
                    await this.Cnn1.query("DROP TABLE IF EXISTS " + key)
                    // se crea la nueva tabla
                    await this.Cnn1.query(Table.ActionQuery)
                    //se ontienen las columnas de la tabla
                    const cCols = await this.CompareFields(cTablaRespaldo, key)
                    //se insertan los registros en la tabla nueva
                    await this.Cnn1.query("INSERT INTO " + key + "(" + cCols + ") SELECT " + cCols + " FROM " + cTablaRespaldo)
                    //se elimina la tabla de respaldo
                    await this.Cnn1.query("DROP TABLE IF EXISTS " + cTablaRespaldo)

                }

            }

        }

    }

    async SyncViews() {

        if (Object.keys(this.ViewsDiff).length > 0) {

            for (const key in this.ViewsDiff) {

                const Table = this.ViewsDiff[key]

                if (Table.Action == EnumActions.CREATE_TABLE || Table.Action == EnumActions.DROP_TABLE) {

                    //se crea el objeto nuevo
                    await this.Cnn1.query(Table.ActionQuery)

                } else if (Table.Action == EnumActions.ALTER_TABLE) {

                    //se elimina el objeto anterior
                    await this.Cnn1.query(Table.DropAction)
                    //se crea el objeto nuevo
                    await this.Cnn1.query(Table.ActionQuery)

                }

            }

        }

    }

    async SyncProcedures() {

        if (Object.keys(this.ProceduresDiff).length > 0) {

            for (const key in this.ProceduresDiff) {

                const Table = this.ProceduresDiff[key]

                if (Table.Action == EnumActions.CREATE_TABLE || Table.Action == EnumActions.DROP_TABLE) {
                    //se crea la tabla
                    await this.Cnn1.query(Table.ActionQuery)
                } else if (Table.Action == EnumActions.ALTER_TABLE) {
                    //se elimina el objeto anterior
                    await this.Cnn1.query(Table.DropAction)
                    //se crea el objeto nuevo
                    await this.Cnn1.query(Table.ActionQuery)
                }

            }

        }

    }

    async SyncFunctions() {

        if (Object.keys(this.FunctionsDiff).length > 0) {

            for (const key in this.FunctionsDiff) {

                const Table = this.FunctionsDiff[key]

                if (Table.Action == EnumActions.CREATE_TABLE || Table.Action == EnumActions.DROP_TABLE) {
                    //se crea la tabla
                    await this.Cnn1.query(Table.ActionQuery)
                } else if (Table.Action == EnumActions.ALTER_TABLE) {
                    //se elimina el objeto anterior
                    await this.Cnn1.query(Table.DropAction)
                    //se crea el objeto nuevo
                    await this.Cnn1.query(Table.ActionQuery)
                }

            }

        }

    }

    async CompareFields(objectS, objectT) {

        const aColsSource = await this.Cnn1.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" + this.Cnn1.cDatabase + "' AND TABLE_NAME = '" + objectS + "'")
        const aColsTarget = await this.Cnn1.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" + this.Cnn1.cDatabase + "' AND TABLE_NAME = '" + objectT + "'")

        const Result = aColsTarget.reduce((P, C) => {

            const findFunc = (element) => element.COLUMN_NAME === C.COLUMN_NAME;
            const Index = aColsSource.findIndex(findFunc)

            if (Index !== -1) { P += C.COLUMN_NAME + "," }
            return P

        }, '')

        return Result.substr(0, Result.length - 1)
    }

    async PrepareSync() {

        await this.Cnn1.beginTransaction()
        await this.Cnn1.query("CREATE DATABASE IF NOT EXISTS " + this.Cnn1.cDataBase)
        await this.Cnn1.query("SET FOREIGN_KEY_CHECKS = 0")

    }

    async FinalizeSync() {

        await this.Cnn1.query("SET FOREIGN_KEY_CHECKS = 1")
        await this.Cnn1.commit()

        this.lExecuteCompare = false
        this.TablesDiff = {}
        this.ViewsDiff = {}
        this.ProceduresDiff = {}
        this.FunctionsDiff = {}
        this.lExecuteCompare = false

    }

    async CopyTable(TableName, SourceSchema, TargetSchema, lData=false) {

        try {

            //se inician las conexiones en caso de que no esten conectadas
            await this.InitConections()
            //se obtiene la estructura de la tabla
            await this.Cnn2.query(`USE ${SourceSchema}`)
            const cTable = await this.GetStructure(this.Cnn2, TableName, 'BASE TABLE')
            const cDrop = await this.GetDropQuery(TableName, 'BASE TABLE')

            //se elimina la table en el destino
            await this.Cnn1.query(`USE ${TargetSchema}`)
            await this.Cnn1.query(cDrop)
            
            //se crea la tabla
            await this.Cnn1.query(cTable)

            //se valida si se copia con datos
            if(lData){

                //se obtienen la cantidad de registros
                await this.Cnn2.query(`USE ${SourceSchema}`)
                const [Count]=await this.Cnn2.query(`SELECT COUNT(*) AS COUNT FROM ${SourceSchema}.${TableName}`)
                if(Count.COUNT>0){

                  let last= Math.ceil(Count.COUNT/1000)    
                  let start= 1
                  let end = last;
                  let current=0

                  for ( let i = start ; i <= end; i++ ) {

                    //se ejecuta el query se use para prevenir error en seleccion de base de datos
                    await this.Cnn2.query(`USE ${SourceSchema}`) 
                    //se obtienen los registros
                    const Rows=await this.Cnn2.query(`SELECT * FROM ${SourceSchema}.${TableName} LIMIT ${current},1000`)
                    current+=1000
                    
                    if(Rows.length>0){

                        //se selecciona la base de datos para asegurar copiado correcto
                        await this.Cnn1.query(`USE ${SourceSchema}`)

                        //se insertan los datos  en el destino
                        let fiels=Object.keys(Rows[0]).reduce((P,C,I)=>{ return (`${P}${(I===0)?'':','}${C}`) },'') 
    
                        const aInsert=Rows.reduce((P,C)=>{

                            const Fila=Object.keys(C).reduce((Prev,Field)=>{ 
                                Prev.push(C[Field])
                                return Prev
                            },[]) 

                            P.push(Fila)
                            return P

                        },[])

                        const cSQL=`INSERT INTO ${TargetSchema}.${TableName}(${fiels}) VALUES ?`
                        await this.Cnn1.query(cSQL,[aInsert]) 

                    }

                  }

                }
            }

        } catch (error) {
            console.log(error)
            return false
        }


    }

    async InitConections() {

        if (!this.Cnn1.isConnected) { await this.Cnn1.connect() }
        if (!this.Cnn2.isConnected) { await this.Cnn2.connect() }

    }

    async ReleaseConections() {

        if (this.Cnn1.isConnected) { await this.Cnn1.release() }
        if (this.Cnn2.isConnected) { await this.Cnn2.release() }

    }
}