const { EnumActions } = require('./Consts')

Object.defineProperty(Array.prototype, 'unique', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function () {
        var a = this.concat();
        for (var i = 0; i < a.length; ++i) {
            for (var j = i + 1; j < a.length; ++j) {
                if (a[i] === a[j])
                    a.splice(j--, 1);
            }
        }

        return a;
    }
});

module.exports = class BaseDriver {

    constructor(TargetCnn, SourceCnn) {
        this.Cnn1 = TargetCnn
        this.Cnn2 = SourceCnn
    }

    async _select(cQuery, Cnn) {

        let out
        cQuery = cQuery.replace('<<BASENAME>>', Cnn.cDatabase)
        out = await Cnn.query(cQuery)
        return out

    }

    async _getCompareArray(cQuery, diffMode = false, ifOneLevelDiff = false, cType = 'BASE TABLE') {

        const TArray = await this._prepareOutArray(await this._select(cQuery, this.Cnn1), diffMode, ifOneLevelDiff)
        const SArray = await this._prepareOutArray(await this._select(cQuery, this.Cnn2), diffMode, ifOneLevelDiff)

        //se obtienen todas las tablas 
        const allTables = this.MergeKeys(Object.keys(TArray), Object.keys(SArray))
        let Actions = {}

        for (let index = 0; index < allTables.length; index++) {

            const C = allTables[index];

            if (!(C in TArray)) {

                Actions[C] = {
                    Action: EnumActions.CREATE_TABLE,
                    ActionQuery: await this.GetStructure(this.Cnn2, C, cType),
                    DropAction:this.GetDropQuery(C, cType)
                }

            } else if (!(C in SArray)) {

                Actions[C] = {
                    Action: EnumActions.DROP_TABLE,
                    ActionQuery: this.GetDropQuery(C, cType),
                    DropAction:this.GetDropQuery(C, cType)
                }

            } else {

                const allFields = this.MergeKeys(Object.keys(TArray[C]), Object.keys(SArray[C]))
                for (let J = 0; J < allFields.length; J++) {
                    const Field = allFields[J]
                    if (!(Field in SArray[C])) {
                        Actions[C] = {
                            Action: EnumActions.ALTER_TABLE,
                            ActionQuery: await this.GetStructure(this.Cnn2, C, cType),
                            DropAction:this.GetDropQuery(C, cType)
                        }
                        break
                    } else if (!(Field in TArray[C])) {
                        Actions[C] = {
                            Action: EnumActions.ALTER_TABLE,
                            ActionQuery: await this.GetStructure(this.Cnn2, C, cType),
                            DropAction:this.GetDropQuery(C, cType)
                        }
                        break
                    } else if ((Field in TArray[C]) && (Field in SArray[C])) {
                        if ('dtype' in TArray[C][Field] && 'dtype' in SArray[C][Field]) {

                            if ((TArray[C][Field]['dtype'] !== SArray[C][Field]['dtype'])) {
                                Actions[C] = {
                                    Action: EnumActions.ALTER_TABLE,
                                    ActionQuery: await this.GetStructure(this.Cnn2, C, cType),
                                    DropAction:this.GetDropQuery(C, cType)
                                }
                                break
                            }

                        }
                    }

                }

            }

        }

        return Actions
    }

    async _prepareOutArray(result, diffMode, ifOneLevelDiff) {

        const Res = result.reduce((P, C) => {

            const cKey = C.ARRAY_KEY_1

            if (diffMode) {

                const aTmp = C.ARRAY_KEY_2.split('\n')
                const Diffs = aTmp.reduce((Pr, Val) => {

                    P[Val] = { ...C }
                    return Pr

                }, {})

                P[cKey] = Diffs

            } else {

                if (ifOneLevelDiff) {

                    P[cKey] = { ...C }

                } else {

                    const cKey2 = C.ARRAY_KEY_2
                    if (typeof P[cKey] === 'undefined') {
                        P[cKey] = {}
                    }

                    P[cKey][cKey2] = { ...C }

                }
            }

            return P
        }, {})

        return Res

    }

    MergeKeys(a1, a2) {
        const Res = a1.concat(a2).unique();
        return Res
    }

    async GetStructure(Cnn, cObject, cType) {

        let CSQL = `SHOW CREATE TABLE ${cObject}`
        let keyAction = ''

        if (cType === 'BASE TABLE') {
            CSQL = `SHOW CREATE TABLE ${cObject}`
            keyAction = 'Create Table'
        } else if (cType === 'VIEW') {
            CSQL = `SHOW CREATE VIEW ${cObject}`
            keyAction = 'Create View'
        } else if (cType === 'PROCEDURE') {
            CSQL = `SHOW CREATE PROCEDURE ${cObject}`
            keyAction = 'Create Procedure'
        } else if (cType === 'FUNCTION') {
            CSQL = `SHOW CREATE FUNCTION ${cObject}`
            keyAction = 'Create Function'
        } else if (cType === 'TRIGGER') {
            CSQL = `SHOW CREATE TRIGGER ${cObject}`
            keyAction = 'Create Trigger'
        }

        const Code = await Cnn.query(CSQL)
        return Code[0][keyAction]

    }

    GetDropQuery(cObject, cType) {

        let Query = ''

        if (cType === 'BASE TABLE') {
            Query = `DROP TABLE IF EXISTS ${cObject}`
        } else if (cType === 'VIEW') {
            Query = `DROP VIEW IF EXISTS ${cObject}`
        } else if (cType === 'PROCEDURE') {
            Query = `DROP PROCEDURE IF EXISTS ${cObject}`
        } else if (cType === 'FUNCTION') {
            Query = `DROP FUNCTION IF EXISTS ${cObject}`
        } else if (cType === 'TRIGGER') {
            Query = `DROP TRIGGER IF EXISTS ${cObject}`
        }

        return Query
    }

}
