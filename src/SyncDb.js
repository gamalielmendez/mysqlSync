const DriverMysql = require('./DriverMysql')
const { EnumActions } = require('./Consts')

module.exports = class SyncDb extends DriverMysql {

    constructor(TargetCnn, SourceCnn) {
        
        super(TargetCnn, SourceCnn)

        this.TablesDiff = {}
        this.ViewsDiff = {}
        this.ProceduresDiff = {}
        this.FunctionsDiff = {}
        this.lExecuteCompare=false

    }

    async Compare() {

        try {
            
            await this.InitConections()
            this.TablesDiff      = await this.getCompareTables()
            this.ViewsDiff       = await this.getCompareViews()
            this.ProceduresDiff  = await this.getCompareProcedures()
            this.FunctionsDiff   = await this.getCompareFunctions()
            this.lExecuteCompare = true

            return true

        } catch (error) {
            console.log(error)    
            return false
        }

    }

    async Sync() {

        try {

            if(!this.lExecuteCompare){ await this.Compare() }
            
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
                    const cCols = await this.CompareFields(cTablaRespaldo,key)
                    //se insertan los registros en la tabla nueva
                    await this.Cnn1.query("INSERT INTO "+key+"(" + cCols + ") SELECT "+cCols+" FROM "+cTablaRespaldo )
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

                }else if(Table.Action == EnumActions.ALTER_TABLE){
                    
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
                }else if(Table.Action == EnumActions.ALTER_TABLE){
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
                }else if(Table.Action == EnumActions.ALTER_TABLE){
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

    async PrepareSync(){
   
        await this.Cnn1.beginTransaction()
        await this.Cnn1.query( "CREATE DATABASE IF NOT EXISTS " +this.Cnn1.cDataBase )
        await this.Cnn1.query( "SET FOREIGN_KEY_CHECKS = 0" )

    }

    async FinalizeSync(){
        
        await this.Cnn1.query( "SET FOREIGN_KEY_CHECKS = 1" )
        await this.Cnn1.commit()
        
        this.lExecuteCompare=false
        this.TablesDiff = {}
        this.ViewsDiff = {}
        this.ProceduresDiff = {}
        this.FunctionsDiff = {}
        this.lExecuteCompare=false

    }

    async InitConections(){

        if(!this.Cnn1.isConnected){ await this.Cnn1.connect() }
        if(!this.Cnn2.isConnected){ await this.Cnn2.connect() }

    }

    async ReleaseConections(){

        if(this.Cnn1.isConnected){ await this.Cnn1.release() }
        if(this.Cnn2.isConnected){ await this.Cnn2.release() }

    }
}