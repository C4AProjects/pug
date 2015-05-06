/**
 * User model
 * @param null
 * @returns Module
 */
var CUSTOM_ERROR=require('../utils/errors'),
    mongoose = require('mongoose'),
    Schema=mongoose.Schema,
    uniqueValidator = require('mongoose-unique-validator'),
    bcrypt = require('bcrypt'),
    moment=require('moment'),
    LOG_TAG=moment().format('ddd')+' '+moment().format()+' /user',
    SALT_WORK_FACTOR = 10,
    MAX_LOGIN_ATTEMPTS = 5, // max of 5 attempts
    LOCK_TIME = (1/12) * 60 * 60 * 1000; //lock account for 5 minutes

var UserSchema=new Schema({
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
});


UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.pug_credentials.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};
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
};
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

    //user.updated_at=Date.now;

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

var hashPassword=function(req,res,next){
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(req.body.password, salt, function(err, hash) {
            if (err) return next(err);

            // override the clear text password with the hashed one
            req.body.password = hash;
            next();
        });
    });
};

/**
 * Some post-save functions
 * */
UserSchema.post('save', function (doc) {
    console.log(LOG_TAG+' SECURITY LOG: -> %s has been saved', doc._id);
    next();
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
 * @Todo JohnAdamsy hide {password,loginAttempts,lockUntil} field on response object to client..[done!]
 *
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
};

/*UserSchema.methods.findCommentsLike = function (q, term) {
 var search = term || q.title;
 return this.find({comments: new RegExp(search, 'i')});
 }*/


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
        return ret; /**@ToDo JohnAdamsy return the transformed object {retJson}*/
    }
});

mongoose.model('User', UserSchema);
//module.exports =  UserSchema;
//mongoose.model('User', UserSchema);