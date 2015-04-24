/**
 * Created by opips on 4/24/15.
 */
'use strict';
var  member=require('../models/member');
//register user routes
exports.registerRoute=function(app){
    member.register(app, '/v1/members');
};
