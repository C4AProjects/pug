/**
 * Created by opips on 4/12/15.
 */
var express = require('express'),
    mongoose = require('mongoose'),
    app = module.exports = express(),
    bodyParser=require('body-parser'),
    userRoute=require('./users'),
    memberRoute=require('./members'),
    defaultRoute=require('../controllers/index'),
//multer = require('multer'),
    moment = require('moment'),
    fs = require('fs'),
    morgan = require('morgan'),
    //pkg=require('../package.json'),
    uuid = require('node-uuid'), //to generate uuid
    config=require('../config/'+app.get('env'));



// setup the logger
//app.use(morgan(':id :method :url :response-time'));
app.use(morgan('combined'));


//app.use(morgan(':id :method :url :response-time'));

app.use(bodyParser.json()); // parse application/json
//app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
//app.use(multer());// parse multipart/form-data
app.use(express.query());
//app.set('view engine', 'jade');

app.mongoose = mongoose; // used for testing

try {
    var connection = mongoose.connect(config.db); //connect to mongo
    console.log(moment().format('ddd') + ' ' + moment().format() + ' SYSTEM:-> PUG api connected to db server at %s ', config.db);
}catch(error){
    console.log(moment().format('ddd') + ' ' + moment().format() + ' SYSTEM:->PUG api failed to connect to db server at %s ', config.db);
}


//register root endpoint
app.route('/').get(defaultRoute.rootEndPoint);
app.route('/v1').get(defaultRoute.rootEndPoint);
/*app.get('/v1',function(req,res){
    res.send(rootEndPoint);
});

app.get('/',function(req,res){
    res.send(rootEndPoint);
});*/

//only run this in test environment
if(app.get('env')==='test'){
    require('pow-mongoose-fixtures').load('../data', connection); //preload db with test data
}

//register all other custom routes
/**
 * Todo JohnAdamsy ;1. better versioning method. 2. Also create modular routes for each available model [done!] 3. Custom search other than than the available filters
 * */
//userRoute.registerRoute(app);
//memberRoute.registerRoute(app);

//config.http.port=3001;
if (!module.parent) {
    app.listen(config.http.port,config.http.host,function() {
        console.log(moment().format('ddd') + ' ' + moment().format() + ' SYSTEM:-> PUG api listening in %s mode  on port %d', app.get('env'), config.http.port);
    });
}