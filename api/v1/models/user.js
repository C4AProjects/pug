/**
 * User model
 * @param null
 * @returns Module
 */
var restful=require('node-restful'),
    mongoose = require('mongoose'),
    uniqueValidator = require('mongoose-unique-validator'),
    bcrypt = require('bcrypt'),
    moment=require('moment'),
    LOG_TAG=moment().format('ddd')+' '+moment().format()+' /user',
    SALT_WORK_FACTOR = 10,
    MAX_LOGIN_ATTEMPTS = 5, // max of 5 attempts
    LOCK_TIME = (1/12) * 60 * 60 * 1000; //lock account for 5 minutes

var UserSchema=mongoose.Schema({
    user_type: {type: String, default: 'player'},
    pug_credentials: {
        username: {type: String, required: true, index: true, unique: true,lowercase:true},
        password: {type: String, required: true}
    },
    oauth_credentials: {
        facebook: {id: {type: String, default: null}, token: {type: String, default: null}},
        twitter: {id: {type: String, default: null}, token: {type: String, default: null}},
        google: {id: {type: String, default: null}, token: {type: String, default: null}}
    },
    account_rescue: {reset_id: {type: String, default: null}, expires_on: {type: Date, default: null}},
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now},
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Number,default:null }
})


UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.pug_credentials.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
}
UserSchema.methods.incLoginAttempts = function(cb) {// if we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.update({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        }, cb);
    }
    // otherwise we're incrementing
    var updates = { $inc: { loginAttempts: 1 } };
    // lock the account if we've reached max attempts and it's not locked already
    if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + LOCK_TIME };
    }
    return this.update(updates, cb);
}
UserSchema.plugin(uniqueValidator,{ message: 'Username {VALUE} is already taken.'});

UserSchema.virtual('isLocked').get(function() {// check for a future lockUntil timestamp
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * pre-save functions. E.g hash password,set password reset token expiry datetime, compare passwords
 * */
UserSchema.pre('save', function (next) {
    var user=this;
    //change the username to lower case
    user.pug_credentials.username=user.pug_credentials.username.toLowerCase();
    // next();

// only hash the password if it has been modified (or is new)
    if (!user.isModified('pug_credentials.password')) return next();

// generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.pug_credentials.password, salt, function(err, hash) {
            if (err) return next(err);

            // override the clear text password with the hashed one
            user.pug_credentials.password = hash;
            next();
        });
    });


});


// expose enum on the model, and provide an internal convenience reference
var reasons = UserSchema.statics.failedLogin = {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    MAX_ATTEMPTS: 2
};

UserSchema.statics.getAuthenticated = function(username, password, cb) {
    this.findOne({ 'pug_credentials.username': username }, function(err, user) {
        if (err) return cb(err);

        // make sure the user exists
        if (!user) {
            return cb(null, null, reasons.NOT_FOUND);
        }

        // check if the account is currently locked
        if (user.isLocked) {
            // just increment login attempts if account is already locked
            return user.incLoginAttempts(function(err) {
                if (err) return cb(err);
                return cb(null, null, reasons.MAX_ATTEMPTS);
            });
        }

        // test for a matching password
        user.comparePassword(password, function(err, isMatch) {
            if (err) return cb(err);

            // check if the password was a match
            if (isMatch) {
                // if there's no lock or failed attempts, just return the user
                if (!user.loginAttempts && !user.lockUntil) return cb(null, user);
                // reset attempts and lock info
                var updates = {
                    $set: { loginAttempts: 0 },
                    $unset: { lockUntil: 1 }
                };
                return user.update(updates, function(err) {
                    if (err) return cb(err);
                    return cb(null, user);
                });
            }

            // password is incorrect, so increment login attempts before responding
            user.incLoginAttempts(function(err) {
                if (err) return cb(err);
                return cb(null, null, reasons.PASSWORD_INCORRECT);
            });
        });
    });
};

/**
 * @Todo JohnAdamsy hide {password,loginAttempts,lockUntil} field on response object to client
 *
 * */


/**
 * Some post-save functions
 * */


/**
 * Note this must return a query object.
 * @param q
 * @param username
 */
UserSchema.statics.findUserLike = function findUserLike(q, username) {
    var search = username && username.length ? username.shift() : q && q.username;
    if (!search)
        return this.find({_id: null});

    return this.find({'pug_credentials.username': new RegExp(search, 'i')});
}

/*UserSchema.methods.findCommentsLike = function (q, term) {
 var search = term || q.title;
 return this.find({comments: new RegExp(search, 'i')});
 }*/

//compare a password. Useful for user login with a pug password
/* UserSchema.methods.comparePassword = function(candidatePassword, cb) {
 bcrypt.compare(candidatePassword, this.pug_credentials.password, function(err, isMatch) {
 if (err) return cb(err);
 cb(null, isMatch);
 });
 };*/

//transform schema object
UserSchema.set('toJSON', {
    transform: function(doc, ret, options) {
        var retJson = {
            id: ret._id,
            updated_at: ret.updated_at,
            created_at: ret.created_at,
            name:ret.pug_credentials.username,
            user_type:ret.user_type
        };
        return retJson;
    }
});

var validateSearchTerm = function(req, res, next) {
    if (!req.body.username || !req.body.password)
        var response={
            status:400,
            code:1024,
            message:'Validation Failed',
            errors:[{
                "code":5402,
                "field":"password",
                "message":"Password cannot be blank"
            },
                {"code":5401,
                    "field":"username",
                    "message":"Username cannot be blank"}]
        };

    return next(response); // We can also throw an error from a before route
    req.body.username = req.body.username.toLowerCase();
    return next(); // Call the handler
};

//var transformObject=function(req,)



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
    .route('login', { //This should be exposed as /v1/user/login
        handler: function (req, res, next) {
            // User.Model.find({'pug_credentials.username': new RegExp(search, 'i')}, function(err, list) {
            //console.log(LOG_TAG+' DEBUG:->'+req.body.username);
            User.getAuthenticated(req.body.username, req.body.password, function (err, user, reason) {
                if (err) {
                    console.log(LOG_TAG+'/login:->internal error');
                    return next({status: 500, code: 1010, message: 'Something went wrong on our end. Try again'}); // Error handling
                }

                if (user) {
                    //user is authenticated
                    //res.status = 200;
                    console.log(LOG_TAG+'/login:->login success');
                    delete user.pug_credentials.password;
                    return res.send({status:200,data:user});
                } else {
                    //user could not be logged in
                    //determine why they could not be logged on
                    var reasons=User.failedLogin;
                    switch(reason){
                        case reasons.NOT_FOUND:
                        case reasons.PASSWORD_INCORRECT:
                            res.status = 400;
                            response={
                                status: 400,
                                code: 1025,
                                message: 'Invalid Password/Username combination'
                            };
                            console.log(LOG_TAG+'/login:->login failed. Reason: '+JSON.stringify(response));
                            return res.send(response);
                            break;
                        case reasons.MAX_ATTEMPTS:
                            response={
                                status: 400,
                                code: 1026,
                                message: 'Account has been temporarily locked'
                            }
                            console.log(LOG_TAG+'/login:->login failed. Reason: '+JSON.stringify(response));
                            return res.send(response);
                            break;
                    }

                }


            });
        },
        detail: false, // detail makes sure we have one model to work on, in this case we don't need from the client
        methods: ['post'] // only respond to GET requests via this end point
    })
    .before('post', noop)
    .after('post', noop)
    .before('put', noop)
    .after('put', noop)
    .before('login', validateSearchTerm); //before searching ensure we have a search item
//.after('login', after);

function noop(req, res, next) { next(); }

//module.exports = mongoose.model('User', UserSchema);
mongoose.model('User', UserSchema);
exports = module.exports = User;