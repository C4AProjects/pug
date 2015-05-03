/**
 * Created by opips on 4/12/15.
 */
/**
 * Add other custom end points specific to {{User Model}} here
 * @Todo {JohnAdamsy} figure out best way to have the model routes implemented here. Bypassing all controllers in the interim
 * */
var mongoose=require('mongoose'),
    UserSchema=mongoose.model('User');
var validateSearchTerm = function(req, res, next) {
    var username=req.body.username,pwd=req.body.password;
    if (!username) return res.send(CUSTOM_ERROR.MISSING_USERNAME); //throw missing username error
    if (!pwd) return res.send(CUSTOM_ERROR.MISSING_PASSWORD); //throw missing password error
    req.body.username =username.toLowerCase();
    return next(); // Call the handler
};


//middleware before post
var beforePost = function(req, res, next) {
    var username=req.body.username,pwd=req.body.password,userObject={pug_credentials:{username:'',password:''}};
    if (!username) return res.send(CUSTOM_ERROR.MISSING_USERNAME); //throw missing username error
    if (!pwd) return res.send(CUSTOM_ERROR.MISSING_PASSWORD); //throw missing password error
    req.body.username =username.toLowerCase();

    userObject.pug_credentials.username=req.body.username;
    userObject.pug_credentials.password=req.body.password;
    //console.log(userObject);
    req.body=userObject;
    return next(); // Call the handler
};

//middleware before put
var beforePut=function(req,res,next) {
    var username = req.body.username, pwd = req.body.password, userObject = {
        pug_credentials: {
            username: '',
            password: ''
        }, updated_at: Date.now()
    };

    if (pwd) {
        bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
            if (err) return next(err);
            console.log('begin hashing');
            // hash the password using our new salt
            bcrypt.hash(pwd, salt, function (err, hash) {
                if (err) return next(err);

                if(username)
                    userObject.pug_credentials.username = req.body.username;

                // override the clear text password with the hashed one
                //req.body.password = hash;
                userObject.pug_credentials.password = hash;

                console.log('hashed 1:' + hash);
                req.body = userObject;
                next();
            });
        });
    }else{
        userObject.pug_credentials.username = req.body.username;
        console.log('hashed 1:' + hash);
        req.body = userObject;
        next();
    }


    /*if (username){
     console.log('hashed 2:'+req.body.password);
     req.body.username = username.toLowerCase();
     userObject.pug_credentials.username = req.body.username;

     //return next();
     }*/

};


var User =restful.model('user',UserSchema)
    .removeOptions({
        sort: 'field -created_at'
    })
    .includeSchema(true);
User.methods([
    'get',
    'post',
    'put',
    'delete'])
    .route('login', { //This should be exposed as /v1/users/login
        handler: function (req, res, next) {
            User.getAuthenticated(req.body.username, req.body.password, function (err, user, reason) {
                if (err) {
                    console.log(LOG_TAG+'/login:->internal error'+'---details: '+err.message);
                    return next(CUSTOM_ERROR.INTERNAL_SERVER_ERROR); // Error handling
                }

                if (user) {
                    //user is authenticated
                    //res.status = 200;
                    console.log(LOG_TAG+'/login:->login success');
                    //delete user.pug_credentials.password;
                    return res.send({status:200,data:user});
                } else {
                    //user could not be logged in
                    //determine why they could not be logged on
                    var reasons=User.failedLogin;
                    switch(reason){
                        case reasons.NOT_FOUND:
                        case reasons.PASSWORD_INCORRECT:
                            var response=CUSTOM_ERROR.WRONG_USERNAME_PASSWORD_COMBINATION;
                            console.log(LOG_TAG+'/login:->login failed. Reason: '+JSON.stringify(response));
                            return res.send(response);
                            break;
                        case reasons.MAX_ATTEMPTS:
                            response=CUSTOM_ERROR.ACCOUNT_TEMPORARILY_LOCKED;
                            console.log(LOG_TAG+'/login:->login failed. Reason: '+JSON.stringify(response));
                            return res.send(response);
                            break;
                    }

                }


            });
        },
        detail: false, // detail makes sure we have one model to work on, in this case we don't need from the client
        methods: ['post'] // only respond to POST requests via this end point
    })
    .route('reset', { //This should be exposed as /v1/users/reset
        handler: function (req, res, next) {
            User.getAuthenticated(req.body.username, req.body.password, function (err, user, reason) {
                if (err) {
                    console.log(LOG_TAG+'/reset:->internal error'+'---details: '+err.message);
                    return next(CUSTOM_ERROR.INTERNAL_SERVER_ERROR); // Error handling
                }

                if (user) {
                    //user is authenticated
                    //res.status = 200;
                    console.log(LOG_TAG+'/reset:->reset success');
                    //delete user.pug_credentials.password;
                    return res.send({status:200,data:user});
                } else {
                    //user could not be logged in
                    //determine why they could not be logged on
                    var reasons=User.failedLogin;
                    switch(reason){
                        case reasons.NOT_FOUND:
                        case reasons.PASSWORD_INCORRECT:
                            var response=CUSTOM_ERROR.WRONG_USERNAME_PASSWORD_COMBINATION;
                            console.log(LOG_TAG+'/login:->login failed. Reason: '+JSON.stringify(response));
                            return res.send(response);
                            break;
                        case reasons.MAX_ATTEMPTS:
                            response=CUSTOM_ERROR.ACCOUNT_TEMPORARILY_LOCKED;
                            console.log(LOG_TAG+'/login:->login failed. Reason: '+JSON.stringify(response));
                            return res.send(response);
                            break;
                    }

                }


            });
        },
        detail: false, // detail makes sure we have one model to work on, in this case we don't need from the client
        methods: ['post'] // only respond to POST requests via this end point
    })
    .before('post', beforePost)
    .after('post', noop)
    .before('put', beforePut)
    .after('put', noop)
    .before('login', validateSearchTerm); //before searching ensure we have a search item
//.after('login', after);

function noop(req, res, next) { next(); }

exports = module.exports = User;
