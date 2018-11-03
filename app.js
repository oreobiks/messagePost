'use strict';
const http = require('http');
const knex = require('knex')({
    client: 'pg',
    connection: 'postgres://uqodmdzt:iSXHFi2ct0gx6x1uuPJMh7y3ew1WJqcn@pellefant.db.elephantsql.com:5432/uqodmdzt',
    version: '10.4'
});

// create table if not exists
knex.schema.hasTable('message_list').then((exist) => {
    if(!exist){
        knex.schema.createTable('message_list', t => {
            t.uuid('id').notNullable().primary();
            t.string('message_contents', 200);
            t.timestamp('received_ts');
        })
    }
}).error((error) => {
    console.log(error);
});

// initial function that goes into createServer
var init = (request, response) => {
    if(request.method == 'POST'){
        if(request.url == '/insert'){
            insert(request, response);
        }else{
            apiResponse(200, 'fare', response);
        }
    }else{
        apiResponse(200, 'fare', response);
    }
};

// Post method
var insert = (request, response) => {
    let data = "";
    request.on('data', chunck => {
        data = chunck.toString();
        let body = validJson(data);
        let collection = formCollectionData(body);
        if(collection.length){
            knex('message_list')
            .insert(collection)
            .then( success => {
                apiResponse(200, "Data inserted successfully", response);
            })
            .catch( error => {
                let message = error.detail ? error.detail : error.message
                apiResponse(500, message ? message : 'Unknown error occured', response);
            })
        }else{
            apiResponse(400, "Please check your payload", response);
        }
    }); // on data event, for parse body payloads
    request.on('error', error => {
        apiResponse(400, "Something wrong with the payload", response);
    });
    request.on('end', () => {
        if(!data.length){
            apiResponse(400, "Something wrong with the payload", response);
        }
    });
}

// overall response method
function apiResponse(statusCode, message, response){
    var success = statusCode <= 200 ? true : false;
    response.writeHead(statusCode, {'content-type':'application/json'});
    response.write(JSON.stringify({
        "success": success,
        "message": message
    }));
    response.end();
}

function getTableData(request, response){
    knex.select().table('message_list')
    .then( rec => {
    })
    .error( error => {
        console.error(error);
    })
}

function validJson(json){
    try {
        return JSON.parse(json);
    } catch (error) {
        return null;
    }
}

function validUuid(id){
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

function getCurrentTimeStamp(){
    return new Date().toISOString();
}


//Validation on payload
function formCollectionData(body){
    let collection = [];
    if(body instanceof Array){
        body.forEach(element => {
            if(element.id && validUuid(element.id)){
                var obj = {
                    'id': element.id,
                    'received_ts': element.timestamp ? element.timestamp : getCurrentTimeStamp(),
                    'message_contents': element.message ? element.message : ""
                }
                collection.push(Object.assign({}, obj));
            }
        });
    }else{
        if(body && body.id && validUuid(body.id)){
            var obj = {
                'id': body.id,
                'received_ts': body.timestamp ? body.timestamp : getCurrentTimeStamp(),
                'message_contents': body.message ? body.message : ""
            }
            collection.push(obj);
        }
    }
    return collection;
}

http.createServer(init).listen(3000);


