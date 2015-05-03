/**
 * Created by opips on 4/11/15.
 */
'use strict';
module.exports={
    db:'mongodb://localhost/pug-prod',
    mongoose: {
        debug: false
    },
    dbOptions:{
        db: {
            native_parser: true,
            w: 1,
            numberOfRetries: 2
        },
        server: {
            poolSize: 5,
            socketOptions: {
            keepAlive: 1
         }
        },
        replset: {
            rs_name: 'myReplicaSetName'
        },
        user: 'dbUsername',
        pass: 'dbPassword'
    },
    http:{
        port:8083,
        /*host:'127.0.0.1'*/
        host:'10.240.84.40'
    },
    facebook: {
        clientID: 'DEFAULT_APP_ID',
        clientSecret: 'APP_SECRET',
        callbackURL: 'http://localhost:3000/auth/facebook/callback'
    },
    twitter: {
        clientID: 'DEFAULT_CONSUMER_KEY',
        clientSecret: 'CONSUMER_SECRET',
        callbackURL: 'http://localhost:3000/auth/twitter/callback'
    },
    google: {
        clientID: 'DEFAULT_APP_ID',
        clientSecret: 'APP_SECRET',
        callbackURL: 'http://localhost:3000/auth/google/callback'
    },
    emailFrom: 'SENDER EMAIL ADDRESS', // sender address like ABC <abc@example.com>
    mailer: {
        service: 'SERVICE_PROVIDER', // Gmail, SMTP
        auth: {
            user: 'EMAIL_ID',
            pass: 'PASSWORD'
        }
    }
};
