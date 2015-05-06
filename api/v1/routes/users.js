/**
 * Created by opips on 4/24/15.
 */
'use strict';
var  user=require('../controllers/users');
//register user routes
exports.registerRoute=function(app){
    user.register(app, '/v1/users');
};
