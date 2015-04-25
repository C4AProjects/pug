/**
 * Created by opips on 4/25/15.
 * Contains the custom error messages
 */
'use strict';
module.exports={
    MISSING_USERNAME:{
        status:400,
        code:1024,
        message:'Validation Failed',
        errors:[{
            "code":5401,
            "field":"username",
            "message":"Username cannot be blank"
        }]
    },
    MISSING_PASSWORD:{
        status:400,
        code:1024,
        message:'Validation Failed',
        errors:[{
            "code":5402,
            "field":"password",
            "message":"Password cannot be blank"
        }]
    },
    WRONG_USERNAME_PASSWORD_COMBINATION:{
        status:400,
        code:1025,
        message:'Your Password/Username combination is awful!'
    },
    ACCOUNT_TEMPORARILY_LOCKED:{
        status:400,
        code:1026,
        message:'Account has been temporarily locked'
    },
    INTERNAL_SERVER_ERROR:{
        status:500,
        code:1010,
        message:'Something went wrong on our end. Try again'
    }

};