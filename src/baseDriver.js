
 class BaseDriver{

    constructor(cnn1,cnn2){

        //se almacenan las conexiones
        this.cnn1=cnn1
        this.cnn1=cnn2

    }

    async _select(cQuery,cnn){
        /**
         * 
         * 
         LOCAL out:={}
        LOCAL oDs

        cQuery:=StrTran(cQuery,'<<BASENAME>>',ocnn:cDatabase)

        oDs:=ocnn:Query(cQuery)
        oDs:Open()

        WITH OBJECT out:= TMemDataSet():New()
            :Create()
            :Open(oDs:GetRows(),oDs:FieldNames())
        END WITH

        oDs:Close()
        oDs:End()
        */

        cQuery=cQuery.replace('<<BASENAME>>','')
    }

}

mudule.export=BaseDriver