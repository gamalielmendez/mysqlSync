const BaseDriver = require('./BaseDriver')

module.exports = class DriverMysql extends BaseDriver {

    constructor(TargetCnn, SourceCnn) {
        super(TargetCnn, SourceCnn)
    }

    async getCompareTables() { return await this._getTableAndViewResult('BASE TABLE') }
    async getCompareViews() { return await this._getTableAndViewResult('VIEW') }
    async getCompareProcedures() { return await this._getRoutineResult('PROCEDURE') }
    async getCompareFunctions() { return await this._getRoutineResult('FUNCTION') }

    async getAdditionalTableInfo() {

        const cType = 'BASE TABLE'
        const query = `SELECT TABLE_NAME ARRAY_KEY_1,ENGINE engine,TABLE_COLLATION collation
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = '<<BASENAME>>' AND
                    TABLE_TYPE = '${cType}'`

        return await this._getCompareArray(query, false, true, cType)

    }

    async getCompareKeys() {

        const query = `SELECTCONCAT(TABLE_NAME, '[', INDEX_NAME, ']') ARRAY_KEY_1,COLUMN_NAME  ARRAY_KEY_2,CONCAT('(' , SEQ_IN_INDEX, ')') dtype
                FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = '<<BASENAME>>'
                ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`

        return await this._getCompareArray(query, false, false, 'KEYS')

    }

    async getCompareTriggers() {

        const query = `SELECT
                CONCAT(EVENT_OBJECT_TABLE, '::' , TRIGGER_NAME, ' [', EVENT_MANIPULATION, '/',  ACTION_ORIENTATION, '/', ACTION_TIMING, '] - ', ACTION_ORDER) ARRAY_KEY_1,
                ACTION_STATEMENT ARRAY_KEY_2,'' dtype
            FROM information_schema.TRIGGERS
            WHERE TRIGGER_SCHEMA = '<<BASENAME>>'`

        return await this._getCompareArray(query, false, false, 'TRIGGERS')

    }

    async _getTableAndViewResult(cType) {

        const query = `SELECT cl.TABLE_NAME ARRAY_KEY_1,cl.COLUMN_NAME ARRAY_KEY_2,
        cl.COLUMN_TYPE dtype,cl.COLUMN_DEFAULT VALOR_DEFAULT,cl.COLUMN_COMMENT COMENTARIO
        FROM information_schema.columns cl,  information_schema.TABLES ss
        WHERE cl.TABLE_NAME = ss.TABLE_NAME AND
            cl.TABLE_SCHEMA = '<<BASENAME>>' AND
            ss.TABLE_TYPE = '${cType}'
        ORDER BY cl.table_name`

        return await this._getCompareArray(query, false, false, cType)

    }

    async _getRoutineResult(cType) {

        const query = `SELECT ROUTINE_NAME ARRAY_KEY_1,ROUTINE_DEFINITION ARRAY_KEY_2,'' dtype
                FROM information_schema.ROUTINES
                WHERE ROUTINE_SCHEMA = '<<BASENAME>>' AND
                    ROUTINE_TYPE = '${cType}'
                ORDER BY ROUTINE_NAME`

        return await this._getCompareArray(query, false, false, cType)

    }
    
}
